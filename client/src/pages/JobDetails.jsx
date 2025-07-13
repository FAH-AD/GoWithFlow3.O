import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { ReviewsList } from '../components/ReviewsList';
import { reviewService } from '../services/reviewService';

const JobDetails = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const { data } = await axios.get(`http://localhost:5000/api/jobs/${id}`);
       console.log(data, "data in job details");
        setJob({ ...data.job});
        
        // Fetch reviews if job is completed
        if (data.job.status === 'completed') {
          fetchJobReviews();
        }
      } catch (err) {
        console.error('Error fetching job details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  const fetchJobReviews = async () => {
    setReviewsLoading(true);
    try {
      const reviewsData = await reviewService.getJobReviews(id);
      console.log('Job reviews data received:', reviewsData);
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error fetching job reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!job) return <p className="text-center">Job not found.</p>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="bg-[#F8F2FC] rounded-lg p-6 shadow-xl">
        <div className="flex items-center gap-4 mb-4">
          {job.client?.profilePic && (
            <img src={job.client.profilePic} className="h-12 w-12 rounded-full" alt="Client" />
          )}
          <div>
            <h2 className="text-xl font-bold text-purple-700">{job.title}</h2>
            <p className="text-sm text-gray-600">{job.client?.name} - {job.role}</p>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-md font-semibold text-gray-800">Job Description</h4>
          <p className="text-sm text-gray-700">{job.description}</p>
        </div>

        <div className="mb-4">
          <h4 className="text-md font-semibold text-gray-800">Salary</h4>
          <p className="text-sm text-gray-700">
            {job.salary ? `₹${job.salary}` : `₹${job.salary_min} - ₹${job.salary_max}`}
          </p>
        </div>

        <div className="mb-4">
          <h4 className="text-md font-semibold text-gray-800">Tags</h4>
          <div className="flex flex-wrap gap-2">
            {job.tags?.map((tag, idx) => (
              <span key={idx} className="bg-purple-100 text-purple-600 px-2 py-1 text-xs rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <button className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded shadow">
          Apply Now
        </button>
      </div>

      {/* Reviews Section - Show only if job is completed */}
      {job.status === 'completed' && (
        <div className="mt-8 bg-white rounded-lg p-6 shadow-xl">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Project Reviews</h3>
          
          {reviewsLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : reviews && (reviews.clientReview || reviews.freelancerReview) ? (
            <div className="space-y-6">
              {reviews.clientReview && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-700 mb-3">Client's Review</h4>
                  <ReviewsList reviews={[reviews.clientReview]} />
                </div>
              )}
              
              {reviews.freelancerReview && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-700 mb-3">Freelancer's Review</h4>
                  <ReviewsList reviews={[reviews.freelancerReview]} />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No reviews available for this project yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JobDetails;
