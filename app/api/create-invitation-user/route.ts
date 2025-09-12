import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { email, password, businessName, invitationToken } = await request.json();

    if (!email || !password || !businessName || !invitationToken) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create admin client with service role key to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Validate invitation token
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('vendor_invitations')
      .select('*')
      .eq('token', invitationToken)
      .eq('status', 'pending')
      .single();

    if (invitationError || !invitation) {
      return NextResponse.json(
        { message: 'Invalid or expired invitation' },
        { status: 400 }
      );
    }

    // Create user account with email_confirm: true (no email confirmation needed)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Skip email confirmation for invitation-based signups
      user_metadata: {
        full_name: businessName,
        role: 'vendor'
      }
    });

    if (authError) {
      console.error('Error creating user account:', authError);
      return NextResponse.json(
        { message: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Create user record in users table
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: email,
        full_name: businessName,
        role: 'vendor'
      });

    if (userError) {
      console.error('Error creating user record:', userError);
      return NextResponse.json(
        { message: 'Failed to create user record' },
        { status: 500 }
      );
    }

    // Create vendor profile
    const { data: vendor, error: vendorError } = await supabaseAdmin
      .from('vendors')
      .insert({
        user_id: authData.user.id,
        business_name: businessName,
        description: invitation.admin_notes || null,
        category: 'General', // Default category, can be updated later
        location: 'Goa', // Default location, can be updated later
        contact_email: email,
        contact_phone: null, // Can be updated later
        website: null, // Can be updated later
        is_verified: true // Invitation-based vendors are pre-verified
      })
      .select()
      .single();

    if (vendorError) {
      console.error('Error creating vendor profile:', vendorError);
      return NextResponse.json(
        { message: 'Failed to create vendor profile' },
        { status: 500 }
      );
    }

    // Mark invitation as used
    const { error: updateError } = await supabaseAdmin
      .from('vendor_invitations')
      .update({
        status: 'used',
        used_at: new Date().toISOString(),
        used_by: authData.user.id
      })
      .eq('token', invitationToken);

    if (updateError) {
      console.error('Error updating invitation status:', updateError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json(
      { 
        message: 'Account created successfully',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          email_confirmed_at: authData.user.email_confirmed_at
        },
        vendor: vendor
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error creating invitation user:', error);
    return NextResponse.json(
      { message: 'Failed to create account' },
      { status: 500 }
    );
  }
}
