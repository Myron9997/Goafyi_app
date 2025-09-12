import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { email, token } = await request.json();

    if (!email || !token) {
      return NextResponse.json(
        { message: 'Email and token are required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Validate invitation token from database
    const { data: invitation, error } = await supabase
      .from('vendor_invitations')
      .select('*')
      .eq('email', email)
      .eq('token', token)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !invitation) {
      return NextResponse.json(
        { message: 'Invalid or expired invitation' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Valid invitation',
        valid: true,
        email: email
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error validating invitation:', error);
    return NextResponse.json(
      { message: 'Failed to validate invitation' },
      { status: 500 }
    );
  }
}
