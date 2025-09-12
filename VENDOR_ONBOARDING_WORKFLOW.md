# Vendor Onboarding Workflow

## Overview
The vendor onboarding system has been transformed from a simple signup form to a comprehensive application and approval process. This ensures only verified, legitimate businesses join the platform.

## New Workflow

### 1. Application Submission
- **Form**: `pages/VendorOnboarding.tsx` (replaces `VendorSignup.tsx`)
- **Route**: `/signup` (Partner with us button)
- **Database**: `vendor_onboarding_applications` table

#### Required Fields:
- Business Name
- Service Categories (multiple selection)
- Email Address
- Phone Number
- Full Address
- Business Description

#### Optional Fields:
- Website URL

#### Document Uploads:
- FSSAI License (for food/catering businesses)
- Business License
- GST Certificate
- Other Documents (multiple files)

### 2. Application Storage
- Applications are stored in `vendor_onboarding_applications` table
- Status: `pending` (default)
- No user account is created yet
- No password required

### 3. Admin Review Process
- **Admin Interface**: `/admin/vendor-onboarding`
- **Features**:
  - View all applications with filtering by status
  - Detailed application review with all submitted information
  - Document viewing (file names stored)
  - Admin notes system
  - Approve/Reject functionality

### 4. Approval Process
When an admin approves an application:

1. **User Account Creation**:
   - Creates Supabase auth user with temporary password
   - Creates user record in `users` table with role 'vendor'
   - Email confirmation is automatically set to true

2. **Vendor Profile Creation**:
   - Creates vendor record in `vendors` table
   - Transfers all business information from application
   - Sets `is_verified: true`

3. **Application Status Update**:
   - Updates application status to 'approved'
   - Records review timestamp and admin ID
   - Stores admin notes

### 5. Access Management
- **Approved vendors** can login using their email and temporary password
- **Temporary password** is generated automatically (8 characters)
- **Password reset** should be required on first login
- **Rejected applications** remain in database for record keeping

## Database Schema

### vendor_onboarding_applications Table
```sql
CREATE TABLE vendor_onboarding_applications (
  id UUID PRIMARY KEY,
  business_name TEXT NOT NULL,
  categories TEXT[] NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  full_address TEXT NOT NULL,
  website TEXT,
  description TEXT,
  fssai_license TEXT,
  business_license TEXT,
  gst_certificate TEXT,
  other_documents TEXT[],
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by UUID REFERENCES users(id)
);
```

## Security & Access Control

### Row Level Security (RLS)
- **Admins**: Can view, update all applications
- **Public**: Can create new applications
- **Vendors**: Cannot access applications table

### File Storage
- Currently stores file names only
- **TODO**: Implement actual file storage (AWS S3, Supabase Storage)
- **TODO**: Add file download/viewing functionality for admins

## API Endpoints

### POST /api/vendor-onboarding
- Accepts FormData with business information and files
- Validates email uniqueness
- Stores application in database
- Returns success/error response

## Admin Features

### Application Management
- **Filtering**: By status (all, pending, under_review, approved, rejected)
- **Search**: By business name, email, categories
- **Bulk Actions**: Approve/reject multiple applications
- **Notes**: Add admin notes during review

### Approval Actions
- **Approve**: Creates user account + vendor profile
- **Reject**: Updates status, stores reason
- **Under Review**: Marks for further investigation

## Email Notifications (TODO)
- **Application Submitted**: Confirmation to vendor
- **Application Approved**: Welcome email with login credentials
- **Application Rejected**: Rejection notice with reason
- **New Application**: Notification to admin

## Benefits of New System

1. **Quality Control**: Only verified businesses join
2. **Legal Compliance**: Document verification for licenses
3. **Better UX**: Clear application status tracking
4. **Admin Control**: Full oversight of vendor onboarding
5. **Scalability**: Can handle high volume of applications
6. **Audit Trail**: Complete history of all applications

## Migration Notes

- **Existing vendors**: Unaffected, continue using current system
- **New vendors**: Must go through onboarding process
- **Admin access**: New `/admin/vendor-onboarding` page
- **Database**: Run `vendor_onboarding_table.sql` to create new table

## Next Steps

1. **File Storage**: Implement actual file upload/storage
2. **Email System**: Add notification emails
3. **Password Reset**: Force password change on first login
4. **Analytics**: Track application metrics
5. **Automation**: Auto-approve based on criteria
6. **Integration**: Connect with existing vendor management
