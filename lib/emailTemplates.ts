// Email template configuration
export const emailTemplates = {
  vendorInvitation: {
    subject: (businessName: string) => `You're invited to join Goa.fyi.life`,
    
    html: (data: {
      businessName: string;
      email: string;
      invitationLink: string;
      adminNotes?: string;
      siteUrl: string;
    }) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You're invited to join Goa.fyi.life</title>
        <style>
          body { margin:0; padding:0; background:#f5f7fb; font-family: Arial, sans-serif; }
          .container { max-width:640px; margin:0 auto; padding:28px 12px; }
          .card { background:#fff; border-radius:10px; padding:28px; box-shadow:0 6px 18px rgba(20,20,40,0.06); }
          img { max-width:100%; height:auto; display:block; }
          h1 { font-size:20px; margin:0 0 8px; color:#111827; }
          p { font-size:15px; line-height:1.45; color:#334155; margin:0 0 16px; }
          .btn { display:inline-block; padding:12px 20px; border-radius:8px; text-decoration:none; font-weight:600; background:#8b2e2e; color:#fff; }
          .muted { color:#94a3b8; font-size:13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div style="text-align: center; padding-bottom: 18px;">
            <img
              src="https://xcysisadopixruhdgjoa.supabase.co/storage/v1/object/public/vendor-images/invite/ChatGPT%20Image%20Sep%208,%202025,%2007_14_01%20PM.png"
              alt="Goa.fyi.life"
              width="140"
              style="margin: 0 auto;"
            />
          </div>

          <div class="card">
            <h1>Welcome — You're invited to join Goa.fyi.life</h1>
            <p>Hi ${data.businessName},</p>

            <p>
              Thanks for completing the partner form — we've reviewed your
              submission and would like to invite you to create an account on
              <strong> Goa.fyi.life</strong> so you can list your services and
              start getting bookings.
            </p>

            <p>Click the button below to create your vendor account and finish onboarding.</p>

            <div style="margin-top: 20px;">
              <a class="btn" href="${data.invitationLink}" target="_blank" rel="noopener noreferrer">
                Create your vendor account
              </a>
            </div>

            <p class="muted" style="margin-top: 18px;">
              If the button doesn't work, copy & paste this link into your browser:
              <br />
              <a href="${data.invitationLink}" style="color: #37517e; word-break: break-all;">
                ${data.invitationLink}
              </a>
            </p>

            ${data.adminNotes ? `
            <hr style="border: none; border-top: 1px solid #eef2f7; margin: 20px 0 18px;" />
            <p style="margin-bottom: 6px;">
              <strong>Admin Notes:</strong>
            </p>
            <p class="muted">
              ${data.adminNotes}
            </p>
            ` : ''}

            <hr style="border: none; border-top: 1px solid #eef2f7; margin: 20px 0 18px;" />

            <p style="margin-bottom: 6px;">
              <strong>Need help?</strong>
            </p>
            <p class="muted">
              Reply to this email or contact support at <a href="mailto:onboardinginvite@goafyi.life">onboardinginvite@goafyi.life</a>.
            </p>

            <p class="muted" style="margin-top: 16px;">
              This invite was sent because you applied to become a partner at Goa.fyi.life.
            </p>
          </div>

          <div style="text-align: center; color: #94a3b8; font-size: 13px; padding: 20px 0 40px;">
            Goa.fyi.life · <a href="https://goafyi.life" style="color: inherit; text-decoration: underline;">goafyi.life</a>
            <br />
            If you did not expect this email, you can ignore it.
          </div>
        </div>
      </body>
      </html>
    `
  }
};

// Email service configuration
export const emailConfig = {
  // Choose your email service
  service: 'resend', // 'resend' | 'sendgrid' | 'ses' | 'nodemailer'
  
  // Resend configuration (recommended)
  resend: {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.RESEND_FROM_EMAIL || 'GoaFYI <noreply@goafyi.com>'
  },
  
  // SendGrid configuration
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    from: 'noreply@goafyi.com'
  },
  
  // AWS SES configuration
  ses: {
    region: 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    from: 'noreply@goafyi.com'
  }
};
