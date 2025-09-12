# 📧 Resend Email Setup Guide

## 🚀 **Complete Setup Instructions**

### **Step 1: Install Resend**
```bash
npm install resend
```

### **Step 2: Get Your Resend API Key**
1. Go to [resend.com](https://resend.com)
2. Sign up for an account
3. Go to **API Keys** section
4. Create a new API key
5. Copy the key (starts with `re_`)

### **Step 3: Add Environment Variables**
Add to your `.env.local` file:
```env
# Resend Configuration
RESEND_API_KEY=re_xxxxxxxxx
NEXT_PUBLIC_SITE_URL=https://goafyi.life

# Optional: Customize sender email
RESEND_FROM_EMAIL=noreply@goafyi.com
```

### **Step 4: Verify Domain (Important!)**
1. In Resend dashboard, go to **Domains**
2. Add your domain: `goafyi.life`
3. Add the DNS records to your domain provider
4. Wait for verification (can take a few minutes)

**Without domain verification, emails will be sent from Resend's domain and might go to spam!**

## 🧪 **Testing Your Setup**

### **Option 1: Use the Test Page**
1. Go to `/admin/test-email`
2. Enter your email address
3. Click "Send Test Email"
4. Check your inbox!

### **Option 2: Test via Admin Panel**
1. Go to `/admin/vendor-onboarding`
2. Approve a vendor application
3. Choose "Send invitation" method
4. Check console for email details

## 📧 **What Emails Will Be Sent**

### **Vendor Invitation Email:**
- **Subject**: "Welcome to GoaFYI - Your Vendor Application Has Been Approved! 🎉"
- **Content**: Professional HTML email with:
  - GoaFYI branding and logo
  - Business name and approval message
  - "Create Your Vendor Account" button
  - Benefits of joining GoaFYI
  - Admin notes (if any)
  - 7-day expiration notice

### **Test Email:**
- **Subject**: "🧪 GoaFYI Email Test"
- **Content**: Simple test email to verify configuration

## 🔧 **Configuration Details**

### **Current Setup:**
- ✅ **Resend integration** in invitation API
- ✅ **Beautiful HTML templates** with branding
- ✅ **Error handling** - won't fail if email fails
- ✅ **Logging** - tracks email success/failure
- ✅ **Test functionality** - verify setup works

### **Email Features:**
- 🎨 **Professional design** with gradients
- 📱 **Mobile responsive** layout
- 🔗 **Secure invitation links** with tokens
- ⏰ **Expiration notices** (7 days)
- 📝 **Admin notes** included
- 🎯 **Clear call-to-action** buttons

## 🚨 **Important Notes**

### **Domain Verification:**
- **Required** for production emails
- **Without it**: Emails sent from Resend domain
- **With it**: Emails sent from your domain
- **Better deliverability** with verified domain

### **Rate Limits:**
- **Free tier**: 3,000 emails/month
- **Paid plans**: Higher limits available
- **Check your usage** in Resend dashboard

### **Spam Prevention:**
- ✅ **Use your domain** for "from" address
- ✅ **Professional HTML** templates
- ✅ **Clear subject lines**
- ✅ **Proper email structure**

## 🎯 **Next Steps**

1. **Install Resend**: `npm install resend`
2. **Add API key** to environment variables
3. **Verify your domain** in Resend dashboard
4. **Test the setup** using `/admin/test-email`
5. **Approve a vendor** to test real invitation emails

## 🔍 **Troubleshooting**

### **Email Not Sending:**
- Check API key is correct
- Verify domain is verified
- Check console for error messages
- Ensure environment variables are set

### **Emails Going to Spam:**
- Verify your domain in Resend
- Use professional email templates
- Avoid spam trigger words
- Test with different email providers

### **API Errors:**
- Check Resend dashboard for usage limits
- Verify API key permissions
- Check network connectivity
- Review error logs in console

## 📊 **Monitoring**

### **Resend Dashboard:**
- **Email delivery** statistics
- **Bounce rates** and issues
- **API usage** and limits
- **Domain status** and health

### **Your App Logs:**
- **Email success/failure** in console
- **Invitation creation** tracking
- **Token validation** logs
- **Error handling** details

---

**Your Resend email system is now ready! Test it and start sending beautiful vendor invitations!** 🚀📧
