"use client";

import React, { useState, useEffect } from 'react';
import { Star, X, Send } from 'lucide-react';
import { RatingService, type RatingFormData, type VendorRating } from '../services/ratingService';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorId: string;
  vendorName: string;
  userId: string;
  onRatingSubmitted: (rating: VendorRating) => void;
  existingRating?: VendorRating | null;
}

export function RatingModal({
  isOpen,
  onClose,
  vendorId,
  vendorName,
  userId,
  onRatingSubmitted,
  existingRating
}: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with existing rating if available
  useEffect(() => {
    if (existingRating) {
      setRating(existingRating.rating);
      setReviewText(existingRating.review_text || '');
    } else {
      setRating(0);
      setReviewText('');
    }
    setError(null);
  }, [existingRating, isOpen]);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const ratingData: RatingFormData = {
        rating,
        review_text: reviewText.trim() || undefined
      };

      const result = await RatingService.submitRating(vendorId, userId, ratingData);
      
      if (result) {
        onRatingSubmitted(result);
        onClose();
      } else {
        setError('Failed to submit rating. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
  };

  const handleStarHover = (starRating: number) => {
    setHoveredRating(starRating);
  };

  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {existingRating ? 'Update Rating' : 'Rate & Review'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Vendor Name */}
          <div className="text-center">
            <p className="text-gray-600">Rate your experience with</p>
            <p className="font-semibold text-gray-900">{vendorName}</p>
          </div>

          {/* Star Rating */}
          <div className="flex justify-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleStarClick(star)}
                onMouseEnter={() => handleStarHover(star)}
                onMouseLeave={handleStarLeave}
                className="focus:outline-none transition-colors"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoveredRating || rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Rating Labels */}
          <div className="text-center">
            {rating > 0 && (
              <p className="text-sm text-gray-600">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            )}
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Write a review (optional)
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience with this vendor..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
              rows={4}
              maxLength={500}
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {reviewText.length}/500
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0}
              className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {existingRating ? 'Update' : 'Submit'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
