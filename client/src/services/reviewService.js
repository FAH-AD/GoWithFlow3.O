import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with auth token
const createApiInstance = () => {
  const token = localStorage.getItem('authToken');
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  });
};

// Job completion services
export const jobCompletionService = {
  // Client completes a job
  completeJob: async (jobId) => {
    const api = createApiInstance();
    const response = await api.put(`/jobs/${jobId}/complete`);
    return response.data;
  },

  // Freelancer submits work for completion
  submitWork: async (jobId, workData) => {
    const api = createApiInstance();
    const response = await api.put(`/jobs/${jobId}/submit-work`, workData);
    return response.data;
  },

  // Get job details including work submission
  getJobDetails: async (jobId) => {
    const api = createApiInstance();
    const response = await api.get(`/jobs/${jobId}`);
    return response.data;
  }
};

// Review services
export const reviewService = {
  // Create a new review
  createReview: async (reviewData) => {
    const api = createApiInstance();
    const response = await api.post('/reviews', reviewData);
    return response.data;
  },

  // Get reviews for a specific user
  getUserReviews: async (userId, page = 1, limit = 10) => {
    const api = createApiInstance();
    const response = await api.get(`/reviews/user/${userId}?page=${page}&limit=${limit}`);
    return response.data.data || response.data; // Extract data from API response structure
  },

  // Get reviews for a specific job
  getJobReviews: async (jobId) => {
    const api = createApiInstance();
    const response = await api.get(`/reviews/job/${jobId}`);
    return response.data.data || response.data; // Extract data from API response structure
  },

  // Update an existing review
  updateReview: async (reviewId, reviewData) => {
    const api = createApiInstance();
    const response = await api.put(`/reviews/${reviewId}`, reviewData);
    return response.data;
  },

  // Delete a review
  deleteReview: async (reviewId) => {
    const api = createApiInstance();
    const response = await api.delete(`/reviews/${reviewId}`);
    return response.data;
  },

  // Mark review as helpful
  markReviewAsHelpful: async (reviewId) => {
    const api = createApiInstance();
    const response = await api.post(`/reviews/${reviewId}/helpful`);
    return response.data;
  },

  // Report a review
  reportReview: async (reviewId, reportData) => {
    const api = createApiInstance();
    const response = await api.post(`/reviews/${reviewId}/report`, reportData);
    return response.data;
  }
};

// User services for profile data
export const userService = {
  // Get user profile with reviews
  getUserProfile: async (userId) => {
    const api = createApiInstance();
    const response = await api.get(`/user-profile/${userId}`);
    return response.data;
  },

  // Get review statistics for a user
  getUserReviewStats: async (userId) => {
    const api = createApiInstance();
    try {
      const response = await api.get(`/reviews/user/${userId}`);
      return response.data.stats || {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    } catch (error) {
      console.error('Error fetching review stats:', error);
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }
  }
};

// Notification services
export const notificationService = {
  // Get user notifications
  getNotifications: async () => {
    const api = createApiInstance();
    const response = await api.get('/notifications');
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const api = createApiInstance();
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  }
};

// File upload service
export const uploadService = {
  // Upload files for work submission
  uploadFiles: async (files) => {
    const api = createApiInstance();
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append(`files`, file);
    });

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }
};

export default {
  jobCompletionService,
  reviewService,
  userService,
  notificationService,
  uploadService
};
