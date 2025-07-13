"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import {
  Calendar,
  CheckCircle,
  AlertTriangle,
  FileText,
  ChevronDown,
  X,
  Plus,
  Download,
  User,
  MessageSquare,
  DollarSign,
  Clock,
  CheckSquare,
  Star,
  MapPin,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Navbar from "../components/Navbar"
import JobCompletionModal from "../components/JobCompletionModal"
import ReviewModal from "../components/ReviewModal"
import { jobCompletionService, reviewService } from "../services/reviewService"
import ReviewsList from "../components/ReviewsList"

const ClientJobDetails = () => {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const user = useSelector((state) => state.Auth.user)
  const [job, setJob] = useState(null)
  const [freelancerProfile, setFreelancerProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [jobReviews, setJobReviews] = useState(null)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [hasUserReviewed, setHasUserReviewed] = useState(false)
  const [error, setError] = useState(null)
  const [expandedMilestones, setExpandedMilestones] = useState({})
  const [newMilestoneOpen, setNewMilestoneOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [approvingMilestone, setApprovingMilestone] = useState(null)
  const [reviewRecipient, setReviewRecipient] = useState(null)

  const token = localStorage.getItem("authToken")

  useEffect(() => {
    if (!user) {
      navigate("/login", {
        state: {
          from: `/client/jobs/${jobId}`,
          message: "Please login to view job details",
        },
      });
    } else if (user.role !== "client") {
      navigate("/", {
        state: { message: "Only clients can access this page" },
      });
    } else {
      fetchJobDetails();
    }
  }, [user, navigate, jobId]);

  const fetchJobDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/jobs/${jobId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setJob(response.data.data);
      console.log("Job details fetched:", response.data.data);

      // Fetch freelancer profile if job has an assigned freelancer
      if (response.data.data.hiredFreelancer) {
        await fetchFreelancerProfile(response.data.data.hiredFreelancer)
      }

      // Fetch job reviews if job is completed
      if (response.data.data.status === 'completed') {
        await fetchJobReviews()
      }
      
    } catch (err) {
      console.error("Error fetching job details:", err);
      setError("Failed to fetch job details");
    } finally {
      setIsLoading(false);
    }
  }

  const fetchJobReviews = async () => {
    setReviewsLoading(true)
    try {
      const reviewsData = await reviewService.getJobReviews(jobId)
      console.log('Job reviews data received:', reviewsData)
      setJobReviews(reviewsData)
      
      // Check if current user has already reviewed
      const clientReview = reviewsData.clientReview
      const freelancerReview = reviewsData.freelancerReview
      
      if (user.role === 'client' && clientReview) {
        setHasUserReviewed(true)
      } else if (user.role === 'freelancer' && freelancerReview) {
        setHasUserReviewed(true)
      }
    } catch (error) {
      console.error('Error fetching job reviews:', error)
    } finally {
      setReviewsLoading(false)
    }
  }

  const fetchFreelancerProfile = async (freelancerId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/user-profile/${freelancerId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const profileData = await response.json()
        console.log("Freelancer profile data:", profileData.data.user._id)
        setFreelancerProfile(profileData.data.user)

      }

      console.log("Freelancer profile fetched successfully:", freelancerProfile)

    } catch (err) {
      console.error("Error fetching freelancer profile:", err);
    }
  };

  const handleApproveMilestone = async (milestoneId) => {
    try {
      setApprovingMilestone(milestoneId);
      await axios.put(
        `http://localhost:5000/api/jobs/${jobId}/milestones/${milestoneId}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      await fetchJobDetails();
    } catch (err) {
      console.error("Error approving milestone:", err);
    } finally {
      setApprovingMilestone(null);
    }
  };

  const handleRequestRevision = async (milestoneId) => {
    try {
      await axios.post(
        `http://localhost:5000/api/jobs/${jobId}/milestones/${milestoneId}/requestRevision`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      await fetchJobDetails();
    } catch (err) {
      console.error("Error requesting revision:", err);
    }
  };
  const handleStartConversation = ({ otherUserId }) => {
    startConversation({
      receiverId: otherUserId,
      jobId,
      onSuccess: (data) => {
        navigate(`/client/messages/${data.message.conversation._id}`);

        console.log("Conversation created and joined:", data);
      },
      onError: (err) => {
        console.error("Failed to start conversation", err);
      },
    });
  };
  const toggleMilestoneExpand = (milestoneId) => {
    setExpandedMilestones((prev) => ({
      ...prev,
      [milestoneId]: !prev[milestoneId],
    }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const NewMilestoneForm = ({ onClose }) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [deadline, setDeadline] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      // setError("")

      try {
        console.log("Submitting new milestone:", {
          title,
          description,
          amount,
          deadline,
          jobId,
        });
        if (!title || !description || !amount || !deadline) {
          setError("All fields are required");
          return;
        }
        await axios.post(
          `http://localhost:5000/api/jobs/${jobId}/milestones`,
          {
            freelancerId: job.hiredFreelancer,

            title,
            description,
            amount: Number.parseFloat(amount),
            deadline,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setSuccess(true);
        await fetchJobDetails();

        setTimeout(() => {
          onClose();
        }, 2000);
      } catch (err) {
        console.log("Submitting new milestone:");
        setError(err.response?.data?.message || "Failed to create milestone");
      } finally {
        setLoading(false);
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 px-4 py-6 sm:p-0"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.9 }}
          className="bg-[#1c1c24] rounded-lg p-4 sm:p-6 md:p-8 w-full max-w-md mx-auto relative"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>

          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            Create New Milestone
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Add a new milestone for this job
          </p>

          {success && (
            <div className="bg-green-900/30 border border-green-500 text-green-200 px-4 py-3 rounded mb-4 flex items-center">
              <CheckCircle size={18} className="mr-2" />
              <span>Milestone created successfully!</span>
            </div>
          )}

          {error && (
            <div className="bg-red-900/30 border border-red-500 text-red-200 px-4 py-3 rounded mb-4 flex items-center">
              <AlertTriangle size={18} className="mr-2" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Milestone Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#2d2d3a] text-white rounded-md px-3 py-2 text-sm border border-[#3d3d4a] focus:border-[#9333EA] focus:outline-none"
                placeholder="e.g., Design Homepage"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#2d2d3a] text-white rounded-md px-3 py-2 text-sm border border-[#3d3d4a] focus:border-[#9333EA] focus:outline-none"
                rows="3"
                placeholder="Describe what should be delivered in this milestone"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Amount (PKR)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#2d2d3a] text-white rounded-md px-3 py-2 text-sm border border-[#3d3d4a] focus:border-[#9333EA] focus:outline-none"
                placeholder="e.g., 500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Deadline
              </label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-[#2d2d3a] text-white rounded-md px-3 py-2 text-sm border border-[#3d3d4a] focus:border-[#9333EA] focus:outline-none"
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 mt-6">
              <button
                disabled={loading || success}
                onClick={handleSubmit}
                className={`${
                  loading || success
                    ? "bg-[#9333EA]/50 cursor-not-allowed"
                    : "bg-[#9333EA] hover:bg-[#7928CA]"
                } text-white px-4 py-2 rounded-md text-sm font-medium w-full sm:w-auto flex items-center justify-center`}
              >
                {loading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                    Processing...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle size={16} className="mr-2" />
                    Created!
                  </>
                ) : (
                  "Create Milestone"
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="bg-[#2D3748] text-white px-4 py-2 rounded-md hover:bg-[#4A5568] text-sm font-medium w-full sm:w-auto"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    )
  }

  // Handle job completion
  const handleCompleteJob = async () => {
    try {
      await jobCompletionService.completeJob(jobId);
      await fetchJobDetails();
      alert('Job marked as completed successfully! Both you and the freelancer will be prompted to leave reviews.');
    } catch (error) {
      console.error('Error completing job:', error);
      alert('Failed to complete job. Please try again.');
    }
  };

  // Handle starting review process
  const handleStartReview = (recipient) => {
    setReviewRecipient(recipient);
    setIsReviewModalOpen(true);
  };

  // Handle review submission
  const handleSubmitReview = async (reviewData) => {
    try {
      await reviewService.createReview(reviewData);
      alert('Review submitted successfully!');
      setHasUserReviewed(true); // Update state immediately
      await fetchJobDetails(); // Refresh job details and reviews
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white">
        <Navbar />
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-[#9333EA] border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-white">Loading job details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="bg-red-900/20 border border-red-800 rounded-md p-4">
            <AlertTriangle size={24} className="text-red-400 mb-2" />
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-[39px] text-white">
      <Navbar />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r mb-6 h-[200px] from-[#9333EA]/20 to-[#0a0a0f] border-b border-[#2d2d3a] flex items-center"
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full">
            <div>
              <div className="flex items-center">
                <FileText className="text-[#9333EA] mr-2" size={24} />
                <h1 className="text-2xl md:text-3xl font-bold">{job?.title}</h1>
              </div>
              <p className="text-gray-400 mt-1">
                Job Details & Milestone Management
              </p>
            </div>
            {job?.hiredFreelancer && (
              <button
                onClick={() => setNewMilestoneOpen(true)}
                className="bg-[#9333EA] text-white px-4 py-2 rounded-md hover:bg-[#7928CA] transition-colors flex items-center mt-4 md:mt-0"
              >
                <Plus size={18} className="mr-2" />
                Add Milestone
              </button>
            )}
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 py-8">
        {job && (
          <>
            {/* Job Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-[#1c1c24] rounded-lg p-6 mb-6"
            >
              <h2 className="text-xl font-bold mb-4">Job Overview</h2>
              <p className="text-gray-300 mb-6">{job.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#2d2d3a] p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <h3 className="text-sm font-medium text-gray-400">
                      Budget
                    </h3>
                  </div>
                  <p className="text-lg font-bold">
                    PKR {job.budget?.toLocaleString()}
                  </p>
                </div>

                <div className="bg-[#2d2d3a] p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Calendar size={18} className="text-[#9333EA] mr-2" />
                    <h3 className="text-sm font-medium text-gray-400">
                      Deadline
                    </h3>
                  </div>
                  <p className="text-lg font-bold">
                    {formatDate(job.deadline)}
                  </p>
                </div>

                <div className="bg-[#2d2d3a] p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Clock size={18} className="text-[#9333EA] mr-2" />
                    <h3 className="text-sm font-medium text-gray-400">
                      Status
                    </h3>
                  </div>
                  <p className="text-lg font-bold capitalize">{job.status}</p>
                </div>

                <div className="bg-[#2d2d3a] p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <CheckSquare size={18} className="text-[#9333EA] mr-2" />
                    <h3 className="text-sm font-medium text-gray-400">
                      Milestones
                    </h3>
                  </div>
                  <p className="text-lg font-bold">
                    {job.milestones?.length || 0}
                  </p>
                </div>
              </div>

              {/* Job Actions */}
              {job.status === 'in-progress' && (job.workSubmission || job.milestones?.some(m => m.status === 'submitted')) && (
                <div className="mt-6 p-4 bg-[#2d2d3a] rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Job Actions</h3>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setIsCompletionModalOpen(true)}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete Job
                    </button>
                  </div>
                  {job.workSubmission && (
                    <div className="mt-3 p-3 bg-[#1c1c24] rounded-lg">
                      <p className="text-sm text-green-400 mb-1">✓ Work submitted by freelancer</p>
                      <p className="text-xs text-gray-400">Review the submitted work and mark the job as completed when satisfied.</p>
                    </div>
                  )}
                </div>
              )}

              {job.status === 'completed' && !hasUserReviewed && freelancerProfile && (
                <div className="mt-6 p-4 bg-[#2d2d3a] rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Leave Review</h3>
                  <button
                    onClick={() => handleStartReview(freelancerProfile)}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    Review Freelancer
                  </button>
                </div>
              )}
            </motion.div>

            {/* Freelancer Profile */}
            {job.hiredFreelancer && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-[#1c1c24] rounded-lg p-6 mb-6"
              >
                <h2 className="text-xl font-bold mb-4">Assigned Freelancer</h2>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  <img
                    src={
                      freelancerProfile?.profilePic ||
                      "https://res.cloudinary.com/dxmeatsae/image/upload/v1745772539/client_verification_docs/mhpbkpi3vnkejxe0kpai.png" ||
                      "/placeholder.svg"
                    }
                    alt={freelancerProfile?.name}
                    className="w-20 h-20 rounded-full"
                  />

                  <div className="flex-1">
                    <h3 className="text-lg font-bold">
                      {freelancerProfile?.name}
                    </h3>

                    {freelancerProfile && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {freelancerProfile.skills &&
                          freelancerProfile.skills.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-400 mb-1">
                                Skills
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {freelancerProfile.skills
                                  .slice(0, 5)
                                  .map((skill, index) => (
                                    <span
                                      key={index}
                                      className="bg-[#9333EA]/20 text-[#9333EA] px-2 py-1 rounded text-xs"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                              </div>
                            </div>
                          )}

                        {freelancerProfile.location && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-400 mb-1">
                              Location
                            </h4>
                            <div className="flex items-center text-sm text-gray-300">
                              <MapPin size={14} className="mr-1" />
                              {freelancerProfile.location}
                            </div>
                          </div>
                        )}

                        {freelancerProfile.rating && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-400 mb-1">
                              Rating
                            </h4>
                            <div className="flex items-center text-sm">
                              <Star
                                size={14}
                                className="text-yellow-500 mr-1"
                              />
                              <span>{freelancerProfile.rating}/5</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() =>
                        navigate(`/freelancer/profile/${freelancerProfile._id}`)
                      }
                      className="bg-[#2d2d3a] text-white px-4 py-2 rounded-md hover:bg-[#3d3d4a] transition-colors flex items-center text-sm"
                    >
                      <User size={16} className="mr-2" />
                      View Profile
                    </button>
                    <button
                      onClick={() =>
                        handleStartConversation({
                          otherUserId: freelancerProfile._id,
                        })
                      }
                      className="bg-[#2d2d3a] text-white px-4 py-2 rounded-md hover:bg-[#3d3d4a] transition-colors flex items-center text-sm"
                    >
                      <MessageSquare size={16} className="mr-2" />
                      Message
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Milestones */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-[#1c1c24] rounded-lg p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Milestones</h2>
                <div className="flex gap-2">
                  <span className="text-sm text-gray-400">
                    {job.milestones?.filter((m) => m.status === "approved")
                      .length || 0}{" "}
                    completed
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className="text-sm text-gray-400">
                    {job.milestones?.filter((m) => m.status === "submitted")
                      .length || 0}{" "}
                    pending review
                  </span>
                </div>
              </div>

              {/* Active Milestones */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-300 mb-4">
                  Active Milestones
                </h3>
                {job.milestones?.filter((m) => m.status === "in-progress")
                  .length === 0 ? (
                  <p className="text-gray-400 text-center py-8">
                    No active milestones
                  </p>
                ) : (
                  <div className="space-y-4">
                    {job.milestones
                      ?.filter((m) => m.status === "in-progress")
                      .map((milestone) => (
                        <div
                          key={milestone._id}
                          className="bg-[#2d2d3a] rounded-lg border-l-4 border-blue-500"
                        >
                          <div
                            className="p-4 cursor-pointer"
                            onClick={() => toggleMilestoneExpand(milestone._id)}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-medium">
                                  {milestone.title}
                                </h4>
                                <p className="text-sm text-gray-400 mt-1">
                                  {milestone.description}
                                </p>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-sm font-medium">
                                    PKR {milestone.amount.toLocaleString()}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {formatDate(milestone.deadline)}
                                  </p>
                                </div>
                                <ChevronDown
                                  size={18}
                                  className={`transition-transform ${
                                    expandedMilestones[milestone._id]
                                      ? "transform rotate-180"
                                      : ""
                                  }`}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Submitted Milestones */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-300 mb-4">
                  Submitted Milestones
                </h3>
                {job.milestones?.filter((m) => m.status === "submitted")
                  .length === 0 ? (
                  <p className="text-gray-400 text-center py-8">
                    No submitted milestones
                  </p>
                ) : (
                  <div className="space-y-4">
                    {job.milestones
                      ?.filter((m) => m.status === "submitted")
                      .map((milestone) => (
                        <div
                          key={milestone._id}
                          className="bg-[#2d2d3a] rounded-lg border-l-4 border-yellow-500"
                        >
                          <div className="p-4">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h4 className="font-medium">
                                  {milestone.title}
                                </h4>
                                <p className="text-sm text-gray-400 mt-1">
                                  {milestone.description}
                                </p>
                                <div className="flex items-center gap-4 mt-2">
                                  <span className="text-sm">
                                    PKR {milestone.amount.toLocaleString()}
                                  </span>
                                  <span className="text-sm text-gray-400">
                                    {formatDate(milestone.deadline)}
                                  </span>
                                  <span className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full text-xs">
                                    Submitted
                                  </span>
                                </div>
                              </div>
                            </div>

                            {milestone.submission && (
                              <div className="bg-[#1c1c24] rounded-lg p-4 mb-4">
                                <div className="flex justify-between items-center mb-2">
                                  <h5 className="text-sm font-medium text-white">
                                    Submission Details
                                  </h5>
                                  <span className="text-xs text-gray-400">
                                    {new Date(
                                      milestone.submission.submittedAt
                                    ).toLocaleString()}
                                  </span>
                                </div>

                                {milestone.submission.message && (
                                  <p className="text-sm text-gray-300 mb-3">
                                    {milestone.submission.message}
                                  </p>
                                )}

                                {milestone.submission.attachments &&
                                  milestone.submission.attachments.length >
                                    0 && (
                                    <div className="space-y-2">
                                      <p className="text-xs text-gray-400">
                                        Attachments:
                                      </p>
                                      <div className="flex flex-wrap gap-2">
                                        {milestone.submission.attachments.map(
                                          (attachment) => (
                                            <a
                                              key={attachment._id}
                                              href={attachment.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="bg-[#2d2d3a] text-[#9333EA] px-3 py-1 rounded-md text-xs hover:bg-[#3d3d4a] transition-colors flex items-center"
                                            >
                                              <Download
                                                size={12}
                                                className="mr-1"
                                              />
                                              View Attachment
                                            </a>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}
                              </div>
                            )}

                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() =>
                                  handleRequestRevision(milestone._id)
                                }
                                className="bg-yellow-600 text-white px-3 py-1 rounded-md text-sm hover:bg-yellow-700 transition-colors flex items-center"
                              >
                                <AlertTriangle size={14} className="mr-1" />
                                Request Revision
                              </button>
                              <button
                                onClick={() =>
                                  handleApproveMilestone(milestone._id)
                                }
                                className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700 transition-colors flex items-center"
                              >
                                {approvingMilestone === milestone._id ? (
                                  <>
                                    <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                                    Approving...
                                  </>
                                ) : (
                                  <>
                                    <CheckSquare size={14} className="mr-1" />
                                    Approve
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Completed Milestones */}
              <div>
                <h3 className="text-lg font-medium text-gray-300 mb-4">
                  Completed Milestones
                </h3>
                {job.milestones?.filter((m) => m.status === "approved")
                  .length === 0 ? (
                  <p className="text-gray-400 text-center py-8">
                    No completed milestones
                  </p>
                ) : (
                  <div className="space-y-4">
                    {job.milestones
                      ?.filter((m) => m.status === "approved")
                      .map((milestone) => (
                        <div
                          key={milestone._id}
                          className="bg-[#2d2d3a] rounded-lg border-l-4 border-green-500"
                        >
                          <div className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">
                                  {milestone.title}
                                </h4>
                                <p className="text-sm text-gray-400 mt-1">
                                  {milestone.description}
                                </p>
                                <div className="flex items-center gap-4 mt-2">
                                  <span className="text-sm">
                                    PKR {milestone.amount.toLocaleString()}
                                  </span>
                                  <div className="flex items-center text-sm">
                                    <CheckCircle
                                      size={14}
                                      className="text-green-500 mr-1"
                                    />
                                    <span className="text-green-400">
                                      Completed
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {milestone.submission &&
                              milestone.submission.attachments &&
                              milestone.submission.attachments.length > 0 && (
                                <div className="mt-3">
                                  <div className="flex flex-wrap gap-2">
                                    {milestone.submission.attachments.map(
                                      (attachment) => (
                                        <a
                                          key={attachment._id}
                                          href={attachment.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-[#9333EA] text-sm hover:underline flex items-center"
                                        >
                                          <Download
                                            size={14}
                                            className="mr-1"
                                          />
                                          View Deliverable
                                        </a>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Job Reviews Section */}
            {job.status === 'completed' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-[#1c1c24] rounded-lg p-6 mb-6"
              >
                <h2 className="text-xl font-bold mb-6">Project Reviews</h2>
                
                {reviewsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                ) : jobReviews && (jobReviews.clientReview || jobReviews.freelancerReview) ? (
                  <div className="space-y-6">
                    {jobReviews.clientReview && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-300 mb-3">Client's Review</h4>
                        <ReviewsList reviews={[jobReviews.clientReview]} />
                      </div>
                    )}
                    
                    {jobReviews.freelancerReview && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-300 mb-3">Freelancer's Review</h4>
                        <ReviewsList reviews={[jobReviews.freelancerReview]} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No reviews available for this project yet.</p>
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {newMilestoneOpen && (
          <NewMilestoneForm onClose={() => setNewMilestoneOpen(false)} />
        )}
      </AnimatePresence>

      {/* Job Completion Modal */}
      <JobCompletionModal
        isOpen={isCompletionModalOpen}
        onClose={() => setIsCompletionModalOpen(false)}
        job={job}
        userRole="client"
        onComplete={handleCompleteJob}
      />

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        job={job}
        recipient={freelancerProfile}
        onSubmitReview={handleSubmitReview}
      />
    </div>
  );
};

export default ClientJobDetails;
