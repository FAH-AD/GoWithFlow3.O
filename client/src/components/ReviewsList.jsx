import React from 'react';
import { Star, ThumbsUp, Calendar } from 'lucide-react';

const ReviewCard = ({ review, showJobTitle = false }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-500'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-400">({rating})</span>
      </div>
    );
  };

  const getReviewTypeLabel = (type) => {
    switch (type) {
      case 'client-to-freelancer':
        return 'Client Review';
      case 'freelancer-to-client':
        return 'Freelancer Review';
      default:
        return 'Review';
    }
  };

  return (
    <div className="bg-[#1c1c1f] border border-[#2d2d3a] rounded-lg p-6 shadow-sm hover:shadow-lg hover:border-[#9333EA]/30 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="h-10 w-10 bg-[#9333EA]/20 rounded-full flex items-center justify-center mr-3">
            {review.reviewer?.profileImage ? (
              <img
                src={review.reviewer.profileImage}
                alt={`${review.reviewer.firstName} ${review.reviewer.lastName}`}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-[#9333EA] font-medium text-sm">
                {review.reviewer?.firstName?.[0]}{review.reviewer?.lastName?.[0]}
              </span>
            )}
          </div>
          <div>
            <h4 className="font-medium text-white">
              {review.reviewer?.firstName} {review.reviewer?.lastName}
            </h4>
            <p className="text-sm text-gray-400">{getReviewTypeLabel(review.type)}</p>
          </div>
        </div>
        <div className="text-right">
          {renderStars(review.rating)}
          <div className="flex items-center text-xs text-gray-500 mt-1">
            <Calendar className="h-3 w-3 mr-1" />
            {formatDate(review.createdAt)}
          </div>
        </div>
      </div>

      {showJobTitle && review.job?.title && (
        <div className="mb-3">
          <p className="text-sm text-[#9333EA] font-medium">
            Job: {review.job.title}
          </p>
        </div>
      )}

      <div className="mb-4">
        <p className="text-gray-300 text-sm leading-relaxed">
          {review.comment}
        </p>
      </div>

      {/* Detailed ratings */}
      {(review.communication || review.qualityOfWork || review.valueForMoney || 
        review.expertise || review.professionalism) && (
        <div className="border-t border-[#2d2d3a] pt-4">
          <h5 className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
            Detailed Ratings
          </h5>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {review.communication && (
              <div className="flex justify-between">
                <span className="text-gray-400">Communication:</span>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3 w-3 ${
                        star <= review.communication ? 'text-yellow-400 fill-current' : 'text-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
            {review.qualityOfWork && (
              <div className="flex justify-between">
                <span className="text-gray-400">Quality:</span>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3 w-3 ${
                        star <= review.qualityOfWork ? 'text-yellow-400 fill-current' : 'text-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
            {review.valueForMoney && (
              <div className="flex justify-between">
                <span className="text-gray-400">Value:</span>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3 w-3 ${
                        star <= review.valueForMoney ? 'text-yellow-400 fill-current' : 'text-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
            {review.expertise && (
              <div className="flex justify-between">
                <span className="text-gray-400">Expertise:</span>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3 w-3 ${
                        star <= review.expertise ? 'text-yellow-400 fill-current' : 'text-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
            {review.professionalism && (
              <div className="flex justify-between">
                <span className="text-gray-400">Professionalism:</span>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3 w-3 ${
                        star <= review.professionalism ? 'text-yellow-400 fill-current' : 'text-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Helpful votes */}
      {review.helpfulVotes?.length > 0 && (
        <div className="border-t border-[#2d2d3a] pt-3 mt-3">
          <div className="flex items-center text-xs text-gray-400">
            <ThumbsUp className="h-3 w-3 mr-1" />
            {review.helpfulVotes.length} people found this helpful
          </div>
        </div>
      )}
    </div>
  );
};

const ReviewsList = ({ reviews, loading = false, showJobTitles = false }) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#1c1c1f] border border-[#2d2d3a] rounded-lg p-6 animate-pulse">
            <div className="flex items-center mb-4">
              <div className="h-10 w-10 bg-gray-600 rounded-full mr-3"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-600 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-600 rounded w-1/6"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-600 rounded"></div>
              <div className="h-3 bg-gray-600 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <Star className="h-12 w-12 text-gray-500 mx-auto mb-3" />
        <p className="text-gray-400">No reviews yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewCard 
          key={review._id} 
          review={review} 
          showJobTitle={showJobTitles}
        />
      ))}
    </div>
  );
};

export { ReviewCard, ReviewsList };
export default ReviewsList;
