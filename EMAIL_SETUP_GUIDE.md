# 📧 Email Setup Guide for GoaFYI

## 🎯 **Can Supabase Send Custom Emails?**

**Short Answer: No** - Supabase Auth can only send pre-built authentication emails (password reset, email confirmation, etc.). For custom HTML emails like vendor invitations, you need external email services.

## 🚀 **Recommended Email Services**

### **1. Resend (Best for Next.js) - $20/month**
```bash
npm install resend
```

**Setup:**
1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. Add to `.env.local`:
```env
RESEND_API_KEY=re_xxxxxxxxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Usage in your API:**
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'GoaFYI <noreply@goafyi.com>',
  to: 'vendor@example.com',
  subject: 'Welcome to GoaFYI!',
  html: emailTemplate.html,
});
```

### **2. SendGrid (Free tier: 100 emails/day)**
```bash
npm install @sendgrid/mail
```

**Setup:**
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Get your API key
3. Add to `.env.local`:
```env
SENDGRID_API_KEY=SG.xxxxxxxxx
```

### **3. AWS SES (Cheapest: $0.10 per 1,000 emails)**
```bash
npm install @aws-sdk/client-ses
```

**Setup:**
1. Create AWS account
2. Set up SES in your region
3. Add to `.env.local`:
```env
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
```

## 🎨 **Customizing Email Templates**

### **Where to Customize:**
1. **Admin Panel**: Go to `/admin/email-templates`
2. **Code**: Edit `lib/emailTemplates.ts`
3. **Database**: Store templates in Supabase (future feature)

### **What You Can Customize:**
- ✅ **Email subject lines**
- ✅ **Colors** (header, buttons, text)
- ✅ **Logo and branding**
- ✅ **Content sections** (benefits, admin notes)
- ✅ **Link expiration** (1-30 days)
- ✅ **HTML structure** (advanced)

### **Current Templates:**
- 📧 **Vendor Invitation** - When admin approves application
- 📧 **Welcome Email** - After vendor creates account
- 📧 **Reminder Email** - For incomplete setups

## 🔧 **Quick Setup (Resend)**

1. **Install Resend:**
```bash
npm install resend
```

2. **Update your API:**
```typescript
// app/api/send-vendor-invitation/route.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Replace the TODO section with:
if (emailConfig.service === 'resend' && emailConfig.resend.apiKey) {
  await resend.emails.send({
    from: emailConfig.resend.from,
    to: email,
    subject: emailTemplate.subject,
    html: emailTemplate.html,
  });
}
```

3. **Add environment variables:**
```env
RESEND_API_KEY=re_xxxxxxxxx
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

4. **Test it:**
- Go to admin panel
- Approve a vendor application
- Check your email!

## 📱 **Admin Email Template Editor**

Access at: `/admin/email-templates`

**Features:**
- 🎨 **Visual editor** for colors and branding
- 👁️ **Live preview** of emails
- ⚙️ **Content toggles** (show/hide sections)
- 💾 **Save templates** (coming soon)
- 📧 **Multiple templates** (invitation, welcome, reminder)

## 🎯 **Next Steps**

1. **Choose an email service** (Resend recommended)
2. **Set up API keys** in environment variables
3. **Customize templates** in admin panel
4. **Test with real emails**
5. **Monitor delivery rates**

## 🚨 **Important Notes**

- **Domain verification** required for production
- **Email limits** apply (check your service)
- **Spam filters** - test with different email providers
- **Mobile responsive** - templates are mobile-friendly
- **Branding consistency** - use your colors and logo

## 💡 **Pro Tips**

- **Use your domain** for "from" address (not Gmail)
- **Test with multiple email providers** (Gmail, Outlook, etc.)
- **Monitor bounce rates** and delivery issues
- **Keep templates simple** - complex HTML can trigger spam filters
- **Use alt text** for images in emails

---

**Ready to set up emails? Start with Resend - it's the easiest for Next.js apps!** 🚀
