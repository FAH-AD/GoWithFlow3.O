import React from 'react';
import { Star, TrendingUp } from 'lucide-react';

const ReviewSummary = ({ userId, stats, reviews = [] }) => {
  // Calculate average rating from reviews if stats not provided
  const calculateStats = () => {
    if (stats) return stats;
    
    if (!reviews || reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    const totalReviews = reviews.length;
    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
    
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      distribution[review.rating] = (distribution[review.rating] || 0) + 1;
    });

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      ratingDistribution: distribution
    };
  };

  const reviewStats = calculateStats();

  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= Math.floor(rating) ? 'text-yellow-400 fill-current' : 
              star <= rating ? 'text-yellow-400 fill-current opacity-50' : 'text-gray-500'
            }`}
          />
        ))}
      </div>
    );
  };

  const getPercentage = (count, total) => {
    return total > 0 ? Math.round((count / total) * 100) : 0;
  };

  if (reviewStats.totalReviews === 0) {
    return (
      <div className="bg-[#1c1c1f] border border-[#2d2d3a] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Reviews</h3>
        <div className="text-center py-8">
          <Star className="h-12 w-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">No reviews yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Complete some jobs to start receiving reviews
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1c1c1f] border border-[#2d2d3a] rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Reviews</h3>
      
      {/* Overall Rating */}
      <div className="flex items-center mb-6">
        <div className="text-center mr-8">
          <div className="text-3xl font-bold text-white mb-1">
            {reviewStats.averageRating}
          </div>
          {renderStars(reviewStats.averageRating)}
          <p className="text-sm text-gray-400 mt-1">
            {reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Rating Distribution */}
        <div className="flex-1">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = reviewStats.ratingDistribution[rating] || 0;
            const percentage = getPercentage(count, reviewStats.totalReviews);
            
            return (
              <div key={rating} className="flex items-center mb-1">
                <span className="text-sm text-gray-400 w-8">{rating}</span>
                <Star className="h-4 w-4 text-yellow-400 fill-current mr-2" />
                <div className="flex-1 bg-gray-600 rounded-full h-2 mr-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-400 w-12 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Trends */}
      {reviews.length >= 5 && (
        <div className="border-t border-[#2d2d3a] pt-4">
          <div className="flex items-center text-sm text-gray-400">
            <TrendingUp className="h-4 w-4 mr-2 text-green-400" />
            <span>
              {(() => {
                const recentReviews = reviews.slice(0, 5);
                const recentAvg = recentReviews.reduce((sum, review) => sum + review.rating, 0) / recentReviews.length;
                const overallAvg = reviewStats.averageRating;
                
                if (recentAvg > overallAvg) {
                  return "Recent reviews trending up";
                } else if (recentAvg < overallAvg) {
                  return "Recent reviews trending down";
                } else {
                  return "Consistent quality in recent reviews";
                }
              })()}
            </span>
          </div>
        </div>
      )}

      {/* Category Averages (if available) */}
      {reviews.length > 0 && (
        <div className="border-t border-[#2d2d3a] pt-4 mt-4">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Category Averages</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {['communication', 'qualityOfWork', 'valueForMoney', 'expertise', 'professionalism'].map((category) => {
              const categoryReviews = reviews.filter(r => r[category]);
              if (categoryReviews.length === 0) return null;
              
              const average = categoryReviews.reduce((sum, r) => sum + r[category], 0) / categoryReviews.length;
              const label = category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              
              return (
                <div key={category} className="flex justify-between items-center">
                  <span className="text-gray-400">{label}:</span>
                  <div className="flex items-center">
                    <span className="text-sm font-medium mr-1 text-white">{Math.round(average * 10) / 10}</span>
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewSummary;
