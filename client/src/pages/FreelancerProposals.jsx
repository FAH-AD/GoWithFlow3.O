"use client"

import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import {
  Briefcase,
  Clock,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Search,
  Filter,
  ArrowUpRight,
} from "lucide-react"
import Navbar from "../components/Navbar"
import axios from "axios"

const FreelancerProposals = () => {
  const navigate = useNavigate()
  const user = useSelector((state) => state.Auth.user)

  const [proposals, setProposals] = useState([])
  const [filteredProposals, setFilteredProposals] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeFilter, setActiveFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOption, setSortOption] = useState("newest")
  const token = localStorage.getItem("authToken")
  // Check if user is authorized (freelancer role)
  useEffect(() => {
    if (!user) {
      navigate("/login", {
        state: { from: "/freelancer/my-proposals", message: "Please login to view your proposals" },
      })
    } else if (user.role !== "freelancer") {
      navigate("/", { state: { message: "Only freelancers can access this page" } })
    } else {
      fetchProposals()
    }
  }, [user, navigate])

  // Fetch proposals from API
  const fetchProposals = async () => {
    setIsLoading(true);
    setError(null);
  
    try {
        console.log(token, "token in proposals")
      const response = await axios.get("http://localhost:5000/api/bids/my-bids", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
       console.log(response.data, "response in proposals")
      setProposals(response.data.message.bids);
      setFilteredProposals(response.data.message.bids);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load proposals. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  

  // Filter proposals by status
  const filterProposals = (status) => {
    setActiveFilter(status)

    if (status === "all") {
      setFilteredProposals(proposals)
    } else {
      const filtered = proposals.filter((proposal) => proposal.status === status)
      setFilteredProposals(filtered)
    }
  }

  // Handle search
  const handleSearch = (e) => {
    const query = e.target.value
    setSearchQuery(query)

    if (!query.trim()) {
      filterProposals(activeFilter)
      return
    }

    const searchResults = proposals.filter((proposal) => {
      // Filter by active status first
      if (activeFilter !== "all" && proposal.status !== activeFilter) {
        return false
      }

      // Then search by job title or client name
      const jobTitle = proposal.job?.title?.toLowerCase() || ""
      return jobTitle.includes(query.toLowerCase())
    })

    setFilteredProposals(searchResults)
  }

  // Handle sort
  const handleSort = (option) => {
    setSortOption(option)

    const sorted = [...filteredProposals]

    switch (option) {
      case "newest":
        sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        break
      case "oldest":
        sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        break
      case "highest":
        sorted.sort((a, b) => b.budget - a.budget)
        break
      case "lowest":
        sorted.sort((a, b) => a.budget - b.budget)
        break
      default:
        break
    }

    setFilteredProposals(sorted)
  }

  // Navigate to job details
  const viewJobDetails = (jobId) => {
    navigate(`/freelancer/jobs/${jobId}`)
  }

  // Get status badge style
  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return {
          bg: "bg-yellow-500/10",
          text: "text-yellow-500",
          icon: <AlertCircle size={14} className="mr-1" />,
          label: "Pending",
        }
      case "accepted":
        return {
          bg: "bg-green-500/10",
          text: "text-green-500",
          icon: <CheckCircle size={14} className="mr-1" />,
          label: "Accepted",
        }
      case "rejected":
        return {
          bg: "bg-red-500/10",
          text: "text-red-500",
          icon: <XCircle size={14} className="mr-1" />,
          label: "Rejected",
        }
      // case "completed":
      //   return {
      //     bg: "bg-blue-500/10",
      //     text: "text-blue-500",
      //     icon: <CheckCircle size={14} className="mr-1" />,
      //     label: "Completed",
      //   }
      case "withdrawn":
        return {
          bg: "bg-gray-500/10",
          text: "text-gray-500",
          icon: <XCircle size={14} className="mr-1" />,
          label: "Withdrawn",
        }
      default:
        return {
          bg: "bg-gray-500/10",
          text: "text-gray-500",
          icon: null,
          label: status.charAt(0).toUpperCase() + status.slice(1),
        }
    }
  }

  // Format date
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
            <p className="mt-4 text-white">Loading your proposals...</p>
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
          <h1 className="text-3xl font-bold mb-2">My Proposals</h1>
          <p className="text-gray-400">Track and manage all your job proposals</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-md flex items-center">
            <AlertCircle size={20} className="text-red-400 mr-2" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] mb-6">
          <div className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Status Filters */}
              <div className="flex overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                <button
                  onClick={() => filterProposals("all")}
                  className={`px-4 py-2 rounded-md whitespace-nowrap mr-2 ${
                    activeFilter === "all" ? "bg-[#9333EA] text-white" : "bg-[#1e1e2d] text-gray-300 hover:bg-[#2d2d3a]"
                  }`}
                >
                  All Proposals
                </button>
                <button
                  onClick={() => filterProposals("pending")}
                  className={`px-4 py-2 rounded-md whitespace-nowrap mr-2 ${
                    activeFilter === "pending"
                      ? "bg-[#9333EA] text-white"
                      : "bg-[#1e1e2d] text-gray-300 hover:bg-[#2d2d3a]"
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => filterProposals("accepted")}
                  className={`px-4 py-2 rounded-md whitespace-nowrap mr-2 ${
                    activeFilter === "accepted"
                      ? "bg-[#9333EA] text-white"
                      : "bg-[#1e1e2d] text-gray-300 hover:bg-[#2d2d3a]"
                  }`}
                >
                  Accepted
                </button>
                
                <button
                  onClick={() => filterProposals("rejected")}
                  className={`px-4 py-2 rounded-md whitespace-nowrap ${
                    activeFilter === "rejected"
                      ? "bg-[#9333EA] text-white"
                      : "bg-[#1e1e2d] text-gray-300 hover:bg-[#2d2d3a]"
                  }`}
                >
                  Rejected
                </button>
              </div>

              {/* Search and Sort */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search proposals..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="pl-10 pr-4 py-2 bg-[#1e1e2d] border border-[#2d2d3a] rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent w-full sm:w-64"
                  />
                </div>

                <div className="relative">
                  <Filter size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    value={sortOption}
                    onChange={(e) => handleSort(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-[#1e1e2d] border border-[#2d2d3a] rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent appearance-none cursor-pointer"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="highest">Highest Budget</option>
                    <option value="lowest">Lowest Budget</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Proposals List */}
        <div className="space-y-4">
          {filteredProposals.length === 0 ? (
            <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] p-8 text-center">
              <div className="w-16 h-16 bg-[#1e1e2d] rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase size={24} className="text-[#9333EA]" />
              </div>
              <h3 className="text-xl font-bold mb-2">No proposals found</h3>
              <p className="text-gray-400 mb-6">
                {activeFilter === "all"
                  ? "You haven't submitted any proposals yet."
                  : `You don't have any ${activeFilter} proposals.`}
              </p>
              <button
                onClick={() => navigate("/jobs")}
                className="px-4 py-2 bg-[#9333EA] hover:bg-[#a855f7] text-white rounded-md transition-colors"
              >
                Browse Jobs
              </button>
            </div>
          ) : (
            filteredProposals.map((proposal) => {
              const statusBadge = getStatusBadge(proposal.status)

              return (
                <div
                  key={proposal._id}
                  className="bg-[#121218] rounded-lg border border-[#2d2d3a] overflow-hidden hover:border-[#9333EA]/50 transition-colors cursor-pointer"
                  onClick={() => viewJobDetails(proposal.job._id)}
                >
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-xl font-bold mb-1 group-hover:text-[#9333EA] transition-colors">
                          {proposal.job?.title || "Untitled Job"}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                          <span className="flex items-center">
                           
                            PKR {proposal.budget.toLocaleString()}
                          </span>
                          <span className="flex items-center">
                            <Clock size={14} className="mr-1" />
                            {proposal.deliveryTime} {proposal.deliveryTimeUnit}
                          </span>
                          <span className="flex items-center">
                            <Calendar size={14} className="mr-1" />
                            Submitted {formatDate(proposal.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div
                          className={`flex items-center px-3 py-1 rounded-full text-sm ${statusBadge.bg} ${statusBadge.text}`}
                        >
                          {statusBadge.icon}
                          {statusBadge.label}
                        </div>
                        <ChevronRight size={20} className="text-gray-400" />
                      </div>
                    </div>

                    {/* Milestones Summary */}
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Milestones</h4>
                      <div className="space-y-2">
                        {proposal.milestones.map((milestone, index) => (
                          <div key={index} className="flex justify-between items-center bg-[#1e1e2d] p-3 rounded-md">
                            <div>
                              <p className="font-medium">{milestone.title}</p>
                              <p className="text-sm text-gray-400 truncate max-w-md">{milestone.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">PKR {milestone.amount.toLocaleString()}</p>
                              <p className="text-sm text-gray-400">Due: {formatDate(milestone.dueDate)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* View Details Button */}
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          viewJobDetails(proposal.job._id)
                        }}
                        className="flex items-center text-[#9333EA] hover:text-[#a855f7] transition-colors"
                      >
                        View Job Details
                        <ArrowUpRight size={16} className="ml-1" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default FreelancerProposals
