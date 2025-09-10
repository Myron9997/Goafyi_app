"use client";

import React, { useState, useEffect } from 'react';
import { Star, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { RatingService, type RatingStats, type RatingWithUser } from '../services/ratingService';

interface RatingDisplayProps {
  vendorId: string;
  vendorName: string;
  userId?: string;
  onRateClick: () => void;
  showRateButton?: boolean;
}

export function RatingDisplay({
  vendorId,
  vendorName,
  userId,
  onRateClick,
  showRateButton = true
}: RatingDisplayProps) {
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  const [reviews, setReviews] = useState<RatingWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);

  useEffect(() => {
    loadRatingData();
  }, [vendorId, userId]);

  const loadRatingData = async () => {
    try {
      setLoading(true);
      
      // Load rating stats
      const stats = await RatingService.getVendorRatingStats(vendorId);
      setRatingStats(stats);

      // Load recent reviews
      const { ratings } = await RatingService.getVendorRatings(vendorId, 1, 5);
      setReviews(ratings);

      // Load user's rating if logged in
      if (userId) {
        const userRatingData = await RatingService.getUserRating(vendorId, userId);
        setUserRating(userRatingData?.rating || null);
      }
    } catch (error) {
      console.error('Error loading rating data:', error);
    } finally {
      setLoading(false);
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
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!ratingStats || ratingStats.total_ratings === 0) {
    return (
      <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="text-center py-4">
          <Star className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">No ratings yet</p>
          {showRateButton && userId && (
            <button
              onClick={onRateClick}
              className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors text-sm"
            >
              Be the first to rate
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Rating Summary */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {ratingStats.average_rating.toFixed(1)}
            </div>
            <div>
              {renderStars(Math.round(ratingStats.average_rating), 'md')}
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {ratingStats.total_ratings} {ratingStats.total_ratings === 1 ? 'rating' : 'ratings'}
              </p>
            </div>
          </div>
          
          {showRateButton && userId && (
            <button
              onClick={onRateClick}
              className="px-3 py-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors text-sm flex items-center gap-1"
            >
              <Star className="w-4 h-4" />
              {userRating ? 'Update Rating' : 'Rate'}
            </button>
          )}
        </div>

        {/* Rating Distribution */}
        <div className="space-y-1">
          {ratingStats.rating_distribution.map(({ rating, count }) => (
            <div key={rating} className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 w-2">{rating}</span>
              <Star className="w-3 h-3 text-yellow-400 fill-current" />
              <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full"
                  style={{
                    width: `${(count / ratingStats.total_ratings) * 100}%`
                  }}
                />
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 w-8">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews */}
      {reviews.length > 0 && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Reviews</h4>
            {reviews.length > 3 && (
              <button
                onClick={() => setShowAllReviews(!showAllReviews)}
                className="text-sm text-rose-600 hover:text-rose-700 flex items-center gap-1"
              >
                {showAllReviews ? (
                  <>
                    Show Less <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Show All <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>

          <div className="space-y-4">
            {(showAllReviews ? reviews : reviews.slice(0, 3)).map((review) => (
              <div key={review.id} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0 pb-4 last:pb-0">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-pink-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {review.reviewer.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {review.reviewer.full_name || 'Anonymous'}
                      </span>
                      {renderStars(review.rating, 'sm')}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(review.created_at)}
                      </span>
                    </div>
                    {review.review_text && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-600 leading-relaxed">
                        {review.review_text}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
