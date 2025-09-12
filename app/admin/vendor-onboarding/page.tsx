'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminProtectedRoute from '../../../components/AdminProtectedRoute';
import { supabase } from '../../../lib/supabase';
import { Check, X, Eye, FileText, Mail, Phone, MapPin, Globe, Calendar, ArrowLeft } from 'lucide-react';

interface VendorOnboardingApplication {
  id: string;
  business_name: string;
  categories: string[];
  email: string;
  phone: string;
  full_address: string;
  website: string | null;
  description: string | null;
  fssai_license: string | null;
  business_license: string | null;
  gst_certificate: string | null;
  other_documents: string[] | null;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

function VendorOnboardingContent() {
  const router = useRouter();
  const [applications, setApplications] = useState<VendorOnboardingApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<VendorOnboardingApplication | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'under_review' | 'approved' | 'rejected'>('all');
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [approvalMethod, setApprovalMethod] = useState<'auto' | 'invite'>('invite');
  const [customPassword, setCustomPassword] = useState('');

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vendor_onboarding_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading applications:', error);
        throw error;
      }
      setApplications(data || []);
    } catch (error) {
      console.error('Error loading applications:', error);
      alert('Failed to load applications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = applications.filter(app => 
    statusFilter === 'all' || app.status === statusFilter
  );

  const handleStatusChange = async (applicationId: string, newStatus: 'approved' | 'rejected') => {
    try {
      setIsProcessing(true);
      
      if (newStatus === 'approved') {
        const application = applications.find(app => app.id === applicationId);
        if (!application) return;

        if (approvalMethod === 'auto') {
          // Auto-create account with password
          const password = customPassword || Math.random().toString(36).slice(-8);
          
          // Create user account
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: application.email,
            password: password,
            email_confirm: true,
            user_metadata: {
              full_name: application.business_name,
              role: 'vendor'
            }
          });

          if (authError) throw authError;

          // Create user record
          const { error: userError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              email: application.email,
              full_name: application.business_name,
              phone: application.phone,
              role: 'vendor'
            });

          if (userError) throw userError;

          // Create vendor record
          const { error: vendorError } = await supabase
            .from('vendors')
            .insert({
              user_id: authData.user.id,
              business_name: application.business_name,
              description: application.description,
              category: application.categories.join(', '),
              location: application.full_address,
              contact_email: application.email,
              contact_phone: application.phone,
              website: application.website,
              is_verified: true
            });

          if (vendorError) throw vendorError;

          // Clear vendor cache to make new vendor show up immediately
          try {
            // Clear localStorage cache
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
              if (key.startsWith('vendor_list_') || key.startsWith('vendor_profile_')) {
                localStorage.removeItem(key);
              }
            });
          } catch (error) {
            console.warn('Failed to clear vendor cache:', error);
          }

          // TODO: Send welcome email with login credentials
          alert(`Account created successfully! Password: ${password}`);
        } else {
          // Send invitation to create account
          try {
            // Get current user info from Supabase client
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError || !user) {
              throw new Error('Authentication required');
            }

            // Get user role from database
            const { data: userData, error: roleError } = await supabase
              .from('users')
              .select('role')
              .eq('id', user.id)
              .single();

            if (roleError || userData?.role !== 'admin') {
              throw new Error('Admin access required');
            }

            const response = await fetch('/api/send-vendor-invitation-client', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: application.email,
                businessName: application.business_name,
                adminNotes: adminNotes,
                userId: user.id,
                userRole: userData.role
              })
            });

            if (response.ok) {
              const data = await response.json();
              
              // Clear vendor cache to make new vendor show up immediately when they sign up
              try {
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                  if (key.startsWith('vendor_list_') || key.startsWith('vendor_profile_')) {
                    localStorage.removeItem(key);
                  }
                });
              } catch (error) {
                console.warn('Failed to clear vendor cache:', error);
              }
              
              if (data.emailStatus && data.emailStatus.sent) {
                alert(`🎉 Invitation sent successfully to ${application.email}!\n\n✅ Email sent with ID: ${data.emailStatus.emailId}\n\nThey will receive an email with instructions to create their account.\n\nInvitation link: ${data.invitationLink}\n\n(Link expires in 7 days)`);
              } else {
                const errorMsg = data.emailStatus?.error || 'Unknown error';
                alert(`⚠️ Application approved but email failed to send!\n\n❌ Email Error: ${errorMsg}\n\n📧 You can manually send the invitation link:\n${data.invitationLink}\n\nOr check your email configuration in /admin/email-config`);
              }
            } else {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Failed to send invitation');
            }
          } catch (error: any) {
            console.error('Error sending invitation:', error);
            alert(`❌ Application approved but failed to send invitation!\n\nError: ${error?.message || 'Unknown error'}\n\nPlease check your email configuration in /admin/email-config`);
          }
        }
      }

      // Update application status
      const { error: updateError } = await supabase
        .from('vendor_onboarding_applications')
        .update({
          status: newStatus,
          admin_notes: adminNotes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', applicationId);

      if (updateError) throw updateError;

      // Reload applications
      await loadApplications();
      setSelectedApplication(null);
      setAdminNotes('');
      setApprovalMethod('invite');
      setCustomPassword('');
      
      alert(`Application ${newStatus} successfully!`);
    } catch (error) {
      console.error('Error updating application:', error);
      alert('Failed to update application. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Vendor Onboarding</h1>
                <p className="text-xs text-gray-500">Review applications</p>
              </div>
            </div>
            <button
              onClick={loadApplications}
              className="px-3 py-2 bg-rose-600 text-white text-sm rounded-lg hover:bg-rose-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Mobile-First Filters */}
        <div className="mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {(['all', 'pending', 'under_review', 'approved', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  statusFilter === status
                    ? 'bg-rose-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  statusFilter === status ? 'bg-rose-500' : 'bg-gray-200'
                }`}>
                  {status === 'all' ? applications.length : applications.filter(app => app.status === status).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Debug Info */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            Debug: {applications.length} total applications, {filteredApplications.length} filtered
          </p>
          {applications.length > 0 && (
            <p className="text-xs text-blue-600 mt-1">
              First app: {applications[0].business_name} - {applications[0].email}
            </p>
          )}
          {applications.length > 0 && (
            <button
              onClick={() => {
                console.log('Test button clicked, setting selected application');
                setSelectedApplication(applications[0]);
              }}
              className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
            >
              Test Modal (First App)
            </button>
          )}
          {selectedApplication && (
            <p className="text-xs text-green-600 mt-1">
              Selected: {selectedApplication.business_name}
            </p>
          )}
        </div>

        {/* Mobile-First Applications List */}
        <div className="space-y-3">
          {filteredApplications.map((application) => (
            <div key={application.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {application.business_name}
                  </h3>
                  <p className="text-xs text-gray-500 truncate">{application.email}</p>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                  {application.status.replace('_', ' ')}
                </span>
              </div>
              
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2">
                  <Phone className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-600">{application.phone}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-3 h-3 text-gray-400 mt-0.5" />
                  <span className="text-xs text-gray-600 line-clamp-2">{application.full_address}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {application.categories.slice(0, 2).map((category) => (
                    <span key={category} className="inline-flex px-2 py-1 text-xs bg-rose-100 text-rose-800 rounded-full">
                      {category}
                    </span>
                  ))}
                  {application.categories.length > 2 && (
                    <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                      +{application.categories.length - 2}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {new Date(application.created_at).toLocaleDateString()}
                </span>
                <button
                  onClick={() => {
                    console.log('View button clicked for application:', application);
                    setSelectedApplication(application);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 text-white text-xs rounded-lg hover:bg-rose-700 transition-colors"
                >
                  <Eye className="w-3 h-3" />
                  View
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredApplications.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
            <p className="text-gray-500 text-sm">
              {statusFilter === 'all' 
                ? 'No vendor applications have been submitted yet.'
                : `No applications with status "${statusFilter}".`
              }
            </p>
          </div>
        )}
      </div>

      {/* Mobile-Optimized Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="bg-red-100 px-4 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {selectedApplication.business_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Applied {new Date(selectedApplication.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedApplication.status)}`}>
                      {selectedApplication.status.replace('_', ' ')}
                    </span>
                    <button
                      onClick={() => setSelectedApplication(null)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="bg-white px-4 py-4 max-h-96 overflow-y-auto">
                <div className="space-y-4">
                  {/* Test Content */}
                  <div className="bg-yellow-100 p-4 rounded-lg">
                    <h4 className="font-bold text-lg">TEST MODAL CONTENT</h4>
                    <p>If you can see this, the modal is working!</p>
                    <p>Application: {selectedApplication.business_name}</p>
                    <p>Email: {selectedApplication.email}</p>
                  </div>
                  {/* Business Information */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Business Information</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{selectedApplication.email}</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{selectedApplication.phone}</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <div className="flex items-start">
                          <MapPin className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                          <span className="text-sm text-gray-900">{selectedApplication.full_address}</span>
                        </div>
                      </div>

                      {selectedApplication.website && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                          <div className="flex items-center">
                            <Globe className="w-4 h-4 text-gray-400 mr-2" />
                            <a href={selectedApplication.website} target="_blank" rel="noopener noreferrer" className="text-sm text-rose-600 hover:text-rose-800">
                              {selectedApplication.website}
                            </a>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Categories</label>
                        <div className="flex flex-wrap gap-2">
                          {selectedApplication.categories.map((category) => (
                            <span key={category} className="inline-flex px-2 py-1 text-xs font-medium bg-rose-100 text-rose-800 rounded-full">
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Documents */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Documents</h4>
                    {!selectedApplication.fssai_license && !selectedApplication.business_license && !selectedApplication.gst_certificate && (!selectedApplication.other_documents || selectedApplication.other_documents.length === 0) && (
                      <p className="text-sm text-gray-500 italic">No documents submitted yet. Can be provided during review process.</p>
                    )}
                    
                    <div className="space-y-2">
                      {selectedApplication.fssai_license && (
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">FSSAI License</span>
                          </div>
                          <a 
                            href={`/api/vendor-documents?path=${encodeURIComponent(selectedApplication.fssai_license)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-rose-600 hover:text-rose-800 underline"
                          >
                            View
                          </a>
                        </div>
                      )}

                      {selectedApplication.business_license && (
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">Business License</span>
                          </div>
                          <a 
                            href={`/api/vendor-documents?path=${encodeURIComponent(selectedApplication.business_license)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-rose-600 hover:text-rose-800 underline"
                          >
                            View
                          </a>
                        </div>
                      )}

                      {selectedApplication.gst_certificate && (
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">GST Certificate</span>
                          </div>
                          <a 
                            href={`/api/vendor-documents?path=${encodeURIComponent(selectedApplication.gst_certificate)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-rose-600 hover:text-rose-800 underline"
                          >
                            View
                          </a>
                        </div>
                      )}

                      {selectedApplication.other_documents && selectedApplication.other_documents.length > 0 && (
                        <div className="space-y-2">
                          {selectedApplication.other_documents.map((doc, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-900">Document {index + 1}</span>
                              </div>
                              <a 
                                href={`/api/vendor-documents?path=${encodeURIComponent(doc)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-rose-600 hover:text-rose-800 underline"
                              >
                                View
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedApplication.description && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <p className="text-sm text-gray-900">{selectedApplication.description}</p>
                    </div>
                  )}

                  {selectedApplication.admin_notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
                      <p className="text-sm text-gray-900">{selectedApplication.admin_notes}</p>
                    </div>
                  )}

                  {/* Admin Notes Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Add Notes</label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-rose-500 focus:border-rose-500"
                      placeholder="Add notes about this application..."
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      You can request additional documents or information from the vendor.
                    </p>
                  </div>

                  {/* Approval Method Selection */}
                  {selectedApplication.status === 'pending' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Approval Method</label>
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <input
                            type="radio"
                            id="send-invite"
                            name="approvalMethod"
                            value="invite"
                            checked={approvalMethod === 'invite'}
                            onChange={(e) => setApprovalMethod(e.target.value as 'invite')}
                            className="mr-2 mt-1"
                          />
                          <div>
                            <label htmlFor="send-invite" className="text-sm font-medium text-gray-700">
                              Send invitation to create account
                            </label>
                            <p className="text-xs text-gray-500 mt-1">
                              ✅ Recommended: Vendor sets their own password and has full control
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <input
                            type="radio"
                            id="auto-create"
                            name="approvalMethod"
                            value="auto"
                            checked={approvalMethod === 'auto'}
                            onChange={(e) => setApprovalMethod(e.target.value as 'auto')}
                            className="mr-2 mt-1"
                          />
                          <div>
                            <label htmlFor="auto-create" className="text-sm font-medium text-gray-700">
                              Auto-create account with password
                            </label>
                            <p className="text-xs text-gray-500 mt-1">
                              ⚠️ Less secure: You'll need to share the password with the vendor
                            </p>
                          </div>
                        </div>
                        
                        {approvalMethod === 'auto' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Custom Password (optional)</label>
                            <input
                              type="text"
                              value={customPassword}
                              onChange={(e) => setCustomPassword(e.target.value)}
                              placeholder="Leave empty for auto-generated password"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-rose-500 focus:border-rose-500"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              If left empty, a random password will be generated and shown after approval.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                {selectedApplication.status === 'pending' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleStatusChange(selectedApplication.id, 'approved')}
                      disabled={isProcessing}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedApplication.id, 'rejected')}
                      disabled={isProcessing}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}
                {selectedApplication.status !== 'pending' && (
                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="w-full px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700"
                  >
                    Close
                  </button>
                )}
              </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VendorOnboardingPage() {
  return (
    <AdminProtectedRoute>
      <VendorOnboardingContent />
    </AdminProtectedRoute>
  );
}