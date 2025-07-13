import React, { useState } from 'react';
import { X, Star, MessageSquare } from 'lucide-react';

const ReviewModal = ({ 
  isOpen, 
  onClose, 
  job, 
  recipient, 
  onSubmitReview 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [review, setReview] = useState({
    rating: 0,
    comment: '',
    communication: 0,
    qualityOfWork: 0,
    valueForMoney: 0,
    expertise: 0,
    professionalism: 0
  });
  const [hoveredRating, setHoveredRating] = useState({
    rating: 0,
    communication: 0,
    qualityOfWork: 0,
    valueForMoney: 0,
    expertise: 0,
    professionalism: 0
  });

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (review.rating === 0) {
      alert('Please provide an overall rating');
      return;
    }
    if (!review.comment.trim()) {
      alert('Please provide a comment');
      return;
    }

    setIsSubmitting(true);
    try {

        console.log('Submitting review:', {
          jobId: job._id,
          recipient: recipient._id,
          ...review
        });
      await onSubmitReview({
        jobId: job._id,
        recipient: recipient._id,
        ...review
      });
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarRating = (category, label) => {
    const currentRating = review[category];
    const currentHovered = hoveredRating[category];

    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-sm font-medium text-gray-700 w-32">{label}</span>
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setReview(prev => ({ ...prev, [category]: star }))}
              onMouseEnter={() => setHoveredRating(prev => ({ ...prev, [category]: star }))}
              onMouseLeave={() => setHoveredRating(prev => ({ ...prev, [category]: 0 }))}
              className="focus:outline-none"
            >
              <Star
                className={`h-5 w-5 ${
                  star <= (currentHovered || currentRating)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Leave a Review
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6">
          <h4 className="font-medium text-gray-800 mb-1">{job?.title}</h4>
          <p className="text-sm text-gray-600">
            Review for: {recipient?.firstName} {recipient?.lastName}
          </p>
        </div>

        <div className="space-y-4">
          {/* Overall Rating */}
          <div className="border-b border-gray-200 pb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overall Rating *
            </label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReview(prev => ({ ...prev, rating: star }))}
                  onMouseEnter={() => setHoveredRating(prev => ({ ...prev, rating: star }))}
                  onMouseLeave={() => setHoveredRating(prev => ({ ...prev, rating: 0 }))}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating.rating || review.rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {review.rating > 0 && (
                  <>
                    {review.rating} star{review.rating !== 1 ? 's' : ''}
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Detailed Ratings */}
          <div className="border-b border-gray-200 pb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Detailed Ratings
            </label>
            <div className="space-y-1">
              {renderStarRating('communication', 'Communication')}
              {renderStarRating('qualityOfWork', 'Quality of Work')}
              {renderStarRating('valueForMoney', 'Value for Money')}
              {renderStarRating('expertise', 'Expertise')}
              {renderStarRating('professionalism', 'Professionalism')}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comment *
            </label>
            <textarea
              value={review.comment}
              onChange={(e) => setReview(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="Share your experience working with this person..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
              rows={4}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum 10 characters required
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || review.rating === 0 || review.comment.trim().length < 10}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <MessageSquare className="h-4 w-4 mr-2" />
                Submit Review
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
