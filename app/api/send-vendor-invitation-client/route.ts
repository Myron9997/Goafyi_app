import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { emailTemplates } from '../../../lib/emailTemplates';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  try {
    const { email, businessName, adminNotes, userId, userRole } = await request.json();

    if (!email || !businessName) {
      return NextResponse.json(
        { message: 'Email and business name are required' },
        { status: 400 }
      );
    }

    // Validate that user info is provided
    if (!userId || !userRole) {
      return NextResponse.json(
        { message: 'User authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (userRole !== 'admin') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    console.log('🔐 CLIENT AUTH INVITATION:', { 
      email, businessName, adminNotes, userId, userRole 
    });

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

    const supabase = await createServerSupabaseClient();

    // Verify the user exists and is admin (double-check)
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role, email, full_name')
      .eq('id', userId)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json(
        { 
          message: 'Invalid admin user',
          error: 'User verification failed'
        },
        { status: 403 }
      );
    }

    // Test vendor_invitations table
    try {
      const { data: testQuery, error: testError } = await supabaseAdmin
        .from('vendor_invitations')
        .select('count')
        .limit(1);
      
      if (testError) {
        return NextResponse.json(
          { 
            message: 'vendor_invitations table does not exist',
            error: testError.message,
            suggestion: 'Please run the vendor_invitations_table.sql script in your Supabase dashboard'
          },
          { status: 400 }
        );
      }
    } catch (tableError) {
      return NextResponse.json(
        { 
          message: 'Failed to access vendor_invitations table',
          error: tableError.message
        },
        { status: 500 }
      );
    }

    // Create invitation token and link
    const invitationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const invitationLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002'}/signup?invited=true&email=${encodeURIComponent(email)}&token=${invitationToken}`;
    
    // Insert invitation into database
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('vendor_invitations')
      .insert({
        email: email,
        business_name: businessName,
        token: invitationToken,
        admin_notes: adminNotes,
        created_by: userId
      })
      .select()
      .single();

    if (invitationError) {
      console.error('❌ Database insert failed:', invitationError);
      return NextResponse.json(
        { 
          message: 'Failed to store invitation in database',
          error: invitationError.message
        },
        { status: 500 }
      );
    }

    // Generate and send email
    const emailData = {
      businessName,
      email,
      invitationLink,
      adminNotes,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002'
    };
    
    const emailTemplate = {
      to: email,
      subject: emailTemplates.vendorInvitation.subject(businessName),
      html: emailTemplates.vendorInvitation.html(emailData)
    };
    
    // Send email using Resend
    let emailStatus = { sent: false, error: null, emailId: null };
    
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        const emailResult = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'GoaFYI <noreply@goafyi.life>',
          to: email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        });

        emailStatus = {
          sent: true,
          error: null,
          emailId: emailResult.data?.id
        };

        console.log('✅ Email sent successfully:', emailStatus);
      } catch (emailError) {
        emailStatus = {
          sent: false,
          error: emailError.message,
          emailId: null
        };
        console.error('❌ Email sending failed:', emailError);
      }
    } else {
      emailStatus = {
        sent: false,
        error: 'RESEND_API_KEY not configured',
        emailId: null
      };
    }

    return NextResponse.json(
      { 
        message: emailStatus.sent ? 'Invitation sent successfully' : 'Invitation stored but email failed to send',
        invitationLink,
        emailStatus,
        invitationId: invitation.id,
        user: {
          id: userId,
          role: userRole,
          name: userData.full_name
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Client auth invitation error:', error);
    return NextResponse.json(
      { 
        message: 'Failed to send invitation',
        error: error.message
      },
      { status: 500 }
    );
  }
}
