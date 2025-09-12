import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../lib/supabase-server';
import { emailTemplates, emailConfig } from '../../../lib/emailTemplates';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  let requestData = null;
  try {
    // Create Supabase client with proper cookie handling
    const supabase = await createServerSupabaseClient();
    
    // Check authentication first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      return NextResponse.json(
        { 
          message: 'Authentication required',
          error: authError?.message || 'No user session found'
        },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, email, full_name')
      .eq('id', user.id)
      .single();

    console.log('🔍 User data check:', { userData, userError: userError?.message });

    if (userError) {
      console.error('❌ Failed to fetch user data:', userError);
      return NextResponse.json(
        { 
          message: 'Failed to fetch user data',
          error: userError.message
        },
        { status: 500 }
      );
    }

    if (userData?.role !== 'admin') {
      console.error('❌ Admin access required:', { userRole: userData?.role });
      return NextResponse.json(
        { 
          message: 'Admin access required',
          error: `User role is '${userData?.role}', admin required`
        },
        { status: 403 }
      );
    }

    requestData = await request.json();
    const { email, businessName, adminNotes } = requestData;

    if (!email || !businessName) {
      return NextResponse.json(
        { message: 'Email and business name are required' },
        { status: 400 }
      );
    }

    // Create invitation link with secure token
    const invitationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const invitationLink = `${process.env.NEXT_PUBLIC_SITE_URL}/signup?invited=true&email=${encodeURIComponent(email)}&token=${invitationToken}`;
    
    // Store invitation in database
    console.log('🔍 Attempting to insert invitation:', {
      email,
      businessName,
      token: invitationToken,
      adminNotes
    });

    const { data: invitation, error: invitationError } = await supabase
      .from('vendor_invitations')
      .insert({
        email: email,
        business_name: businessName,
        token: invitationToken,
        admin_notes: adminNotes,
        created_by: user.id
      })
      .select()
      .single();

    if (invitationError) {
      console.error('Error storing invitation:', invitationError);
      throw new Error('Failed to store invitation');
    }
    
    // Log the invitation (in production, you'd send an email)
    console.log('🎉 VENDOR INVITATION SENT:', {
      email,
      businessName,
      adminNotes,
      invitationLink,
      token: invitationToken,
      invitationId: invitation.id,
      timestamp: new Date().toISOString(),
      expiresAt: invitation.expires_at
    });

    // TODO: Implement actual email sending with a service like:
    // - Resend (recommended for Next.js)
    // - SendGrid
    // - AWS SES
    // - Nodemailer with SMTP
    
    // Generate beautiful email using our template
    const emailData = {
      businessName,
      email,
      invitationLink,
      adminNotes,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    };
    
    const emailTemplate = {
      to: email,
      subject: emailTemplates.vendorInvitation.subject(businessName),
      html: emailTemplates.vendorInvitation.html(emailData)
    };
    
    console.log('📧 BEAUTIFUL EMAIL TEMPLATE GENERATED:', {
      to: email,
      subject: emailTemplate.subject,
      htmlLength: emailTemplate.html.length,
      templateData: emailData
    });
    
    // Send email using Resend
    let emailStatus = { sent: false, error: null, emailId: null };
    
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        const emailResult = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'GoaFYI <noreply@goafyi.com>',
          to: email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        });

        emailStatus = {
          sent: true,
          error: null,
          emailId: emailResult.data?.id
        };

        console.log('📧 EMAIL SENT SUCCESSFULLY:', {
          emailId: emailResult.data?.id,
          to: email,
          subject: emailTemplate.subject
        });

      } catch (emailError) {
        emailStatus = {
          sent: false,
          error: emailError.message,
          emailId: null
        };
        console.error('❌ EMAIL SENDING FAILED:', emailError);
      }
    } else {
      emailStatus = {
        sent: false,
        error: 'RESEND_API_KEY not configured',
        emailId: null
      };
      console.warn('⚠️ RESEND_API_KEY not found - email not sent');
    }

    return NextResponse.json(
      { 
        message: emailStatus.sent ? 'Invitation sent successfully' : 'Invitation stored but email failed to send',
        invitationLink: `${process.env.NEXT_PUBLIC_SITE_URL}/signup?invited=true&email=${encodeURIComponent(email)}`,
        emailStatus: emailStatus,
        invitationId: invitation.id
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ ERROR SENDING INVITATION:', {
      error: error.message,
      stack: error.stack,
      requestData: requestData,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        message: 'Failed to send invitation',
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
