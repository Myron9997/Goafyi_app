"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, List, ChevronUp, ChevronDown, MapPin } from 'lucide-react';
import { CATEGORIES } from '../constants';
import { VendorService } from '../services/vendorService';

interface CategoryCarouselProps {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
}

export function CategoryCarousel({ activeCategory, onSelectCategory }: CategoryCarouselProps) {
  const [showCategoryList, setShowCategoryList] = useState(false);
  const [showViewPopup, setShowViewPopup] = useState(false);
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [locationRadius, setLocationRadius] = useState(10);
  const [availableCategories, setAvailableCategories] = useState<string[]>(['All']);

  const Portal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (typeof window === 'undefined') return null;
    return createPortal(children as any, document.body);
  };

  // Load available categories from database and merge with constants
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const dbCategories = await VendorService.getCategories();
        console.log('Raw categories from DB:', dbCategories);
        
        // Extract individual categories from comma-separated strings
        const dbCategorySet = new Set<string>();
        dbCategories.forEach(catString => {
          if (catString) {
            catString.split(',').forEach(cat => {
              const trimmed = cat.trim();
              if (trimmed) dbCategorySet.add(trimmed);
            });
          }
        });
        
        // Start with all predefined categories from constants
        const allCategories = new Set(CATEGORIES.filter(cat => cat !== 'All'));
        
        // Add any additional categories found in the database
        dbCategorySet.forEach(cat => allCategories.add(cat as any));
        
        const finalCategories = ['All', ...Array.from(allCategories).sort()];
        console.log('Final categories:', finalCategories);
        setAvailableCategories(finalCategories);
      } catch (error) {
        console.error('Error loading categories:', error);
        // Fallback to constants if database fails
        setAvailableCategories(CATEGORIES);
      }
    };
    loadCategories();
  }, []);

  const handleCategorySelect = (category: string) => {
    onSelectCategory(category);
    setShowCategoryList(false);
  };

  const handleViewSelect = (viewType: string) => {
    if (viewType === 'none') {
      onSelectCategory('All');
    } else {
      onSelectCategory(`View-${viewType}`);
    }
    setShowViewPopup(false);
  };

  const handleRatingSelect = (ratingType: string) => {
    if (ratingType === 'none') {
      onSelectCategory('All');
    } else {
      onSelectCategory(`Rating-${ratingType}`);
    }
    setShowRatingPopup(false);
  };

  const handleLocationSelect = () => {
    onSelectCategory(`Location-${locationRadius}`);
    setShowLocationPopup(false);
  };


  return (
    <>
      <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl p-3 shadow-sm">
        <div className="flex flex-wrap gap-1.5 items-center">
          {/* All button */}
          <button
            onClick={() => onSelectCategory('All')}
            className={`px-2 py-1 rounded-md border text-[11px] font-medium transition-all duration-200 focus:outline-none ${
              activeCategory === 'All'
                ? 'bg-rose-700 text-white border-rose-700 shadow-md'
                : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-rose-300 hover:bg-rose-50'
            }`}
            suppressHydrationWarning={true}
          >
            All
          </button>

          {/* List button */}
          <button
            onClick={() => setShowCategoryList(true)}
            className="px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:border-rose-300 hover:bg-rose-50 transition-all duration-200 focus:outline-none flex items-center gap-1 text-[11px]"
            suppressHydrationWarning={true}
          >
            <List className="w-3 h-3" />
            <span className="font-medium">List</span>
          </button>

          {/* View button */}
          <button
            onClick={() => setShowViewPopup(true)}
            className={`px-2 py-1 rounded-md border text-[11px] font-medium transition-all duration-200 focus:outline-none ${
              activeCategory.startsWith('View-')
                ? 'bg-blue-700 text-white border-blue-700 shadow-md'
                : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-blue-50'
            }`}
            suppressHydrationWarning={true}
          >
            View
          </button>

          {/* Rating button */}
          <button
            onClick={() => setShowRatingPopup(true)}
            className={`px-2 py-1 rounded-md border text-[11px] font-medium transition-all duration-200 focus:outline-none ${
              activeCategory.startsWith('Rating-')
                ? 'bg-yellow-700 text-white border-yellow-700 shadow-md'
                : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-yellow-300 hover:bg-yellow-50'
            }`}
            suppressHydrationWarning={true}
          >
            Rating
          </button>

          {/* Location button */}
          <button
            onClick={() => setShowLocationPopup(true)}
            className={`px-2 py-1 rounded-md border text-[11px] font-medium transition-all duration-200 focus:outline-none ${
              activeCategory.startsWith('Location-')
                ? 'bg-green-700 text-white border-green-700 shadow-md'
                : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-green-300 hover:bg-green-50'
            }`}
            suppressHydrationWarning={true}
          >
            Location
          </button>

        </div>
      </div>

      {/* Category List Popup */}
      {showCategoryList && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl w-full max-w-sm sm:max-w-md max-h-[80vh] flex flex-col shadow-xl">
            {/* Header */}
              <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Select Category</h3>
              <button
                onClick={() => setShowCategoryList(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
              </div>

            {/* Scrollable category list */}
              <div className="flex-1 overflow-y-auto p-3 pb-4">
                <div className="grid grid-cols-2 sm:grid-cols-1 gap-1.5 sm:gap-2">
                {availableCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategorySelect(category)}
                    className={`text-left px-2 py-1.5 sm:px-3 sm:py-2 rounded-md border text-xs sm:text-sm font-medium transition-all duration-200 focus:outline-none ${
                      activeCategory === category
                        ? 'bg-rose-700 text-white border-rose-700 shadow-md'
                        : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-rose-300 hover:bg-rose-50'
                    }`}
                  >
                    {category}
                  </button>
                ))}
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* View Popup */}
      {showViewPopup && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl w-full max-w-sm sm:max-w-md max-h-[80vh] flex flex-col shadow-xl">
            {/* Header */}
              <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Sort by View</h3>
              <button
                onClick={() => setShowViewPopup(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
              </div>

            {/* View Options */}
              <div className="flex-1 overflow-y-auto p-3 pb-4">
                <div className="space-y-2">
                <button
                  onClick={() => handleViewSelect('none')}
                  className="w-full text-left px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 focus:outline-none flex items-center gap-2"
                >
                  <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium">None</span>
                </button>
                
                <button
                  onClick={() => handleViewSelect('highest')}
                  className="w-full text-left px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 focus:outline-none flex items-center gap-2"
                >
                  <ChevronUp className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Highest to Lowest</span>
                </button>
                
                <button
                  onClick={() => handleViewSelect('lowest')}
                  className="w-full text-left px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 focus:outline-none flex items-center gap-2"
                >
                  <ChevronDown className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Lowest to Highest</span>
                </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Rating Popup */}
      {showRatingPopup && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl w-full max-w-sm sm:max-w-md max-h-[80vh] flex flex-col shadow-xl">
            {/* Header */}
              <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Sort by Rating</h3>
              <button
                onClick={() => setShowRatingPopup(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
              </div>

            {/* Rating Options */}
              <div className="flex-1 overflow-y-auto p-3 pb-4">
                <div className="space-y-2">
                <button
                  onClick={() => handleRatingSelect('none')}
                  className="w-full text-left px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 focus:outline-none flex items-center gap-2"
                >
                  <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium">None</span>
                </button>
                
                <button
                  onClick={() => handleRatingSelect('highest')}
                  className="w-full text-left px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:border-yellow-300 hover:bg-yellow-50 transition-all duration-200 focus:outline-none flex items-center gap-2"
                >
                  <ChevronUp className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium">Highest Rated</span>
                </button>
                
                <button
                  onClick={() => handleRatingSelect('lowest')}
                  className="w-full text-left px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:border-yellow-300 hover:bg-yellow-50 transition-all duration-200 focus:outline-none flex items-center gap-2"
                >
                  <ChevronDown className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium">Lowest Rated</span>
                </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Location Popup */}
      {showLocationPopup && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl w-full max-w-sm sm:max-w-md max-h-[80vh] flex flex-col shadow-xl">
            {/* Header */}
              <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Choose Distance</h3>
              <button
                onClick={() => setShowLocationPopup(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
              </div>

            {/* Location Options */}
              <div className="flex-1 overflow-y-auto p-3 pb-4">
                <div className="space-y-4">
                {/* Distance Display */}
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{locationRadius} km</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Search radius</div>
                </div>

                {/* Slider */}
                <div className="px-2">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={locationRadius}
                    onChange={(e) => setLocationRadius(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #10b981 0%, #10b981 ${(locationRadius / 50) * 100}%, #e5e7eb ${(locationRadius / 50) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>0 km</span>
                    <span>50 km</span>
                  </div>
                </div>

                {/* Apply Button */}
                <button
                  onClick={handleLocationSelect}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium">Apply Filter</span>
                </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}

