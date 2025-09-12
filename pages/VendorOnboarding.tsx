"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Mail, MapPin, Phone, Globe, FileText, Upload, Check, X } from 'lucide-react';
import { CATEGORIES } from '../constants';

interface VendorOnboardingForm {
  businessName: string;
  categories: string[];
  email: string;
  phone: string;
  fullAddress: string;
  website: string;
  description: string;
  fssaiLicense: File | null;
  businessLicense: File | null;
  gstCertificate: File | null;
  otherDocuments: File[];
}

export default function VendorOnboarding() {
  const router = useRouter();
  const [form, setForm] = useState<VendorOnboardingForm>({
    businessName: '',
    categories: [],
    email: '',
    phone: '',
    fullAddress: '',
    website: '',
    description: '',
    fssaiLicense: null,
    businessLicense: null,
    gstCertificate: null,
    otherDocuments: []
  });

  const [errors, setErrors] = useState<Partial<VendorOnboardingForm>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [tempCategories, setTempCategories] = useState<string[]>([]);

  const validateForm = (): boolean => {
    const newErrors: Partial<VendorOnboardingForm> = {};

    if (!form.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }

    if (form.categories.length === 0) {
      newErrors.categories = 'Please select at least one category';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!form.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!form.fullAddress.trim()) {
      newErrors.fullAddress = 'Full address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof VendorOnboardingForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFileChange = (field: keyof VendorOnboardingForm, file: File | null) => {
    setForm(prev => ({ ...prev, [field]: file }));
  };

  const handleMultipleFileChange = (files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files);
      setForm(prev => ({ ...prev, otherDocuments: [...prev.otherDocuments, ...fileArray] }));
    }
  };

  const removeOtherDocument = (index: number) => {
    setForm(prev => ({
      ...prev,
      otherDocuments: prev.otherDocuments.filter((_, i) => i !== index)
    }));
  };

  const handleCategoryToggle = (category: string) => {
    setForm(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
    if (errors.categories) {
      setErrors(prev => ({ ...prev, categories: undefined }));
    }
  };

  const openCategoryModal = () => {
    setTempCategories(form.categories);
    setShowCategoryModal(true);
  };

  const toggleTempCategory = (category: string) => {
    setTempCategories(prev => (
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    ));
  };

  const saveCategoriesFromModal = () => {
    setForm(prev => ({ ...prev, categories: tempCategories }));
    if (errors.categories && tempCategories.length > 0) {
      setErrors(prev => ({ ...prev, categories: undefined }));
    }
    setShowCategoryModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('businessName', form.businessName);
      formData.append('categories', JSON.stringify(form.categories));
      formData.append('email', form.email);
      formData.append('phone', form.phone);
      formData.append('fullAddress', form.fullAddress);
      formData.append('website', form.website);
      formData.append('description', form.description);

      // Add files if they exist
      if (form.fssaiLicense) formData.append('fssaiLicense', form.fssaiLicense);
      if (form.businessLicense) formData.append('businessLicense', form.businessLicense);
      if (form.gstCertificate) formData.append('gstCertificate', form.gstCertificate);
      
      form.otherDocuments.forEach((file, index) => {
        formData.append(`otherDocument_${index}`, file);
      });

      // Submit to your API endpoint
      const response = await fetch('/api/vendor-onboarding', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        // Show success message and redirect
        alert('Application submitted successfully! We will review your application and get back to you within 2-3 business days. You can provide additional documents during the review process if needed.');
        router.push('/');
      } else {
        const errorData = await response.json();
        setErrors({ email: errorData.message || 'Failed to submit application. Please try again.' });
      }
    } catch (error: any) {
      console.error('Onboarding error:', error);
      setErrors({ email: 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-700 flex items-start justify-center px-4 pt-4">
        <div className="w-full max-w-sm mt-0">
          {/* Header */}
          <div className="relative mb-4">
            <button
              onClick={() => router.back()}
              className="absolute left-0 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 text-center">Partner with GoaFYI</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center mt-1">
              Join our platform and grow your business
            </p>
          </div>

          {/* Onboarding Form */}
          <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl shadow-sm p-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Business Name */}
              <div>
                <label htmlFor="businessName" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Business Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    id="businessName"
                    name="businessName"
                    value={form.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 shadow-sm ${errors.businessName ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-rose-500/40 focus:border-rose-500/60'}`}
                    placeholder="Enter your business name"
                  />
                </div>
                {errors.businessName && <p className="text-sm text-red-600 mt-1">{errors.businessName}</p>}
              </div>

              {/* Categories */}
              <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Service Categories *
              </label>
                <button
                  type="button"
                  onClick={openCategoryModal}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors text-left"
                >
                  {form.categories.length > 0
                    ? `Selected: ${form.categories.join(', ')}`
                    : 'Select categories'}
                </button>
                {errors.categories && <p className="text-sm text-red-600 mt-1">{errors.categories}</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 shadow-sm ${errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-rose-500/40 focus:border-rose-500/60'}`}
                    placeholder="Enter your email address"
                  />
                </div>
                {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={form.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 shadow-sm ${errors.phone ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-rose-500/40 focus:border-rose-500/60'}`}
                    placeholder="Enter your phone number"
                  />
                </div>
                {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
              </div>

              {/* Full Address */}
              <div>
                <label htmlFor="fullAddress" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Address *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea
                    id="fullAddress"
                    name="fullAddress"
                    rows={3}
                    value={form.fullAddress}
                    onChange={(e) => handleInputChange('fullAddress', e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 shadow-sm resize-none ${errors.fullAddress ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-rose-500/40 focus:border-rose-500/60'}`}
                    placeholder="Enter your complete business address"
                  />
                </div>
                {errors.fullAddress && <p className="text-sm text-red-600 mt-1">{errors.fullAddress}</p>}
              </div>

              {/* Website */}
              <div>
                <label htmlFor="website" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Website (Optional)
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={form.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/60 shadow-sm"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Business Description
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={form.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/60 shadow-sm resize-none"
                    placeholder="Tell us about your business and services"
                  />
                </div>
              </div>

              {/* Document Uploads */}
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300">Documents (Optional)</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Submit now or provide later during review.
                </p>
                
                {/* FSSAI License (for food businesses) */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    FSSAI License (for food/catering)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange('fssaiLicense', e.target.files?.[0] || null)}
                    className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100"
                  />
                </div>

                {/* Business License */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Business License
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange('businessLicense', e.target.files?.[0] || null)}
                    className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100"
                  />
                </div>

                {/* GST Certificate */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    GST Certificate
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange('gstCertificate', e.target.files?.[0] || null)}
                    className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100"
                  />
                </div>

                {/* Other Documents */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Other Documents (if any)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    multiple
                    onChange={(e) => handleMultipleFileChange(e.target.files)}
                    className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100"
                  />
                  {form.otherDocuments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {form.otherDocuments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeOtherDocument(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-rose-700 hover:bg-rose-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm py-2 transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                We'll review your application within 2-3 business days. 
                <br />
                Additional documents can be provided during review.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCategoryModal(false)} />
          <div className="relative bg-gray-100 dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-sm p-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Select Service Categories</h3>
            <div className="grid grid-cols-2 gap-1 max-h-48 overflow-auto">
              {CATEGORIES.filter(cat => cat !== 'All').map(category => (
                <button
                  key={category}
                  type="button"
                  onClick={() => toggleTempCategory(category)}
                  className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    tempCategories.includes(category)
                      ? 'bg-rose-50 border-rose-300 text-rose-700'
                      : 'bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                    tempCategories.includes(category)
                      ? 'bg-rose-500 border-rose-500 border'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {tempCategories.includes(category) && (
                      <Check className="w-2.5 h-2.5 text-white" />
                    )}
                  </div>
                  {category}
                </button>
              ))}
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 dark:text-gray-300 hover:bg-gray-200 transition-colors text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveCategoriesFromModal}
                className="px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors text-xs"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
