import React, { useState } from 'react';
import { X, Calendar, Users, Package, MessageSquare } from 'lucide-react';
import { Vendor, Package as PackageType } from '../types';

interface BookingModalProps {
  vendor: Vendor;
  onClose: () => void;
  onSubmit: (bookingData: BookingFormData) => void;
}

interface BookingFormData {
  name: string;
  phone: string;
  email: string;
  date: string;
  guests: string;
  packageId: string;
  message: string;
}

export function BookingModal({ vendor, onClose, onSubmit }: BookingModalProps) {
  const [form, setForm] = useState<BookingFormData>({
    name: '',
    phone: '',
    email: '',
    date: '',
    guests: '',
    packageId: '',
    message: ''
  });

  const [errors, setErrors] = useState<Partial<BookingFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<BookingFormData> = {};

    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!form.date) newErrors.date = 'Date is required';
    if (!form.packageId) newErrors.packageId = 'Please select a package';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(form);
    }
  };

  const handleInputChange = (field: keyof BookingFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const selectedPackage = vendor.packages.find(p => p.id === form.packageId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Book {vendor.name}</h3>
            <p className="text-sm text-gray-500">{vendor.category} • {vendor.location}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Contact Information */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Contact Information</h4>
            
            <div>
              <input
                type="text"
                placeholder="Your full name"
                value={form.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`input-field ${errors.name ? 'border-red-300 focus:ring-red-500' : ''}`}
              />
              {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
            </div>

            <div>
              <input
                type="tel"
                placeholder="Phone number"
                value={form.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`input-field ${errors.phone ? 'border-red-300 focus:ring-red-500' : ''}`}
              />
              {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
            </div>

            <div>
              <input
                type="email"
                placeholder="Email address (optional)"
                value={form.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          {/* Event Details */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Event Details</h4>
            
            <div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className={`input-field pl-10 ${errors.date ? 'border-red-300 focus:ring-red-500' : ''}`}
                />
              </div>
              {errors.date && <p className="text-sm text-red-600 mt-1">{errors.date}</p>}
            </div>

            <div>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  placeholder="Number of guests"
                  value={form.guests}
                  onChange={(e) => handleInputChange('guests', e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>
          </div>

          {/* Package Selection */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Select Package</h4>
            
            <div>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={form.packageId}
                  onChange={(e) => handleInputChange('packageId', e.target.value)}
                  className={`input-field pl-10 ${errors.packageId ? 'border-red-300 focus:ring-red-500' : ''}`}
                >
                  <option value="">Choose a package</option>
                  {vendor.packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} — ₹{pkg.price.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
              {errors.packageId && <p className="text-sm text-red-600 mt-1">{errors.packageId}</p>}
            </div>

            {selectedPackage && (
              <div className="bg-rose-50 rounded-lg p-3">
                <h5 className="font-medium text-rose-900">{selectedPackage.name}</h5>
                <p className="text-sm text-rose-700 mt-1">₹{selectedPackage.price.toLocaleString()}</p>
                {selectedPackage.description && (
                  <p className="text-sm text-rose-600 mt-1">{selectedPackage.description}</p>
                )}
                {selectedPackage.features && selectedPackage.features.length > 0 && (
                  <ul className="text-sm text-rose-600 mt-2 space-y-1">
                    {selectedPackage.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <span className="w-1 h-1 bg-rose-400 rounded-full"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Message */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Additional Message</h4>
            
            <div>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea
                  placeholder="Any special requirements or questions..."
                  value={form.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  rows={3}
                  className="input-field pl-10 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
            >
              Send Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

