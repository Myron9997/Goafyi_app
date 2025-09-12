import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { userId, businessName, categories, invitationToken } = await request.json();

    if (!userId || !businessName || !categories || !invitationToken) {
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

    // Get invitation details
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

    // Create vendor profile
    const { data: vendor, error: vendorError } = await supabaseAdmin
      .from('vendors')
      .insert({
        user_id: userId,
        business_name: businessName,
        description: invitation.admin_notes || null,
        category: categories.join(', '),
        location: 'Goa', // Default location, can be updated later
        contact_email: invitation.email,
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
        used_by: userId
      })
      .eq('token', invitationToken);

    if (updateError) {
      console.error('Error updating invitation status:', updateError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json(
      { 
        message: 'Vendor profile created successfully',
        vendor: vendor
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error creating vendor profile:', error);
    return NextResponse.json(
      { message: 'Failed to create vendor profile' },
      { status: 500 }
    );
  }
}
