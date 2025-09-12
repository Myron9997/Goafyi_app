# 🔒 Secure Invitation-Only Vendor Signup System

## 🎯 **Problem Solved**

The public `/signup` link was too obvious and could be accessed by anyone. Now we have a **secure invitation-only system** that prevents unauthorized access.

## 🛡️ **How It Works**

### **1. Invitation-Only Access**
- **Public `/signup`** now shows "Access Restricted" message
- **Only valid invitation links** can access the signup form
- **Tokens are stored in database** with expiration dates
- **Automatic token validation** prevents unauthorized access

### **2. Secure Flow**
1. **Admin approves** vendor application
2. **System generates** secure token and stores in database
3. **Email sent** with invitation link containing token
4. **Vendor clicks link** → token validated → access granted
5. **Token expires** after 7 days automatically

## 🚀 **Setup Instructions**

### **Step 1: Create Database Table**
Run this SQL in Supabase:
```sql
-- Run the vendor_invitations_table.sql file
-- This creates the invitations table with RLS policies
```

### **Step 2: Update Environment Variables**
Add to your `.env.local`:
```env
NEXT_PUBLIC_SITE_URL=https://goafyi.life
# Add your Resend API key when ready
RESEND_API_KEY=re_xxxxxxxxx
```

### **Step 3: Test the System**
1. **Go to admin panel** → Vendor Onboarding
2. **Approve an application** with "Send invitation" method
3. **Check console** for invitation link
4. **Try accessing** `/signup` directly (should show "Access Restricted")
5. **Use invitation link** (should work)

## 🔧 **Current Routes**

### **Public Routes (Anyone can access):**
- `/` - Homepage
- `/vendor-login` - Vendor login
- `/viewer-login` - Viewer login
- `/vendor/[id]` - View vendor profiles

### **Protected Routes (Invitation required):**
- `/signup` - **Now invitation-only!**
- `/vendor-onboarding` - Actual signup form (redirected from /signup)

### **Admin Routes (Admin only):**
- `/admin/dashboard` - Admin dashboard
- `/admin/vendor-onboarding` - Review applications
- `/admin/email-templates` - Customize emails

## 📧 **Email Integration with Resend**

### **Install Resend:**
```bash
npm install resend
```

### **Update API to Send Real Emails:**
In `app/api/send-vendor-invitation/route.ts`, replace the TODO section with:

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Send actual email
await resend.emails.send({
  from: 'GoaFYI <noreply@goafyi.com>',
  to: email,
  subject: emailTemplate.subject,
  html: emailTemplate.html,
});
```

## 🎨 **Customization Options**

### **Change Expiration Time:**
In `vendor_invitations_table.sql`, modify:
```sql
expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
```

### **Customize Access Denied Message:**
Edit `app/signup/page.tsx` - the "Access Restricted" section

### **Add More Security:**
- **Rate limiting** on invitation validation
- **IP-based restrictions**
- **Additional token validation**

## 🔍 **Testing the Security**

### **Test 1: Direct Access (Should Fail)**
```
https://goafyi.life/signup
```
**Expected:** "Access Restricted" message

### **Test 2: Invalid Token (Should Fail)**
```
https://goafyi.life/signup?invited=true&email=test@example.com&token=invalid
```
**Expected:** "Access Restricted" message

### **Test 3: Valid Invitation (Should Work)**
```
https://goafyi.life/signup?invited=true&email=vendor@example.com&token=abc123def456
```
**Expected:** Welcome screen with "Create Your Vendor Account" button

## 🚨 **Security Features**

- ✅ **Token-based authentication**
- ✅ **Database-stored tokens**
- ✅ **Automatic expiration** (7 days)
- ✅ **Email validation**
- ✅ **One-time use tokens** (can be implemented)
- ✅ **Admin-only token creation**
- ✅ **RLS policies** for database security

## 📱 **User Experience**

### **For Unauthorized Users:**
- Clear "Access Restricted" message
- Instructions on how to get an invitation
- Links to homepage and login

### **For Invited Vendors:**
- Professional welcome screen
- Clear next steps
- Secure account creation process

## 🎯 **Benefits**

1. **Security**: No unauthorized signups
2. **Control**: Admin controls who can sign up
3. **Professional**: Clean, branded experience
4. **Scalable**: Easy to add more security features
5. **User-friendly**: Clear messaging and instructions

---

**Your vendor signup is now secure and invitation-only!** 🔒✨
