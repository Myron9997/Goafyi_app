"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, MapPin, Star, User, Calendar, Star as StarIcon, Search, Eye, MessageCircle } from 'lucide-react';
import { VendorService, type VendorWithUser } from '../services/vendorService';
import { ViewService } from '../services/viewService';
import { RatingService } from '../services/ratingService';
import { CategoryCarousel } from '../components/CategoryCarousel';
import { useSupabase } from '../context/SupabaseContext';

type InitialRatings = Record<string, { average_rating: number; total_ratings: number }>;

export default function Landing({
  initialVendors,
  initialViewCounts,
  initialRatings,
}: {
  initialVendors?: VendorWithUser[];
  initialViewCounts?: Record<string, number>;
  initialRatings?: InitialRatings;
} = {}) {
  const router = useRouter();
  const { user } = useSupabase();
  const [vendors, setVendors] = useState<VendorWithUser[]>(initialVendors || []);
  const [loading, setLoading] = useState(!initialVendors);
  // Local cache (120s TTL)
  const CACHE_KEY = 'landing_vendors_cache_v1';
  const CACHE_TTL_MS = 120 * 1000;
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [vendorViewCounts, setVendorViewCounts] = useState<Record<string, number>>({});
  const [vendorRatings, setVendorRatings] = useState<Record<string, { average_rating: number; total_ratings: number }>>({});
  const [activeFilter, setActiveFilter] = useState<{ type: string; value: string } | null>(null);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);

  // Load vendors from Supabase (lite)
  useEffect(() => {
    const loadVendors = async (opts?: { background?: boolean }) => {
      try {
        if (!opts?.background) {
          setLoading(true);
        }
        // If SSR provided vendors, reuse them and only refresh in background when requested
        const lite = initialVendors || (await VendorService.getVendorsLite());
        setVendors(lite as any);
        
        // Load view counts and ratings for all vendors
        const viewCounts: Record<string, number> = initialViewCounts ? { ...initialViewCounts } : {};
        const ratings: Record<string, { average_rating: number; total_ratings: number }> = initialRatings ? { ...initialRatings } : {};
        
        for (const vendor of (lite as any[]) ) {
          try {
            if (viewCounts[vendor.id] === undefined) {
              const count = await ViewService.getViewCount(vendor.id);
              viewCounts[vendor.id] = count;
            }
            
            if (ratings[vendor.id] === undefined) {
              const ratingStats = await RatingService.getVendorRatingStats(vendor.id);
              if (ratingStats) {
                ratings[vendor.id] = {
                  average_rating: ratingStats.average_rating,
                  total_ratings: ratingStats.total_ratings
                };
              } else {
                ratings[vendor.id] = { average_rating: 0, total_ratings: 0 };
              }
            }
          } catch (error) {
            console.error(`Error loading data for vendor ${vendor.id}:`, error);
            viewCounts[vendor.id] = 0;
            ratings[vendor.id] = { average_rating: 0, total_ratings: 0 };
          }
        }
        setVendorViewCounts(viewCounts);
        setVendorRatings(ratings);

        // Save to local cache
        try {
          const cachePayload = {
            vendors: lite,
            vendorViewCounts: viewCounts,
            vendorRatings: ratings,
            timestamp: Date.now()
          };
          localStorage.setItem(CACHE_KEY, JSON.stringify(cachePayload));
        } catch (e) {
          // Ignore cache write errors
        }
      } catch (error) {
        console.error('Error loading vendors:', error);
      } finally {
        setLoading(false);
      }
    };

    // If SSR data exists, skip cache bootstrap and just background refresh
    if (initialVendors) {
      loadVendors({ background: true });
      return;
    }

    // Try local cache first for instant render
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw) as {
          vendors: VendorWithUser[];
          vendorViewCounts: Record<string, number>;
          vendorRatings: Record<string, { average_rating: number; total_ratings: number }>;
          timestamp: number;
        };
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
          setVendors(cached.vendors as any);
          setVendorViewCounts(cached.vendorViewCounts || {});
          setVendorRatings(cached.vendorRatings || {});
          setLoading(false);
          // Refresh in background
          loadVendors({ background: true });
          return;
        }
      }
    } catch (e) {
      // Ignore cache read errors
    }

    // No valid cache → do normal fetch
    loadVendors();
  }, []);

  // Filter vendors based on search and category
  const filteredVendors = useMemo(() => {
    let filtered = vendors;
    
    // Filter by category (only if not a special filter)
    if (activeCategory !== 'All' && !activeCategory.startsWith('View-') && !activeCategory.startsWith('Rating-') && !activeCategory.startsWith('Location-')) {
      filtered = filtered.filter(vendor => {
        if (!vendor.category) return false;
        // Handle comma-separated categories
        const categories = vendor.category.split(',').map(cat => cat.trim().toLowerCase());
        return categories.includes(activeCategory.toLowerCase());
      });
    }
    
    // Apply special filters
    if (activeFilter) {
      switch (activeFilter.type) {
        case 'View':
          if (activeFilter.value === 'highest') {
            filtered = filtered.sort((a, b) => (vendorViewCounts[b.id] || 0) - (vendorViewCounts[a.id] || 0));
          } else if (activeFilter.value === 'lowest') {
            filtered = filtered.sort((a, b) => (vendorViewCounts[a.id] || 0) - (vendorViewCounts[b.id] || 0));
          }
          break;
          
        case 'Rating':
          if (activeFilter.value === 'highest') {
            filtered = filtered.sort((a, b) => {
              const ratingA = vendorRatings[a.id]?.average_rating || 0;
              const ratingB = vendorRatings[b.id]?.average_rating || 0;
              return ratingB - ratingA;
            });
          } else if (activeFilter.value === 'lowest') {
            filtered = filtered.sort((a, b) => {
              const ratingA = vendorRatings[a.id]?.average_rating || 0;
              const ratingB = vendorRatings[b.id]?.average_rating || 0;
              return ratingA - ratingB;
            });
          }
          break;
          
        case 'Location':
          // For now, just sort by business name since we don't have location coordinates
          filtered = filtered.sort((a, b) => a.business_name.localeCompare(b.business_name));
          break;
      }
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(vendor => 
        vendor.business_name.toLowerCase().includes(query) ||
        (vendor.category && vendor.category.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  }, [vendors, activeCategory, searchQuery, activeFilter, vendorViewCounts, vendorRatings]);

  const handleVendorClick = (vendor: VendorWithUser) => {
    // Check if user is authenticated
    if (user) {
      // User is authenticated, navigate to vendor profile
      router.push(`/vendor/${vendor.id}`);
    } else {
      // User is not authenticated, show sign-in prompt
      setShowSignInPrompt(true);
    }
  };


  const handleSignIn = () => {
    setShowSignInPrompt(false);
    router.push('/viewer-login');
  };

  const handleCategorySelect = (category: string) => {
    setActiveCategory(category);
    setSearchQuery(''); // Clear search when changing category
    setSearchInput(''); // Clear search input when changing category
    
    // Parse special filter commands
    if (category.startsWith('View-')) {
      const viewType = category.replace('View-', '');
      if (viewType === 'none') {
        setActiveFilter(null);
      } else {
        setActiveFilter({ type: 'View', value: viewType });
      }
    } else if (category.startsWith('Rating-')) {
      const ratingType = category.replace('Rating-', '');
      if (ratingType === 'none') {
        setActiveFilter(null);
      } else {
        setActiveFilter({ type: 'Rating', value: ratingType });
      }
    } else if (category.startsWith('Location-')) {
      const locationRadius = category.replace('Location-', '');
      setActiveFilter({ type: 'Location', value: locationRadius });
    } else {
      // Regular category selection
      setActiveFilter(null);
    }
  };

  const handleSearchInputChange = (query: string) => {
    setSearchInput(query);
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
    if (searchInput.trim()) {
      setActiveCategory('All'); // Reset category when searching
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'sm') => {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vendors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 scrollbar-hide">
      {/* Header with Search */}
      <div className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3">
          {/* Search Bar */}
          <div className="sticky top-[56px] z-30 mb-3">
            <div className="bg-white/80 backdrop-blur-md rounded-xl p-3 shadow-lg border border-white/20">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search vendors, locations, or services..."
                    value={searchInput}
                    onChange={(e) => handleSearchInputChange(e.target.value)}
                    className="w-full pl-3 pr-3 py-2 text-sm border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 transition-all duration-200 bg-white/60 backdrop-blur-sm shadow-sm hover:shadow-md"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-rose-700/90 backdrop-blur-sm text-white rounded-lg hover:bg-rose-800/90 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg hover:-translate-y-0.5 transform"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Category Filters */}
          <CategoryCarousel 
            activeCategory={activeCategory}
            onSelectCategory={handleCategorySelect}
          />
        </div>
      </div>

      {/* Vendor Preview Section */}
      <div className="max-w-6xl mx-auto px-4 pt-[10px] pb-8">

        {/* Results Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-gray-900">
            {activeCategory === 'All' ? 'All Vendors' : activeCategory}
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({filteredVendors.length} {filteredVendors.length === 1 ? 'vendor' : 'vendors'})
            </span>
          </h2>
          {filteredVendors.length > 0 && (
            <div className="w-8 h-1 bg-gradient-to-r from-rose-500 to-rose-700 rounded-full"></div>
          )}
        </div>

        {filteredVendors.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No vendors found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery.trim() 
                ? `No vendors match your search for "${searchQuery}"`
                : `No vendors found in the ${activeCategory} category`
              }
            </p>
            <div className="space-x-3">
              {searchQuery.trim() && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSearchInput('');
                  }}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-all duration-300"
                >
                  Clear Search
                </button>
              )}
              <button
                onClick={() => setActiveCategory('All')}
                className="bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition-all duration-300"
              >
                View All Vendors
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredVendors.map((vendor: any) => (
              <div key={vendor.id} className="bg-white/20 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 overflow-hidden transform hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-pointer" style={{
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%)',
                backdropFilter: 'blur(20px) saturate(180%)'
              }}>
                <div 
                  className="h-20 w-full bg-cover bg-center relative" 
                  style={{ backgroundImage: `url('${(vendor.portfolio_images && vendor.portfolio_images[0]) || '/placeholder-image.svg'}')` }}
                  onClick={() => handleVendorClick(vendor)}
                >
                  {/* View Count - Top Right Corner */}
                  <div className="absolute top-1.5 right-1.5 px-1.5 py-1 rounded-lg bg-white/90 backdrop-blur-md flex items-center gap-1 shadow-lg">
                    <Eye className="w-2.5 h-2.5 text-gray-700" />
                    <span className="text-xs font-semibold text-gray-800">{vendorViewCounts[vendor.id] || 0}</span>
                  </div>
                </div>
                <div className="p-1.5 bg-white/10 backdrop-blur-md border-t border-white/20">
                  <div className="mb-1.5 ml-2">
                    <h3 className="font-semibold text-gray-900 text-xs truncate text-center">{vendor.business_name}</h3>
                    <p className="text-xs text-gray-600 truncate">{vendor.category}</p>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-1 mt-0.5">
                      {vendorRatings[vendor.id] && vendorRatings[vendor.id].total_ratings > 0 ? (
                        <>
                          {renderStars(Math.round(vendorRatings[vendor.id].average_rating), 'sm')}
                          <span className="text-xs text-gray-700 font-medium">
                            {vendorRatings[vendor.id].average_rating.toFixed(1)}
                          </span>
                        </>
                      ) : (
                        <>
                          {renderStars(0, 'sm')}
                          <span className="text-xs text-gray-500">0.0</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                </div>
              </div>
            ))}
          </div>
        )}

        
      </div>

      {/* Sign In Prompt Modal */}
      {showSignInPrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-rose-700" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Sign In Required
              </h3>
              <p className="text-gray-600 mb-6">
                Sign in to view vendor profiles, contact vendors, and book services.
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleSignIn}
                  className="w-full bg-rose-700 text-white py-2 px-4 rounded-lg font-semibold hover:bg-rose-800 transition-all duration-300"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setShowSignInPrompt(false)}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-all duration-300"
                >
                  Cancel
                </button>
                <div className="text-center pt-2">
                  <span className="text-sm text-gray-500">Haven't registered yet? </span>
                  <button
                    onClick={() => {
                      setShowSignInPrompt(false);
                      router.push('/viewer-login?mode=signup');
                    }}
                    className="text-sm text-rose-700 hover:text-rose-800 font-semibold underline transition-colors duration-200"
                  >
                    Sign up
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
