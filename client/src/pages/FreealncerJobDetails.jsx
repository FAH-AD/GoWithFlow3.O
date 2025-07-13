import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import {
  Calendar,
  CheckCircle,
  AlertTriangle,
  FileText,
  Upload,
  ChevronDown,
  ExternalLink,
  X,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { uploadFile } from "../services/fileUpload";
import JobCompletionModal from "../components/JobCompletionModal";
import ReviewModal from "../components/ReviewModal";
import ReviewsList from "../components/ReviewsList";
import { jobCompletionService, reviewService } from "../services/reviewService";

const FreelancerJobDetails = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.Auth.user);
  const [job, setJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedMilestones, setExpandedMilestones] = useState({});
  const [isSubmitPopupOpen, setIsSubmitPopupOpen] = useState(false);
  const [submittingMilestone, setSubmittingMilestone] = useState(null);
  const [submissionMessage, setSubmissionMessage] = useState("");
  const [submissionFiles, setSubmissionFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRecipient, setReviewRecipient] = useState(null);
  const [jobReviews, setJobReviews] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [hasUserReviewed, setHasUserReviewed] = useState(false);

  const token = localStorage.getItem("authToken");

  useEffect(() => {
    if (!user) {
      navigate("/login", {
        state: {
          from: `/freelancer/jobs/${jobId}`,
          message: "Please login to view job details",
        },
      });
    } else if (user.role !== "freelancer") {
      navigate("/", {
        state: { message: "Only freelancers can access this page" },
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
      console.log("Job details response:", response.data);
      setJob(response.data.data);

      // Fetch job reviews if job is completed
      if (response.data.data.status === 'completed') {
        await fetchJobReviews();
      }
    } catch (err) {
      console.error("Error fetching job details:", err);
      setError("Failed to fetch job details");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchJobReviews = async () => {
    setReviewsLoading(true);
    try {
      const reviewsData = await reviewService.getJobReviews(jobId);
      console.log('Job reviews data received:', reviewsData);
      setJobReviews(reviewsData);
      
      // Check if current user has already reviewed
      const clientReview = reviewsData.clientReview;
      const freelancerReview = reviewsData.freelancerReview;
      
      if (user.role === 'client' && clientReview) {
        setHasUserReviewed(true);
      } else if (user.role === 'freelancer' && freelancerReview) {
        setHasUserReviewed(true);
      }
    } catch (error) {
      console.error('Error fetching job reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setSubmissionFiles([...e.target.files]);
  };

  const openSubmitPopup = (milestone) => {
    setSubmittingMilestone(milestone);
    setIsSubmitPopupOpen(true);
  };

  const closeSubmitPopup = () => {
    setIsSubmitPopupOpen(false);
    setSubmittingMilestone(null);
    setSubmissionMessage("");
    setSubmissionFiles([]);
  };

  const handleSubmitMilestone = async () => {
    if (!submittingMilestone) return;

    setIsSubmitting(true);
    try {
      setIsUploading(true);
      const uploadedFiles = await Promise.all(
        submissionFiles.map((file) => uploadFile(file))
      );
      setIsUploading(false);

      const submissionData = {
        message: submissionMessage,
        attachments: uploadedFiles.map((url) => ({
          url,
          filename: url.split("/").pop(),
        })),
      };

      await axios.post(
        `http://localhost:5000/api/freelancer/jobs/${jobId}/milestones/${submittingMilestone._id}/submit`,
        submissionData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await fetchJobDetails();
      closeSubmitPopup();
      alert("Milestone submitted successfully!");
    } catch (error) {
      console.error("Error submitting milestone:", error);
      alert("Failed to submit milestone. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle work submission for job completion
  const handleSubmitWorkForCompletion = async (workData) => {
    try {
      await jobCompletionService.submitWork(jobId, workData);
      await fetchJobDetails(); // Refresh job details to update UI
      setIsCompletionModalOpen(false); // Close the modal
      alert(
        "Work submitted successfully! The client will be notified to review and complete the job."
      );
    } catch (error) {
      console.error("Error submitting work:", error);
      alert("Failed to submit work. Please try again.");
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
      alert("Review submitted successfully!");
      setHasUserReviewed(true); // Update state immediately
      await fetchJobDetails(); // Refresh job details and reviews
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review. Please try again.");
    }
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
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {job && (
          <>
            <h1 className="text-3xl font-bold mb-6">{job.title}</h1>
            <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] overflow-hidden mb-6">
              <div className="p-6">
                <p className="text-gray-300 mb-4">{job.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#1e1e2d] p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-400 mb-1">
                      Budget
                    </h3>
                    <p className="text-lg font-bold">
                      PKR {job.budget?.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-[#1e1e2d] p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-400 mb-1">
                      Deadline
                    </h3>
                    <p className="text-lg font-bold">
                      {formatDate(job.deadline)}
                    </p>
                  </div>
                  <div className="bg-[#1e1e2d] p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-400 mb-1">
                      Status
                    </h3>
                    <p className="text-lg font-bold capitalize">{job.status}</p>
                  </div>
                </div>

                {/* Job Actions */}
                {job.status === 'in-progress' && (
                  <div className="mt-6 flex gap-4">
                    {job.workSubmission && job.workSubmission.submittedAt ? (
                      <div className="bg-blue-600/10 border border-blue-600/20 text-blue-400 font-medium py-2 px-4 rounded-md flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Final Work Submitted - Awaiting Client Review
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsCompletionModalOpen(true)}
                        className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Submit Final Work
                      </button>
                    )}
                  </div>
                )}

                {job.status === 'completed' && !hasUserReviewed && (
                  <div className="mt-6 flex gap-4">
                    <button
                      onClick={() => handleStartReview(job.client)}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                    >
                      Leave Review for Client
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] overflow-hidden">
              <div className="p-6 border-b border-[#2d2d3a]">
                <h2 className="text-xl font-bold">Milestones</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {job.milestones?.map((milestone) => (
                    <div
                      key={milestone._id}
                      className={`bg-[#1e1e2d] rounded-lg border ${
                        milestone.status === "active"
                          ? "border-yellow-500/30"
                          : milestone.status === "completed"
                          ? "border-green-500/30"
                          : milestone.status === "submitted"
                          ? "border-blue-500/30"
                          : "border-[#2d2d3a]"
                      }`}
                    >
                      <div
                        className="p-4 cursor-pointer"
                        onClick={() => toggleMilestoneExpand(milestone._id)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            {milestone.status === "active" && (
                              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                            )}
                            {milestone.status === "completed" && (
                              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                            )}
                            {milestone.status === "submitted" && (
                              <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                            )}
                            {milestone.status === "pending" && (
                              <div className="w-3 h-3 bg-gray-500 rounded-full mr-3"></div>
                            )}
                            <h3 className="font-bold">{milestone.title}</h3>
                          </div>
                          <div className="flex items-center">
                            <span
                              className={`text-sm px-2 py-1 rounded-full mr-3 ${
                                milestone.status === "active"
                                  ? "bg-yellow-500/10 text-yellow-500"
                                  : milestone.status === "completed"
                                  ? "bg-green-500/10 text-green-500"
                                  : milestone.status === "submitted"
                                  ? "bg-blue-500/10 text-blue-500"
                                  : "bg-gray-500/10 text-gray-400"
                              }`}
                            >
                              {milestone.status.charAt(0).toUpperCase() +
                                milestone.status.slice(1)}
                            </span>
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

                      {expandedMilestones[milestone._id] && (
                        <div className="p-4 pt-0 border-t border-[#2d2d3a] mt-2">
                          <p className="text-gray-300 mb-4">
                            {milestone.description}
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-400 mb-1">
                                Amount
                              </h4>
                              <p className="font-bold">
                                PKR {milestone.amount.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-400 mb-1">
                                Deadline
                              </h4>
                              <p className="font-bold">
                                {formatDate(milestone.deadline)}
                              </p>
                            </div>
                          </div>

                          {milestone.attachments &&
                            milestone.attachments.length > 0 && (
                              <div className="mt-4">
                                <h4 className="text-sm font-medium text-gray-400 mb-2">
                                  Attachments
                                </h4>
                                <div className="space-y-2">
                                  {milestone.attachments.map(
                                    (attachment, attachmentIndex) => (
                                      <div
                                        key={attachmentIndex}
                                        className="flex items-center bg-[#2d2d3a] p-2 rounded-md"
                                      >
                                        <FileText
                                          size={16}
                                          className="text-[#9333EA] mr-2"
                                        />
                                        <span className="flex-1 truncate text-sm">
                                          {attachment.filename}
                                        </span>
                                        <a
                                          href={attachment.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-[#9333EA] hover:text-[#a855f7] ml-2"
                                        >
                                          <ExternalLink size={14} />
                                        </a>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}

                          {milestone.status === "in-progress" && (
                            <div className="mt-4">
                              <button
                                onClick={() => openSubmitPopup(milestone)}
                                className="bg-[#9333EA] hover:bg-[#a855f7] text-white font-medium py-2 px-4 rounded-md transition-colors"
                              >
                                Submit Milestone
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Job Reviews Section */}
            {job.status === 'completed' && (
              <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] overflow-hidden mt-6">
                <div className="p-6 border-b border-[#2d2d3a]">
                  <h2 className="text-xl font-bold">Project Reviews</h2>
                </div>
                <div className="p-6">
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
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Submit Milestone Popup */}
      {isSubmitPopupOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#121218] rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Submit Milestone</h2>
              <button
                onClick={closeSubmitPopup}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            <div className="mb-4">
              <label
                htmlFor="submissionMessage"
                className="block text-sm font-medium text-gray-400 mb-2"
              >
                Submission Message
              </label>
              <textarea
                id="submissionMessage"
                rows="4"
                className="w-full bg-[#1e1e2d] border border-[#2d2d3a] rounded-md p-2 text-white"
                value={submissionMessage}
                onChange={(e) => setSubmissionMessage(e.target.value)}
              ></textarea>
            </div>
            <div className="mb-4">
              <label
                htmlFor="submissionFiles"
                className="block text-sm font-medium text-gray-400 mb-2"
              >
                Attachments
              </label>
              <input
                type="file"
                id="submissionFiles"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="submissionFiles"
                className="flex items-center justify-center w-full bg-[#1e1e2d] border border-dashed border-[#2d2d3a] rounded-md p-4 cursor-pointer hover:bg-[#2d2d3a] transition-colors"
              >
                <Upload size={24} className="text-[#9333EA] mr-2" />
                <span className="text-gray-400">
                  Choose files or drag & drop
                </span>
              </label>
              {submissionFiles.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {submissionFiles.map((file, index) => (
                    <li key={index} className="text-sm text-gray-400">
                      {file.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              onClick={handleSubmitMilestone}
              disabled={isSubmitting || isUploading}
              className={`w-full py-2 px-4 rounded-md ${
                isSubmitting || isUploading
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-[#9333EA] hover:bg-[#a855f7]"
              } text-white font-medium transition-colors`}
            >
              {isUploading
                ? "Uploading..."
                : isSubmitting
                ? "Submitting..."
                : "Submit Milestone"}
            </button>
          </div>
        </div>
      )}

      {/* Job Completion Modal */}
      <JobCompletionModal
        isOpen={isCompletionModalOpen}
        onClose={() => setIsCompletionModalOpen(false)}
        job={job}
        userRole="freelancer"
        onSubmitWork={handleSubmitWorkForCompletion}
      />

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        job={job}
        recipient={{ _id: job.client, name: job.client.name }}
        onSubmitReview={handleSubmitReview}
      />
    </div>
  );
};

export default FreelancerJobDetails;
