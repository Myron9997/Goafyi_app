"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MessageCircle, MapPin, Globe, Instagram, Facebook, Mail, Phone, X, Eye, Star, Calendar, DollarSign } from 'lucide-react';
import { VendorService, type VendorWithUser } from '../services/vendorService';
import { ViewService } from '../services/viewService';
import { RatingService, type VendorRating } from '../services/ratingService';
import { PackageService } from '../services/packageService';
import { AvailabilityService } from '../services/availabilityService';
import { BookingService } from '../services/bookingService';
import { RequestService } from '../services/requestService';
import { RatingModal } from '../components/RatingModal';
import { RatingDisplay } from '../components/RatingDisplay';
import { useSupabase } from '../context/SupabaseContext';

// Function to get category-specific colors and gradients
const getCategoryColors = (category: string) => {
  const colorMap: Record<string, { bg: string; text: string }> = {
    'Wedding Planner': { bg: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white', text: 'text-white' },
    'Emcee': { bg: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white', text: 'text-white' },
    'Decorator': { bg: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white', text: 'text-white' },
    'Photographer': { bg: 'bg-gradient-to-r from-orange-500 to-red-500 text-white', text: 'text-white' },
    'Cameraman': { bg: 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white', text: 'text-white' },
    'Catering': { bg: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white', text: 'text-white' },
    'Venue': { bg: 'bg-gradient-to-r from-teal-500 to-blue-500 text-white', text: 'text-white' },
    'Band': { bg: 'bg-gradient-to-r from-pink-500 to-rose-500 text-white', text: 'text-white' },
    'Solo Artist': { bg: 'bg-gradient-to-r from-violet-500 to-purple-500 text-white', text: 'text-white' },
    'DJ': { bg: 'bg-gradient-to-r from-gray-700 to-gray-900 text-white', text: 'text-white' },
    'Florist': { bg: 'bg-gradient-to-r from-green-400 to-green-600 text-white', text: 'text-white' },
    'Makeup Artist': { bg: 'bg-gradient-to-r from-rose-400 to-pink-600 text-white', text: 'text-white' },
    'Suit Designer': { bg: 'bg-gradient-to-r from-slate-600 to-slate-800 text-white', text: 'text-white' },
    'Gown Designer': { bg: 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white', text: 'text-white' },
    'Bridesmaid Dresses': { bg: 'bg-gradient-to-r from-pink-400 to-rose-500 text-white', text: 'text-white' },
    'Best Man Suits': { bg: 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white', text: 'text-white' },
    'Accessories': { bg: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white', text: 'text-white' },
    'Bar Services': { bg: 'bg-gradient-to-r from-red-500 to-red-700 text-white', text: 'text-white' }
  };
  
  return colorMap[category] || { bg: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white', text: 'text-white' };
};

export default function VendorProfile({ initialVendor }: { initialVendor?: any }) {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useSupabase();
  const [vendor, setVendor] = useState<VendorWithUser | null>(initialVendor || null);
  const [loading, setLoading] = useState(!initialVendor);
  const [error, setError] = useState<string | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageTemplate, setMessageTemplate] = useState('');
  const [viewCount, setViewCount] = useState<number>(0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState<VendorRating | null>(null);
  const [ratingStats, setRatingStats] = useState<{ average_rating: number; total_ratings: number } | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    if (initialVendor && initialVendor.id) {
      // Use SSR data and extract additional stats
      setVendor(initialVendor);
      setViewCount(initialVendor.viewCount || 0);
      if (initialVendor.ratingStats) {
        setRatingStats(initialVendor.ratingStats);
      }
      setLoading(false);
      
      // Track the view asynchronously to not block UI
      if (id) {
        ViewService.trackViewWithDuplicatePrevention(id, user?.id).catch(console.error);
      }
      
      // Refresh data in background for next visit (non-blocking)
      setTimeout(() => loadVendorInBackground(), 100);
      return;
    }
    
    const loadVendor = async () => {
      if (!id) {
        setError('Vendor ID not provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const vendorData = await VendorService.getVendorByIdCachedFirst(id);
        console.log('Vendor data loaded:', vendorData);
        console.log('User avatar URL:', vendorData?.user?.avatar_url);
        setVendor(vendorData);
        
        // Ensure we're at the top after setting vendor data
        window.scrollTo(0, 0);

        // Track the view and load additional data asynchronously
        if (vendorData) {
          // Track view asynchronously to not block UI
          ViewService.trackViewWithDuplicatePrevention(id, user?.id).catch(console.error);
          
          // Load additional data in parallel
          Promise.all([
            ViewService.getViewCount(id),
            user?.id ? RatingService.getUserRating(id, user.id) : Promise.resolve(null),
            RatingService.getVendorRatingStats(id)
          ]).then(([count, existingRating, stats]) => {
            setViewCount(count || 0);
            setUserRating(existingRating);
            if (stats) {
              setRatingStats({
                average_rating: stats.average_rating,
                total_ratings: stats.total_ratings
              });
            }
          }).catch(console.error);
        }
      } catch (err) {
        console.error('Error loading vendor:', err);
        setError('Failed to load vendor profile');
      } finally {
        setLoading(false);
        // Final scroll to top to ensure we're at the top
        window.scrollTo(0, 0);
      }
    };

    loadVendor();
  }, [id, user?.id, initialVendor]);

  // Background refresh function
  const loadVendorInBackground = async () => {
    if (!id) return;
    
    try {
      const vendorData = await VendorService.getVendorByIdCachedFirst(id);
      if (vendorData) {
        setVendor(vendorData);
        
        // Update view count and rating stats
        const [count, stats] = await Promise.all([
          ViewService.getViewCount(id),
          RatingService.getVendorRatingStats(id)
        ]);
        
        setViewCount(count || 0);
        if (stats) {
          setRatingStats({
            average_rating: stats.average_rating,
            total_ratings: stats.total_ratings
          });
        }
      }
    } catch (error) {
      console.error('Error refreshing vendor data in background:', error);
    }
  };

  const handleMessageClick = () => {
    if (vendor) {
      router.push('/messages');
    }
  };

  const handleInstagramMessageClick = () => {
    if (vendor) {
      // Set up the message template with business name
      const template = `Hey ${vendor.business_name}, I found your profile on GoaFYI, I would like to know...`;
      setMessageTemplate(template);
      setShowMessageModal(true);
    }
  };

  const handleSendInstagramMessage = () => {
    if (vendor && messageTemplate.trim()) {
      // Extract username from Instagram URL
      const instagramUrl = vendor.social_media?.instagram;
      let username = '';
      
      if (instagramUrl && instagramUrl.includes('instagram.com/')) {
        username = instagramUrl.split('instagram.com/')[1].split('/')[0].replace('@', '');
      }
      
      if (username) {
        // Copy message to clipboard
        navigator.clipboard.writeText(messageTemplate.trim()).then(() => {
          // Open Instagram DM
          const dmLink = `https://ig.me/m/${username}`;
          window.open(dmLink, '_blank');
          
          // Show success message
          alert('Message copied to clipboard! Paste it in the Instagram DM that just opened.');
        }).catch(() => {
          // Fallback if clipboard fails
          alert(`Message ready to send:\n\n"${messageTemplate.trim()}"\n\nOpening Instagram DM...`);
          const dmLink = `https://ig.me/m/${username}`;
          window.open(dmLink, '_blank');
        });
      }
      
      setShowMessageModal(false);
    }
  };

  const handleRatingSubmitted = (rating: VendorRating) => {
    setUserRating(rating);
    // Refresh rating stats
    if (id) {
      RatingService.getVendorRatingStats(id).then(stats => {
        if (stats) {
          setRatingStats({
            average_rating: stats.average_rating,
            total_ratings: stats.total_ratings
          });
        }
      });
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    };

    return (
      <div className="flex items-center space-x-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading vendor profile...</p>
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Vendor not found</h3>
          <p className="text-gray-500 mb-6">{error || 'This vendor profile could not be found.'}</p>
          <button
            onClick={() => router.push('/home')}
            className="btn-primary"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const coverImage = vendor.portfolio_images && vendor.portfolio_images[0] 
    ? vendor.portfolio_images[0] 
    : '/placeholder-image.svg';
  
  const profileImage = vendor.user?.avatar_url || '/placeholder-image.svg';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-700 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        {/* Cover Photo with back button */}
        <div className="relative h-48 sm:h-64">
          <div 
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url('${coverImage}')` }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-20" />
          
          {/* Back button positioned on cover image */}
          <button
            onClick={() => router.push('/home')}
            className="absolute top-4 left-4 p-2 rounded-lg bg-gray-100 dark:bg-gray-900/80 backdrop-blur-sm hover:bg-gray-100 dark:bg-gray-900/90 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          
          {/* View count in top right corner */}
          <div className="absolute top-4 right-4 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-900/80 backdrop-blur-sm flex items-center gap-2">
            <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{viewCount}</span>
          </div>
        </div>

        {/* Profile Section */}
        <div className="relative -mt-16 px-4 pb-6">
          <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 transform hover:scale-[1.02] transition-transform duration-200">
            {/* Profile Picture */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 rounded-full shadow-2xl overflow-hidden -mt-12 transform hover:scale-110 transition-transform duration-300" style={{
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              }}>
                {vendor.user?.avatar_url ? (
                  <img
                    src={vendor.user.avatar_url}
                    alt={vendor.business_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white text-2xl font-bold">
                    {(vendor.business_name || vendor.full_name || 'V').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-4 text-center">
                {vendor.business_name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-center">
                {vendor.full_name}
              </p>
              
              {/* Rating Display */}
              <div className="flex items-center justify-center gap-2 mt-2">
                {ratingStats && ratingStats.total_ratings > 0 ? (
                  <>
                    {renderStars(Math.round(ratingStats.average_rating), 'sm')}
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {ratingStats.average_rating.toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({ratingStats.total_ratings} {ratingStats.total_ratings === 1 ? 'rating' : 'ratings'})
                    </span>
                  </>
                ) : (
                  <>
                    {renderStars(0, 'sm')}
                    <span className="text-sm font-medium text-gray-500">0.0</span>
                    <span className="text-xs text-gray-500">(0 ratings)</span>
                  </>
                )}
              </div>
            </div>

             {/* Business Categories */}
             {vendor.category && (
               <div className="flex flex-wrap justify-center gap-2 mb-4">
                 {vendor.category.split(',').map((cat, index) => {
                   const trimmedCat = cat.trim();
                   const categoryColors = getCategoryColors(trimmedCat);
                   return (
                     <span
                       key={index}
                       className={`${categoryColors.bg} ${categoryColors.text} px-3 py-1.5 rounded-full text-xs font-medium shadow-sm`}
                     >
                       {trimmedCat}
                     </span>
                   );
                 })}
               </div>
             )}

             {/* Location and Website */}
             <div className="flex flex-col sm:flex-row gap-2 justify-center mb-2">
               {vendor.location && (
                 <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-sm flex items-center gap-2">
                   <MapPin className="w-4 h-4" />
                   {vendor.location}
                 </span>
               )}
               {vendor.website && (
                 <a 
                   href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-sm flex items-center gap-2 hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
                 >
                   <Globe className="w-4 h-4" />
                   Website
                 </a>
               )}
             </div>

            {/* Contact Information */}
            <div className="space-y-4 mb-2">
              {vendor.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">{vendor.email}</span>
                </div>
              )}
              
              {vendor.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">{vendor.phone}</span>
                </div>
              )}

            </div>


            {/* Unified Message Button */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setShowContactModal(true)}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-1 transform ${
                  (vendor.contact_phone || vendor.social_media?.instagram)
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-300 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                }`}
                style={{
                  boxShadow: (vendor.contact_phone || vendor.social_media?.instagram)
                    ? '0 10px 25px -5px rgba(79, 70, 229, 0.3), 0 4px 6px -2px rgba(79, 70, 229, 0.1)'
                    : '0 4px 6px -2px rgba(0, 0, 0, 0.1)'
                }}
                disabled={!vendor.contact_phone && !vendor.social_media?.instagram}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Message
              </button>
            </div>

            {/* Availability & Pricing Button */}
            <div className="flex flex-col sm:flex-row gap-2 mt-3">
              <button
                onClick={() => setShowBookingModal(true)}
                className="flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-1 transform bg-blue-600 text-white hover:bg-blue-700"
                style={{
                  boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.3), 0 4px 6px -2px rgba(37, 99, 235, 0.1)'
                }}
              >
                <Calendar className="w-3.5 h-3.5" />
                <DollarSign className="w-3.5 h-3.5" />
                Availability & Pricing
              </button>
            </div>
          </div>
        </div>

        {/* Ratings & Reviews Section */}
        {user && (
          <div className="px-4 pb-6">
            <RatingDisplay
              vendorId={vendor.id}
              vendorName={vendor.business_name}
              userId={user.id}
              onRateClick={() => setShowRatingModal(true)}
              showRateButton={true}
            />
          </div>
        )}

        {/* Portfolio Images */}
        {vendor.portfolio_images && vendor.portfolio_images.length > 1 && (
          <div className="px-4 pb-6">
            <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Portfolio</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {vendor.portfolio_images.slice(1).map((image, index) => (
                  <div
                    key={index}
                    className="aspect-square rounded-lg bg-cover bg-center"
                    style={{ backgroundImage: `url('${image}')` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Message Template Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Send Instagram Message</h3>
              <button
                onClick={() => setShowMessageModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>How it works:</strong> Your message will be copied to clipboard, then Instagram DM will open. Just paste and send!
                </p>
              </div>
              
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your message to {vendor?.business_name}:
              </label>
              <textarea
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                placeholder="Type your message here..."
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendInstagramMessage}
                  disabled={!messageTemplate.trim()}
                  className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Copy & Open Instagram
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Choice Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Choose a platform</h3>
              <button
                onClick={() => setShowContactModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  if (!vendor?.contact_phone) return;
                  const message = messageTemplate?.trim()
                    ? messageTemplate.trim()
                    : `Hi ${vendor.business_name}! I'm interested in your ${vendor.category} services. Can we discuss pricing and availability?`;
                  const whatsappUrl = `https://wa.me/${vendor.contact_phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                  window.open(whatsappUrl, '_blank');
                  setShowContactModal(false);
                }}
                disabled={!vendor?.contact_phone}
                className={`w-full aspect-square rounded-xl flex flex-col items-center justify-center gap-1.5 text-xs font-medium transition-all ${
                  vendor?.contact_phone
                    ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg hover:shadow-xl'
                    : 'bg-gray-300 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                }`}
                style={{ boxShadow: vendor?.contact_phone ? '0 10px 25px -5px rgba(34,197,94,.3), 0 4px 6px -2px rgba(34,197,94,.1)' : undefined }}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                WhatsApp
              </button>

              <button
                onClick={() => {
                  if (!vendor?.social_media?.instagram) return;
                  const defaultMsg = `Hey ${vendor.business_name}, I found your profile on GoaFYI, I would like to know...`;
                  setMessageTemplate(defaultMsg);
                  setShowContactModal(false);
                  setShowMessageModal(true);
                }}
                disabled={!vendor?.social_media?.instagram}
                className={`w-full aspect-square rounded-xl flex flex-col items-center justify-center gap-1.5 text-xs font-medium transition-all ${
                  vendor?.social_media?.instagram
                    ? 'bg-pink-100 text-pink-700 hover:bg-pink-200 shadow-lg hover:shadow-xl'
                    : 'bg-gray-300 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                }`}
                style={{ boxShadow: vendor?.social_media?.instagram ? '0 10px 25px -5px rgba(236,72,153,.3), 0 4px 6px -2px rgba(236,72,153,.1)' : undefined }}
              >
                <Instagram className="w-6 h-6" />
                Instagram
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && user && vendor && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          vendorId={vendor.id}
          vendorName={vendor.business_name}
          userId={user.id}
          onRatingSubmitted={handleRatingSubmitted}
          existingRating={userRating}
        />
      )}

      {/* Booking Request Modal */}
      {showBookingModal && vendor && (
        <BookingRequestModal
          vendor={vendor}
          onClose={() => setShowBookingModal(false)}
        />
      )}
    </div>
  );
}

// Availability & Pricing Modal Component
function BookingRequestModal({ vendor, onClose }: { vendor: VendorWithUser; onClose: () => void }) {
  const [packages, setPackages] = useState<any[]>([]);
  const [availabilitySettings, setAvailabilitySettings] = useState<any>(null);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [bookingsByDate, setBookingsByDate] = useState<Record<string, any[]>>({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Load packages and availability data from Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading data for vendor:', vendor.id);
        
        // Load packages from Supabase
        const packagesData = await PackageService.getVendorPackages(vendor.id);
        console.log('Loaded packages:', packagesData);
        const mappedPackages = (packagesData || []).map((p: any) => ({
          id: p.id,
          title: p.title,
          pricing_type: p.pricing_type,
          price: p.price ?? undefined,
          price_per_person: p.price_per_person ?? undefined,
          min_persons: p.min_persons ?? undefined,
          duration_label: p.duration_label ?? '',
          deliverables: p.deliverables ?? [],
          terms: p.terms ?? '',
          extras: (p.package_extras || []).map((ex: any) => ({
            name: ex.name,
            available_qty: ex.available_qty ?? undefined,
            price_per_unit: ex.price_per_unit ?? undefined
          }))
        }));
        setPackages(mappedPackages);

        // Load availability settings
        const settings = await AvailabilityService.getSettings(vendor.id);
        console.log('Loaded availability settings:', settings);
        setAvailabilitySettings(settings);

        // Load blocked dates (dates vendor marked as not available)
        const blocked = await AvailabilityService.listBlockedDates(vendor.id);
        console.log('Loaded blocked dates:', blocked);
        setBlockedDates((blocked || []).map((b: any) => b.date));

        // Load bookings (confirmed bookings from customers)
        const bookings = await BookingService.getVendorBookings(vendor.id);
        console.log('Loaded bookings:', bookings);
        const bucket: Record<string, any[]> = {};
        for (const b of (bookings || [])) {
          const dateIso = (b as any).event_date as string;
          if (!dateIso) continue;
          if (!bucket[dateIso]) bucket[dateIso] = [];
          bucket[dateIso].push(b);
        }
        setBookingsByDate(bucket);
      } catch (error) {
        console.error('Error loading data:', error);
        // Set empty data on error
        setPackages([]);
        setAvailabilitySettings(null);
        setBlockedDates([]);
        setBookingsByDate({});
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [vendor.id]);

  const handleRequestPackage = (pkg: any) => {
    setSelectedPackage(pkg);
    setShowRequestModal(true);
  };

  const handleToggleDate = (date: string) => {
    setSelectedDates((prev) => {
      const set = new Set(prev);
      if (set.has(date)) set.delete(date); else set.add(date);
      return Array.from(set).sort();
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">Loading availability...</p>
        </div>
      </div>
    );
  }

  // Debug info
  console.log('Modal render - packages:', packages.length, 'availability:', availabilitySettings, 'blocked:', blockedDates.length, 'bookings:', Object.keys(bookingsByDate).length);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-gray-700 to-gray-800 p-4 text-white">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <h3 className="text-lg font-bold">Availability & Pricing</h3>
          <p className="text-gray-200 text-xs mt-0.5">{vendor.business_name}</p>
        </div>
        
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="p-4 space-y-4">
            {/* Availability Calendar */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-gray-600 dark:text-blue-600" />
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Availability</h4>
              </div>
              <AvailabilityCalendar
                currentMonth={currentMonth}
                setCurrentMonth={setCurrentMonth}
                availabilitySettings={availabilitySettings}
                blockedDates={blockedDates}
                bookingsByDate={bookingsByDate}
                selectedDates={selectedDates}
                onToggleDate={handleToggleDate}
              />
              
              {selectedDates.length > 0 && (
                <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    <div className="text-xs text-blue-800 dark:text-blue-200 flex flex-wrap gap-1">
                      {selectedDates.map(d => (
                        <span key={d} className="px-1.5 py-0.5 rounded bg-white/80 border border-blue-200">{d}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Packages */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-gray-600 dark:text-green-600" />
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Packages</h4>
              </div>
              
              {packages.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-2">
                    <DollarSign className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">No packages available yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {packages.map((pkg) => (
                    <div key={pkg.id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100">{pkg.title}</h5>
                            <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] rounded-full">
                              {pkg.pricing_type === 'fixed' ? 'Fixed' : 'Per Person'}
                            </span>
                          </div>
                          
                          <div className="text-xs text-gray-500 mb-2">
                            {pkg.pricing_type === 'fixed' ? (
                              <span className="font-medium text-sm text-gray-900 dark:text-green-600">₹{pkg.price?.toLocaleString()}</span>
                            ) : (
                              <span className="font-medium text-sm text-gray-900 dark:text-green-600">₹{pkg.price_per_person}/person</span>
                            )}
                            {pkg.duration_label && (
                              <span className="ml-1">• {pkg.duration_label}</span>
                            )}
                            {pkg.min_persons && (
                              <span className="ml-1">• min {pkg.min_persons}</span>
                            )}
                          </div>
                          
                          {pkg.deliverables && pkg.deliverables.length > 0 && (
                            <ul className="mb-2 list-disc list-inside space-y-0.5">
                              {pkg.deliverables.map((d: string, idx: number) => (
                                <li key={idx} className="text-[11px] text-gray-600 dark:text-gray-300">{d}</li>
                              ))}
                            </ul>
                          )}
                          
                          {pkg.extras && pkg.extras.length > 0 && (
                            <div className="mb-2">
                              <div className="text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">Extras</div>
                              <ul className="space-y-1">
                                {pkg.extras.map((e: any, i: number) => (
                                  <li key={i} className="text-[11px] text-gray-600 dark:text-gray-300">
                                    {e.name}
                                    {typeof e.available_qty === 'number' ? ` — available ${e.available_qty}` : ''}
                                    {typeof e.price_per_unit === 'number' ? ` • ₹${e.price_per_unit}/unit` : ''}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        
                        <button
                          onClick={() => {
                            if (selectedDates.length === 0) {
                              alert('Please select at least one date from the calendar before requesting.');
                              return;
                            }
                            handleRequestPackage(pkg);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                        >
                          Request
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Package Request Modal */}
      {showRequestModal && selectedPackage && (
        <PackageRequestModal
          package={selectedPackage}
          vendor={vendor}
          selectedDate={undefined}
          selectedDates={selectedDates}
          onClose={() => {
            setShowRequestModal(false);
            setSelectedPackage(null);
          }}
        />
      )}
    </div>
  );
}

// Availability Calendar Component
function AvailabilityCalendar({ 
  currentMonth, 
  setCurrentMonth, 
  availabilitySettings, 
  blockedDates, 
  bookingsByDate,
  selectedDates,
  onToggleDate
}: {
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  availabilitySettings: any;
  blockedDates: string[];
  bookingsByDate: Record<string, any[]>;
  selectedDates: string[];
  onToggleDate: (date: string) => void;
}) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  
  const format = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const isDayOff = (date: Date) => availabilitySettings?.days_off?.[dayNames[date.getDay()]] === true;
  
  const cells: { iso: string | null; status?: 'available' | 'blocked' | 'dayoff' | 'booked'; hasBookings?: boolean }[] = Array(firstDay).fill({ iso: null });
  let availableCount = 0, blockedCount = 0, bookedCount = 0, dayoffCount = 0;
  
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = format(year, month, d);
    const date = new Date(year, month, d);
    const blocked = blockedDates.includes(iso);
    const dayoff = isDayOff(date);
    const hasBookings = (bookingsByDate[iso] || []).length > 0;
    
    let status: 'available' | 'blocked' | 'dayoff' | 'booked' = 'available';
    if (hasBookings) { 
      status = 'booked'; 
      bookedCount++; 
    } else if (blocked) { 
      status = 'blocked'; 
      blockedCount++; 
    } else if (dayoff) { 
      status = 'dayoff'; 
      dayoffCount++; 
    } else { 
      availableCount++; 
    }
    cells.push({ iso, status, hasBookings });
  }
  
  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));
  
  return (
    <div>
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-2">
        <button 
          onClick={prevMonth} 
          className="px-2 py-1 rounded-md text-xs border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          ‹
        </button>
        
        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {currentMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
        </h5>
        
        <button 
          onClick={nextMonth} 
          className="px-2 py-1 rounded-md text-xs border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          ›
        </button>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-3 mb-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-white border border-gray-300"></div>
          <span className="text-gray-600 dark:text-gray-300">Available ({availableCount})</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-gray-200 border border-gray-400"></div>
          <span className="text-gray-600 dark:text-gray-300">Booked ({bookedCount})</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-gray-300 border border-gray-500"></div>
          <span className="text-gray-600 dark:text-gray-300">Not Available ({blockedCount})</span>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 text-xs text-gray-500 mb-1">
          {dayNames.map((day) => (
            <div key={day} className="text-center">{day}</div>
          ))}
        </div>
        
        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, idx) => {
            const isSelected = cell.iso ? selectedDates.includes(cell.iso) : false;
            const isClickable = !!cell.iso && (cell.status === 'available' || cell.status === 'booked');
            
            return (
              <div
                key={idx}
                onClick={() => isClickable && onToggleDate(cell.iso!)}
                className={`
                  h-7 rounded-md text-xs border flex items-center justify-center relative
                  ${!cell.iso ? 'bg-transparent border-transparent' :
                    isSelected ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-500 dark:border-blue-400 ring-2 ring-blue-300 dark:ring-blue-600' :
                    cell.status === 'booked' ? 'bg-gray-200 dark:bg-blue-900/20 text-gray-700 dark:text-blue-300 border-gray-400 dark:border-blue-500 hover:bg-gray-300 dark:hover:bg-blue-900/30 cursor-pointer' :
                    cell.status === 'blocked' ? 'bg-gray-300 dark:bg-red-900/20 text-gray-600 dark:text-red-300 border-gray-500 dark:border-red-500 cursor-not-allowed' :
                    cell.status === 'dayoff' ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-400 cursor-not-allowed' :
                    'bg-white dark:bg-green-900/20 text-gray-700 dark:text-green-300 border-gray-300 dark:border-green-500 hover:bg-gray-50 dark:hover:bg-green-900/30 cursor-pointer'
                  }
                  transition-colors
                `}
              >
                {cell.iso ? cell.iso.split('-')[2] : ''}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Additional Info */}
      {availabilitySettings?.slots_per_day && (
        <div className="mt-2 text-center">
          <p className="text-[10px] text-gray-500 dark:text-gray-400">
            {availabilitySettings.slots_per_day} slots available per day
          </p>
        </div>
      )}
    </div>
  );
}

// Package Request Modal Component
function PackageRequestModal({ package: pkg, vendor, onClose, selectedDate, selectedDates }: { package: any; vendor: VendorWithUser; onClose: () => void; selectedDate?: string | null; selectedDates?: string[] }) {
  const { user } = useSupabase();
  const initialDates = (selectedDates && selectedDates.length > 0) ? selectedDates : (selectedDate ? [selectedDate] : []);
  const [eventDates, setEventDates] = useState<string[]>(initialDates);
  const [numberOfPeople, setNumberOfPeople] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [requestChanges, setRequestChanges] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setContactName(user.full_name || '');
      setContactEmail(user.email || '');
      setContactPhone(user.phone || '');
    }
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventDates || eventDates.length === 0) {
      alert('Please select at least one date from the calendar.');
      return;
    }
    setIsSubmitting(true);
    
    try {
      await RequestService.createRequest({
        vendor_id: vendor.id,
        user_id: user?.id as string,
        package_id: pkg?.id ?? null,
        dates: eventDates,
        notes: additionalInfo || undefined,
        requested_changes: requestChanges || undefined,
        phone: contactPhone || undefined
      });
      
      alert('Booking request submitted successfully! The vendor will contact you within 24 hours.');
      onClose();
    } catch (error) {
      console.error('Error submitting booking request:', error);
      alert('Failed to submit booking request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-rose-600 to-pink-600 p-3 text-white">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <h3 className="text-sm font-semibold">Request Package</h3>
          <p className="text-rose-100 text-[11px] mt-0.5">{pkg.title}</p>
        </div>
        
        <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
          <form onSubmit={handleSubmit} className="p-3 space-y-3">

            {/* Package Summary */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{pkg.title}</h4>
                <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] rounded-full">
                  {pkg.pricing_type === 'fixed' ? 'Fixed Price' : 'Per Person'}
                </span>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300">
                {pkg.pricing_type === 'fixed' ? (
                  <span className="font-semibold text-sm text-gray-900 dark:text-green-400">₹{pkg.price?.toLocaleString()}</span>
                ) : (
                  <span className="font-semibold text-sm text-gray-900 dark:text-green-400">₹{pkg.price_per_person}/person</span>
                )}
                {pkg.duration_label && (
                  <span className="ml-1 text-gray-500">• {pkg.duration_label}</span>
                )}
                {pkg.min_persons && (
                  <span className="ml-1 text-gray-500">• Min {pkg.min_persons}</span>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">Selected Dates *</label>
                {(!eventDates || eventDates.length === 0) ? (
                  <div className="text-[11px] text-gray-500">No dates selected. Go back and select dates from the calendar.</div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {eventDates.map(d => (
                      <span key={d} className="px-1.5 py-0.5 rounded-md bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-[11px]">{d}</span>
                    ))}
                  </div>
                )}
              </div>

              {pkg.pricing_type === 'per_person' && (
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">Number of People *</label>
                  <input
                    type="number"
                    value={numberOfPeople}
                    onChange={(e) => setNumberOfPeople(e.target.value)}
                    required
                    min={pkg.min_persons || 1}
                    className="w-full px-2.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-rose-500 focus:border-transparent transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">Additional Information</label>
                <textarea
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  rows={2}
                  placeholder="Any special requirements, theme preferences, dietary restrictions, etc."
                  className="w-full px-2.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-rose-500 focus:border-transparent transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">Request Changes (Optional)</label>
                <textarea
                  value={requestChanges}
                  onChange={(e) => setRequestChanges(e.target.value)}
                  rows={2}
                  placeholder="Any modifications you'd like to request to this package (e.g., different timing, additional services, custom pricing, etc.)"
                  className="w-full px-2.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-rose-500 focus:border-transparent transition-colors resize-none"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Contact Information</h4>
              
              <div className="space-y-2">
                <div className="p-2 rounded-md bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-[11px] text-gray-700 dark:text-gray-300">
                  Request will be sent as: <span className="font-medium text-gray-900 dark:text-gray-100">{contactName || 'Viewer'}</span>{contactEmail ? ` • ${contactEmail}` : ''}
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    required
                    className="w-full px-2.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-rose-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-3 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-xs font-medium"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2 text-xs">
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </div>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Prevent static prerendering to avoid missing params during build
export async function getServerSideProps() {
  return { props: {} };
}
