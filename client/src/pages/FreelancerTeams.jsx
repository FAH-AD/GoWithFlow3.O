"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useSelector } from "react-redux"
import axios from "axios"
import {
  Users,
  Calendar,
  CheckCircle,
  AlertTriangle,
  FileText,
  Upload,
  ChevronDown,
  ExternalLink,
  MessageSquare,
  User,
  X,
} from "lucide-react"
import Navbar from "../components/Navbar"
import useConversation from "../components/useConversation"
import { uploadFile } from "../services/fileUpload" // Import the uploadFile function


const MyTeams = () => {
  const navigate = useNavigate()
  const { jobId } = useParams()
  const user = useSelector((state) => state.Auth.user)
  const [teams, setTeams] = useState([])
  const [isLoading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [expandedMilestones, setExpandedMilestones] = useState({})
  const [isSubmitPopupOpen, setIsSubmitPopupOpen] = useState(false)
  const [submittingMilestone, setSubmittingMilestone] = useState(null)
  const [submissionMessage, setSubmissionMessage] = useState("")
  const [submissionFiles, setSubmissionFiles] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { startConversation } = useConversation({ user});

  const token = localStorage.getItem("authToken")

  const handleFileChange = (e) => {
    setSubmissionFiles([...e.target.files])
  }
  useEffect(() => {
    if (!user) {
      navigate("/login", {
        state: { from: "/freelancer/my-teams", message: "Please login to view your teams" },
      })
    } else if (user.role !== "freelancer") {
      navigate("/", { state: { message: "Only freelancers can access this page" } })
    } else {
      fetchTeams()
    }
  }, [user, navigate])


  const fetchTeams = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/jobs/freelancer/teams", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      console.log("Fetched teams:", response.data.data)
      setTeams(response.data.data)
       if (jobId) {
        const teamToSelect = response.data.data.find(team => team._id === jobId)
        if (teamToSelect) {
          setSelectedTeam(teamToSelect)
        }
      }
      setLoading(false)
    } catch (err) {
      console.error("Error fetching teams:", err);
      setError("Failed to fetch teams")
      setLoading(false)
    }
  }
  useEffect(() => {


    fetchTeams()
  }, [])

  const handleStartConversation = ({otherUserId}) => {
  
    startConversation({
      receiverId: otherUserId,
      jobId,
      onSuccess: (data) => {
        navigate(`/client/messages/${data.message.conversation._id}`)
        
        console.log("Conversation created and joined:", data);
      },
      onError: (err) => {
        console.error("Failed to start conversation", err);
      },
    });
  };

  const openSubmitPopup = (milestone) => {
    setSubmittingMilestone(milestone)
    setIsSubmitPopupOpen(true)
  }

  const closeSubmitPopup = () => {
    setIsSubmitPopupOpen(false)
    setSubmittingMilestone(null)
    setSubmissionMessage("")
    setSubmissionFiles([])
  }
  const handleSelectTeam = (team) => {
    setSelectedTeam(team)
    console.log("Selected team:", team)
  }

  const handleSubmitMilestone = async () => {
    if (!submittingMilestone) return;
  
    setIsSubmitting(true);
    try {
      setIsUploading(true);
      // Upload files
      const uploadedFiles = await Promise.all(submissionFiles.map(file => uploadFile(file)));
      setIsUploading(false);
  
      // Prepare the submission data
      const submissionData = {
        message: submissionMessage,
        attachments: uploadedFiles.map(url => ({ url, filename: url.split('/').pop() }))
      };
  
      // Make the API call to submit the milestone
      console.log(selectedTeam, 'is selected team');
      const response = await axios.post(
        `http://localhost:5000/api/freelancer/jobs/${selectedTeam._id}/milestones/${submittingMilestone._id}/submit`,
        submissionData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      // Update the UI
      const updatedTeams = teams.map((team) => {
        if (team._id === selectedTeam._id) {
          const updatedMilestones = team.freelancerDetails.milestones.map((m) => {
            if (m._id === submittingMilestone._id) {
              return { ...m, status: "submitted" };
            }
            return m;
          });
          return { ...team, freelancerDetails: { ...team.freelancerDetails, milestones: updatedMilestones } };
        }
        return team;
      });
  
      setTeams(updatedTeams);
      if (selectedTeam) {
        const updatedSelectedTeam = updatedTeams.find((team) => team._id === selectedTeam._id);
        setSelectedTeam(updatedSelectedTeam);
      }
  
      // Close popup and reset form
      closeSubmitPopup();
  
      // Show success message
      alert("Milestone submitted successfully!");
    } catch (error) {
      console.error("Error submitting milestone:", error);
      alert("Failed to submit milestone. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMilestoneExpand = (milestoneId) => {
    setExpandedMilestones((prev) => ({
      ...prev,
      [milestoneId]: !prev[milestoneId],
    }))
  }


  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white">
        <Navbar />
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-[#9333EA] border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-white">Loading your teams...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r mb-6 h-[200px] from-[#9333EA]/20 to-[#0a0a0f] border-b border-[#2d2d3a] flex items-center">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-2">My Teams</h1>
          <p className="text-gray-400">Manage your team projects and milestones</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-md flex items-center">
            <AlertTriangle size={20} className="text-red-400 mr-2" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {teams.length === 0 ? (
          <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] p-8 text-center">
            <div className="w-16 h-16 bg-[#1e1e2d] rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={24} className="text-[#9333EA]" />
            </div>
            <h3 className="text-xl font-bold mb-2">No teams found</h3>
            <p className="text-gray-400 mb-6">You're not part of any team projects yet.</p>
            <button
              onClick={() => navigate("/search/jobs")}
              className="px-4 py-2 bg-[#9333EA] hover:bg-[#a855f7] text-white rounded-md transition-colors"
            >
              Browse Team Projects
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Teams List */}
            <div className="lg:col-span-1">
              <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] overflow-hidden">
                <div className="p-4 border-b border-[#2d2d3a]">
                  <h2 className="text-lg font-bold">My Teams</h2>
                </div>
                <div className="p-2">
                  {teams.map((team) => (
                    <div
                      key={team._id}
                      onClick={() => handleSelectTeam(team)}
                      className={`p-3 rounded-md cursor-pointer transition-colors ${selectedTeam?._id === team._id
                        ? "bg-[#9333EA]/20 border border-[#9333EA]/50"
                        : "hover:bg-[#1e1e2d]"
                        }`}
                    >
                      <h3 className="font-medium mb-1">{team.title}</h3>
                      <div className="flex items-center text-sm text-gray-400">
                        <Users size={14} className="mr-1" />
                        <span>{team.teammates.length + 1} team members</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-400 mt-1">
                        <Calendar size={14} className="mr-1" />
                        <span>Due {formatDate(team.deadline)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Team Details */}
            {selectedTeam && (
              <div className="lg:col-span-3 space-y-6">
                {/* Project Overview */}
                <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] overflow-hidden">
                  <div className="p-6 border-b border-[#2d2d3a]">
                    <h2 className="text-xl font-bold">{selectedTeam.title}</h2>
                  </div>
                  <div className="p-6">
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300">{selectedTeam.description}</p>
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-[#1e1e2d] p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-400 mb-1">Your Role</h3>
                        <p className="text-lg font-bold">{selectedTeam.freelancerDetails?.role}</p>
                      </div>
                      <div className="bg-[#1e1e2d] p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-green-400 mb-1">Total Earned</h3>
                        <p className="text-lg font-bold">PKR {selectedTeam.freelancerDetails.totalEarnings.toLocaleString()}</p>
                      </div>
                      <div className="bg-[#1e1e2d] p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-400 mb-1">In Progress</h3>
                        <p className="text-lg font-bold">PKR {selectedTeam.freelancerDetails.workInProgress.toLocaleString()}</p>
                      </div>
                      <div className="bg-[#1e1e2d] p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-400 mb-1">Deadline</h3>
                        <p className="text-lg font-bold">{formatDate(selectedTeam.deadline)}</p>
                      </div>
                    </div>

                    {/* Client Info */}
                    <div className="mt-6">
                      <h3 className="text-lg font-bold mb-3">Client</h3>
                      <div className="flex items-center bg-[#1e1e2d] p-4 rounded-lg">
                        {selectedTeam.client.profilePic ? (
                          <img
                            src={selectedTeam.client.profilePic || "/placeholder.svg"}
                            alt={selectedTeam.client.name}
                            className="w-12 h-12 rounded-full object-cover mr-3"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-[#2d2d3a] rounded-full flex items-center justify-center mr-3">
                            <User size={24} className="text-gray-400" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold">{selectedTeam.client.name}</h4>
                          <button  onClick={ () => handleStartConversation({otherUserId: selectedTeam.client._id})} className="text-sm text-[#9333EA] hover:text-[#a855f7] mt-1 flex items-center">
                            <MessageSquare size={14} className="mr-1" />
                            Message Client
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Team Members */}
                <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] overflow-hidden">
                  <div className="p-6 border-b border-[#2d2d3a]">
                    <h2 className="text-xl font-bold">Team Members</h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Current User */}
                      <div className="bg-[#1e1e2d] p-4 rounded-lg border border-[#9333EA]/30">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-[#2d2d3a] rounded-full flex items-center justify-center mr-3">
                            <User size={24} className="text-[#9333EA]" />
                          </div>
                          <div>
                            <h4 className="font-bold">{user.name} (You)</h4>
                            <p className="text-sm text-gray-300">{selectedTeam.freelancerDetails.role}</p>
                          </div>
                        </div>
                      </div>

                      {/* Other Team Members */}
                      {selectedTeam?.teammates?.map((teammate) => (
                        <div key={teammate._id} className="bg-[#1e1e2d] p-4 rounded-lg">
                          <div className="flex items-center">
                            {teammate.profilePic ? (
                              <img
                                src={teammate.profilePic || "/placeholder.svg"}
                                alt={teammate.name}
                                className="w-12 h-12 rounded-full object-cover mr-3"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-[#2d2d3a] rounded-full flex items-center justify-center mr-3">
                                <User size={24} className="text-gray-400" />
                              </div>
                            )}
                            <div>
                              <h4 className="font-bold">{teammate.name}</h4>
                              <p className="text-sm text-gray-300">{teammate.role}</p>
                            </div>
                          </div>
                          <button onClick={ () => handleStartConversation({otherUserId: teammate._id})} className="text-sm text-[#9333EA] hover:text-[#a855f7] mt-3 flex items-center">
                            <MessageSquare size={14} className="mr-1" />
                            Message
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Milestones */}
                <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] overflow-hidden">
                  <div className="p-6 border-b border-[#2d2d3a]">
                    <h2 className="text-xl font-bold">Milestones</h2>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {selectedTeam?.freelancerDetails.milestones?.map((milestone) => (
                        <div
                          key={milestone._id}
                          className={`bg-[#1e1e2d] rounded-lg border ${milestone.status === "active"
                            ? "border-yellow-500/30"
                            : milestone.status === "completed"
                              ? "border-green-500/30"
                              : milestone.status === "submitted"
                                ? "border-blue-500/30"
                                : "border-[#2d2d3a]"
                            }`}
                        >
                          <div className="p-4 cursor-pointer" onClick={() => toggleMilestoneExpand(milestone._id)}>
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
                                  className={`text-sm px-2 py-1 rounded-full mr-3 ${milestone.status === "active"
                                    ? "bg-yellow-500/10 text-yellow-500"
                                    : milestone.status === "completed"
                                      ? "bg-green-500/10 text-green-500"
                                      : milestone.status === "submitted"
                                        ? "bg-blue-500/10 text-blue-500"
                                        : "bg-gray-500/10 text-gray-400"
                                    }`}
                                >
                                  {milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)}
                                </span>
                                <ChevronDown
                                  size={18}
                                  className={`transition-transform ${expandedMilestones[milestone._id] ? "transform rotate-180" : ""
                                    }`}
                                />
                              </div>
                            </div>
                          </div>

                          {expandedMilestones[milestone._id] && (
                            <div className="p-4 pt-0 border-t border-[#2d2d3a] mt-2">
                              <p className="text-gray-300 mb-4">{milestone.description}</p>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-400 mb-1">Amount</h4>
                                  <p className="font-bold">PKR {milestone.amount.toLocaleString()}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-gray-400 mb-1">Deadline</h4>
                                  <p className="font-bold">{formatDate(milestone.deadline)}</p>
                                </div>
                              </div>

                              {milestone.attachments && milestone.attachments.length > 0 && (
                                <div className="mb-4">
                                  <h4 className="text-sm font-medium text-gray-400 mb-2">Attachments</h4>
                                  <div className="space-y-2">
                                    {milestone.attachments.map((attachment, index) => (
                                      <div key={index} className="flex items-center bg-[#2d2d3a] p-2 rounded-md">
                                        <FileText size={16} className="text-[#9333EA] mr-2" />
                                        <span className="text-sm flex-1 truncate">{attachment.name}</span>
                                        <a
                                          href={attachment.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-[#9333EA] hover:text-[#a855f7] ml-2"
                                        >
                                          <ExternalLink size={14} />
                                        </a>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {milestone.status === "in-progress" && (
                                <div className="mt-4">
                                  <button
                                    onClick={() => openSubmitPopup(milestone)}
                                    className="w-full bg-[#9333EA] hover:bg-[#a855f7] text-white px-4 py-2 rounded-md flex items-center justify-center transition-colors"
                                  >
                                    <Upload size={16} className="mr-2" />
                                    Submit Milestone
                                  </button>
                                </div>
                              )}


                              {milestone.status === "submitted" && (
                                <div className="bg-blue-500/10 border border-blue-500/30 rounded-md p-3 mt-2">
                                  <p className="text-sm text-blue-400">
                                    Your submission is under review by the client.
                                  </p>
                                </div>
                              )}

                              {milestone.status === "completed" && (
                                <div className="bg-green-500/10 border border-green-500/30 rounded-md p-3 mt-2 flex items-center">
                                  <CheckCircle size={16} className="text-green-500 mr-2" />
                                  <p className="text-sm text-green-400">
                                    This milestone has been completed and approved.
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {isSubmitPopupOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#121218] rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Submit Milestone</h3>
              <button onClick={closeSubmitPopup} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <textarea
              value={submissionMessage}
              onChange={(e) => setSubmissionMessage(e.target.value)}
              placeholder="Enter your submission message..."
              className="w-full bg-[#2d2d3a] text-white p-2 rounded-md mb-4"
              rows="4"
            ></textarea>
            <div className="mb-4">
              <input
                type="file"
                onChange={handleFileChange}
                multiple
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer bg-[#2d2d3a] text-white px-4 py-2 rounded-md inline-block"
              >
                Choose Files
              </label>
              <span className="ml-2 text-sm text-gray-400">
                {submissionFiles.length} file(s) selected
              </span>
            </div>
            <button
              onClick={handleSubmitMilestone}
              disabled={isUploading || isSubmitting}
              className="w-full bg-[#9333EA] hover:bg-[#a855f7] text-white px-4 py-2 rounded-md flex items-center justify-center transition-colors"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Upload size={16} className="mr-2" />
                  Submit Milestone
                </>
              )}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

export default MyTeams
