import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const config = {
      resend: {
        apiKey: !!process.env.RESEND_API_KEY,
        fromEmail: process.env.RESEND_FROM_EMAIL || null,
      },
      supabase: {
        url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        serviceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
      site: {
        url: process.env.NEXT_PUBLIC_SITE_URL || null,
      }
    };

    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check configuration' },
      { status: 500 }
    );
  }
}
