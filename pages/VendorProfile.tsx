"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MessageCircle, MapPin, Globe, Instagram, Facebook, Mail, Phone, X, Eye, Star } from 'lucide-react';
import { VendorService, type VendorWithUser } from '../services/vendorService';
import { ViewService } from '../services/viewService';
import { RatingService, type VendorRating } from '../services/ratingService';
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


            {/* Contact Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  if (vendor.contact_phone) {
                    const message = `Hi ${vendor.business_name}! I'm interested in your ${vendor.category} services. Can we discuss pricing and availability?`;
                    const whatsappUrl = `https://wa.me/${vendor.contact_phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                  } else {
                    alert('WhatsApp number not available. Please contact the vendor through other means.');
                  }
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-1 transform ${
                  vendor.contact_phone 
                    ? 'bg-green-500 text-white hover:bg-green-600' 
                    : 'bg-gray-300 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                }`}
                style={{
                  boxShadow: vendor.contact_phone 
                    ? '0 10px 25px -5px rgba(34, 197, 94, 0.3), 0 4px 6px -2px rgba(34, 197, 94, 0.1)'
                    : '0 4px 6px -2px rgba(0, 0, 0, 0.1)'
                }}
                disabled={!vendor.contact_phone}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                {vendor.contact_phone ? 'Contact on WhatsApp' : 'WhatsApp Not Available'}
              </button>
              
              {vendor.social_media?.instagram && (
                <button
                  onClick={handleInstagramMessageClick}
                  className="flex-1 bg-pink-100 text-pink-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-pink-200 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-1 transform"
                  style={{
                    boxShadow: '0 10px 25px -5px rgba(236, 72, 153, 0.3), 0 4px 6px -2px rgba(236, 72, 153, 0.1)'
                  }}
                >
                  <Instagram className="w-4 h-4" />
                  Message on Instagram
                </button>
              )}
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
    </div>
  );
}

// Prevent static prerendering to avoid missing params during build
export async function getServerSideProps() {
  return { props: {} };
}
