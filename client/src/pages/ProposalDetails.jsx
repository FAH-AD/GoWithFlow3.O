"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import {
  ArrowLeft,
  Briefcase,
  DollarSign,
  Calendar,
  MapPin,
  Users,
  AlertTriangle,
  FileText,
  User,
  Star,
  MessageSquare,
  ExternalLink,
} from "lucide-react"
import Navbar from "../components/Navbar"

const ProposalDetails = () => {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const user = useSelector((state) => state.Auth.user)

  const [job, setJob] = useState(null)
  const [clientProfile, setClientProfile] = useState(null)
  const [bidStats, setBidStats] = useState({
    total: 0,
    interviewing: 0,
    hired: 0,
  })
  const [userBid, setUserBid] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const token = localStorage.getItem("authToken")

  useEffect(() => {
    if (!user) {
      navigate("/login", {
        state: { from: `/jobs/${jobId}`, message: "Please login to view job details" },
      })
    } else {
      fetchJobDetails()
    }
  }, [jobId, user, navigate])

  const fetchJobDetails = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch job details
      const jobResponse = await fetch(`http://localhost:5000/api/jobs/${jobId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
      })

      if (!jobResponse.ok) {
        throw new Error("Failed to fetch job details")
      }

      const jobData = await jobResponse.json()
      console.log(jobData.data,'specific job details')
      setJob(jobData.data)
      
      // Fetch client profile
      if (jobData.data.client) {
        const clientResponse = await fetch(`http://localhost:5000/api/users/${jobData.data.client}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (clientResponse.ok) {
          const clientData = await clientResponse.json()
          console.log(clientData)
          setClientProfile(clientData.data.user)
        }
      }

      // Fetch bid statistics
      const statsResponse = await fetch(`http://localhost:5000/api/bids/stats/${jobId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        console.log("Bid statistics:", statsData.data)
        setBidStats(statsData.data)
      }

      // Check if user has already bid on this job
      if (user.role === "freelancer") {
        const userBidResponse = await fetch(`http://localhost:5000/api/bids/job/${jobId}/my-bid`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (userBidResponse.ok) {
          const userBidData = await userBidResponse.json()
          console.log("User bid:", userBidData.data)
          if (userBidData.data.bid) {
            setUserBid(userBidData.data.bid)
          }
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load job details. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleApply = () => {
    navigate(`/apply-job/${jobId}`, { state: { job } })
  }

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Format duration
  const formatDuration = (duration) => {
    switch (duration) {
      case "less-than-1-month":
        return "Less than 1 month"
      case "1-3-months":
        return "1-3 months"
      case "3-6-months":
        return "3-6 months"
      case "more-than-6-months":
        return "More than 6 months"
      default:
        return duration
    }
  }

  // Get status badge style
  const getBidStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return {
          bg: "bg-yellow-500/10",
          text: "text-yellow-500",
          label: "Pending Review",
        }
      case "accepted":
        return {
          bg: "bg-green-500/10",
          text: "text-green-500",
          label: "Accepted",
        }
      case "rejected":
        return {
          bg: "bg-red-500/10",
          text: "text-red-500",
          label: "Rejected",
        }
      case "completed":
        return {
          bg: "bg-blue-500/10",
          text: "text-blue-500",
          label: "Completed",
        }
      default:
        return {
          bg: "bg-gray-500/10",
          text: "text-gray-500",
          label: status.charAt(0).toUpperCase() + status.slice(1),
        }
    }
  }

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
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] p-8 text-center">
            <AlertTriangle size={48} className="text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Job Not Found</h2>
            <p className="text-gray-400 mb-6">The job you're looking for doesn't exist or has been removed.</p>
            <button
              onClick={() => navigate("/jobs")}
              className="px-4 py-2 bg-[#9333EA] hover:bg-[#a855f7] text-white rounded-md transition-colors"
            >
              Browse Jobs
            </button>
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
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center mb-2">
                <button
                  onClick={() => navigate(-1)}
                  className="mr-3 p-2 bg-[#1e1e2d] hover:bg-[#2d2d3a] rounded-full transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl md:text-3xl font-bold">{job.title}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                <span className="flex items-center">
                
                  Budget: PKR {job.budget.toLocaleString()}
                </span>
                <span className="flex items-center">
                  <Calendar size={16} className="mr-1" />
                  Posted: {formatDate(job.createdAt)}
                </span>
                <span className="flex items-center">
                  <MapPin size={16} className="mr-1" />
                  {job.location || "Remote"}
                </span>
                {job.isCrowdsourced && (
                  <span className="flex items-center bg-[#9333EA]/20 text-[#9333EA] px-2 py-1 rounded-full">
                    <Users size={14} className="mr-1" />
                    Team Project
                  </span>
                )}
              </div>
            </div>

            {user.role === "freelancer" && (
              <div className="mt-4 md:mt-0">
                {userBid ? (
                  <div className="flex flex-col items-end">
                    <div
                      className={`px-4 py-2 rounded-md text-sm ${getBidStatusBadge(userBid.status).bg} ${getBidStatusBadge(userBid.status).text}`}
                    >
                      {getBidStatusBadge(userBid.status).label}
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      You bid PKR {userBid.budget.toLocaleString()} on {formatDate(userBid.createdAt)}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleApply}
                    disabled={job.status !== "open"}
                    className={`flex items-center gap-2 px-6 py-3 rounded-md transition-colors ${
                      job.status === "open"
                        ? "bg-[#9333EA] hover:bg-[#a855f7] text-white"
                        : "bg-[#1e1e2d] text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <Briefcase size={18} />
                    <span>Apply Now</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="container mx-auto px-4 py-4">
          <div className="p-4 bg-red-900/20 border border-red-800 rounded-md flex items-center">
            <AlertTriangle size={20} className="text-red-400 mr-2" />
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Description */}
            <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] overflow-hidden">
              <div className="p-6 border-b border-[#2d2d3a]">
                <h2 className="text-xl font-bold">Job Description</h2>
              </div>
              <div className="p-6">
                <div className="prose prose-invert max-w-none">
                  <p className="whitespace-pre-line">{job.description}</p>
                </div>

                {/* Skills */}
                <div className="mt-6">
                  <h3 className="text-lg font-bold mb-3">Skills Required</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.skills &&
                      job.skills.map((skill, index) => (
                        <span key={index} className="bg-[#2d2d3a] text-white px-3 py-1 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                  </div>
                </div>

                {/* Job Details */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-bold mb-2">Experience Level</h3>
                    <p className="text-gray-300">{job.experienceLevel || "Not specified"}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-2">Project Duration</h3>
                    <p className="text-gray-300">{formatDuration(job.duration)}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-2">Deadline</h3>
                    <p className="text-gray-300">{formatDate(job.deadline)}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-2">Category</h3>
                    <p className="text-gray-300">{job.subCategory || "Not specified"}</p>
                  </div>
                </div>

                {/* Crowdsourcing Roles */}
                {job.isCrowdsourced && job.crowdsourcingRoles && job.crowdsourcingRoles.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-bold mb-3">Team Roles</h3>
                    <div className="space-y-3">
                      {job.crowdsourcingRoles.map((role, index) => (
                        <div key={index} className="bg-[#1e1e2d] border border-[#2d2d3a] rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-bold">{role.title}</h4>
                            <span className="bg-[#2d2d3a] px-3 py-1 rounded-md text-sm">
                              PKR {role.budget.toLocaleString()}
                            </span>
                          </div>
                          <p className="text-gray-300 mb-3">{role.description}</p>
                          <div>
                            <h5 className="text-sm font-medium mb-1">Required Skills:</h5>
                            <div className="flex flex-wrap gap-1">
                              {role.skills.map((skill, skillIndex) => (
                                <span key={skillIndex} className="bg-[#2d2d3a] text-xs px-2 py-1 rounded-full">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attachments */}
                {job.attachments && job.attachments.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-bold mb-3">Attachments</h3>
                    <div className="space-y-2">
                      {job.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center bg-[#1e1e2d] p-3 rounded-md">
                          <FileText size={20} className="text-[#9333EA] mr-3" />
                          <span className="flex-1 truncate">{attachment.name || attachment}</span>
                          <a
                            href={attachment.url || attachment}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#9333EA] hover:text-[#a855f7] ml-3"
                          >
                            <ExternalLink size={16} />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Your Proposal (if exists) */}
            {userBid && (
              <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] overflow-hidden">
                <div className="p-6 border-b border-[#2d2d3a]">
                  <h2 className="text-xl font-bold">Your Proposal</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-[#1e1e2d] p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-400 mb-1">Your Bid</h3>
                      <p className="text-xl font-bold">PKR {userBid.budget.toLocaleString()}</p>
                    </div>
                    <div className="bg-[#1e1e2d] p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-400 mb-1">Delivery Time</h3>
                      <p className="text-xl font-bold">
                        {userBid.deliveryTime} {userBid.deliveryTimeUnit}
                      </p>
                    </div>
                    <div className="bg-[#1e1e2d] p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-400 mb-1">Status</h3>
                      <p className={`text-xl font-bold ${getBidStatusBadge(userBid.status).text}`}>
                        {getBidStatusBadge(userBid.status).label}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-bold mb-2">Cover Letter</h3>
                    <div className="bg-[#1e1e2d] p-4 rounded-lg">
                      <p className="whitespace-pre-line">{userBid.proposal}</p>
                    </div>
                  </div>
                   {(() => {
        let milestonesToDisplay = userBid.milestones;

        if (userBid.status === "accepted") {
          if (job.isCrowdsourced) {
            milestonesToDisplay = job.team[0].milestones;
            console.log(job.team[0].milestones, 'milestonesToDisplay')
          } else if (!job.isCrowdsourced && job.milestones) {
            milestonesToDisplay = job.milestones;
            console.log(milestonesToDisplay, 'milestonesToDisplay')
          }
        }

        return milestonesToDisplay && milestonesToDisplay.length > 0 && (
          <div>
            <h3 className="text-lg font-bold mb-2">Milestones</h3>
            <div className="space-y-3">
              {milestonesToDisplay.map((milestone, index) => (
                <div key={index} className="bg-[#1e1e2d] p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold">{milestone.title}</h4>
                    <span className="bg-[#2d2d3a] px-3 py-1 rounded-md text-sm">
                      PKR {milestone.amount.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-300 mb-2">{milestone.description}</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Due: {formatDate(milestone.deadline)}</span>
                    <span
                      className={`${milestone.status === "completed" ? "text-green-500" : "text-yellow-500"}`}
                    >
                      {milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
                  
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Info */}
            <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] overflow-hidden">
              <div className="p-6 border-b border-[#2d2d3a]">
                <h2 className="text-xl font-bold">About the Client</h2>
              </div>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  {clientProfile?.profilePic ? (
                    <img
                      src={clientProfile.profilePic || "/placeholder.svg"}
                      alt={clientProfile.name}
                      className="w-12 h-12 rounded-full object-cover mr-3"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-[#2d2d3a] rounded-full flex items-center justify-center mr-3">
                      <User size={24} className="text-gray-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold">{clientProfile?.name || job.client?.name || "Client"}</h3>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Star size={16} className="text-yellow-500 mr-2" />
                    <span>
                      Member since {formatDate(clientProfile?.createdAt || job.client?.createdAt || new Date())}
                    </span>
                  </div>

                  {clientProfile?.companyName && (
                    <div className="flex items-center text-sm">
                      <Briefcase size={16} className="text-[#9333EA] mr-2" />
                      <span>{clientProfile.companyName}</span>
                    </div>
                  )}
                
                    <div className="flex items-center gap-2 text-sm">
                     <span className="text-green-400">Total Spent: </span>
                      <span>{clientProfile.totalSpent} PKR</span>
                    </div>

                  {clientProfile?.companyWebsite && (
                    <div className="flex items-center text-sm">
                      <ExternalLink size={16} className="text-[#9333EA] mr-2" />
                      <a
                        href={clientProfile.companyWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#9333EA] hover:underline"
                      >
                        Company Website
                      </a>
                    </div>
                  )}
                </div>

                {user.role === "freelancer" && !userBid && (
                    <>
                  
                 {job.hasApplied ? (
                    <span className="text-green-500 font-medium text-sm">Already Applied</span>
                  ) : (
                    <button 
                      onClick={() => navigate(`/freelancer/apply-job/${job.id}`, { state: { job } })} 
                      className="bg-[#9333EA] hover:bg-[#a855f7] text-white px-4 py-2 rounded-md text-sm transition-colors"
                    >
                      Apply Now
                    </button>
                  )}
                    </>
                )}
              </div>
            </div>

            {/* Job Stats */}
            <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] overflow-hidden">
              <div className="p-6 border-b border-[#2d2d3a]">
                <h2 className="text-xl font-bold">Job Activity</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Proposals</span>
                    <span className="font-bold">{bidStats.totalBids || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Interviewing</span>
                    <span className="font-bold">{bidStats.totalInterviewing || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Hired</span>
                    <span className="font-bold">{bidStats.totalHires || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Job Status</span>
                    <span className={`font-bold ${job.status === "open" ? "text-green-500" : "text-yellow-500"}`}>
                      {bidStats.jobStatus.toUpperCase()}
                    </span>
                  </div>
                </div>

                
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProposalDetails
