"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Search,
  Filter,
  ArrowUpRight,
} from "lucide-react";
import Navbar from "../components/Navbar";
import axios from "axios";

const FreelancerJobs = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.Auth.user);

  const [acceptedProposals, setAcceptedProposals] = useState([]);
  const [inProgressProposals, setInProgressProposals] = useState([]);
  const [completedProposals, setCompletedProposals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  const [activeTab, setActiveTab] = useState("inProgress");
  const token = localStorage.getItem("authToken");

  useEffect(() => {
    if (!user) {
      navigate("/login", {
        state: {
          from: "/freelancer/my-proposals",
          message: "Please login to view your accepted proposals",
        },
      });
    } else if (user.role !== "freelancer") {
      navigate("/", {
        state: { message: "Only freelancers can access this page" },
      });
    } else {
      fetchAndProcessProposals();
    }
  }, [user, navigate]);
  const fetchAndProcessProposals = async () => {
    if (user && user.role === "freelancer") {
      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.get(
          "http://localhost:5000/api/jobs/user/active-jobs",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log("Raw jobs data:", response.data);

        const jobs = response.data.message.data;
        setAcceptedProposals(jobs);

        const inProgress = filterProposalsByStatus(jobs, "inProgress");
        const completed = filterProposalsByStatus(jobs, "completed");

        console.log("In Progress jobs:", inProgress);
        console.log("Completed jobs:", completed);

        setInProgressProposals(inProgress);
        setCompletedProposals(completed);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load accepted proposals. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    }
  };
  useEffect(() => {
    fetchAndProcessProposals();
  }, [user, token]);

  const filterProposalsByStatus = (proposals, status) => {
    console.log("Filtering proposals:", proposals);
    return proposals.filter((proposal) => {
      console.log("Proposal:", proposal.title, "Status:", proposal.status);
      return status === "inProgress"
        ? proposal.status === "in-progress"
        : proposal.status === "completed";
    });
  };
  const filteredProposals = acceptedProposals.filter((proposal) =>
    proposal.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentProposals =
    activeTab === "inProgress" ? inProgressProposals : completedProposals;

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSort = (option) => {
    setSortOption(option);
    const sorted = [...acceptedProposals];
    switch (option) {
      case "newest":
        sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "oldest":
        sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case "highest":
        sorted.sort((a, b) => b.budget - a.budget);
        break;
      case "lowest":
        sorted.sort((a, b) => a.budget - b.budget);
        break;
      default:
        break;
    }
    setAcceptedProposals(sorted);
  };

  const viewJobDetails = (job) => {
    console.log("Navigating to job details:", job);
    if (job.isCrowdsourced) {
      navigate(`/freelancer/my-teams/${job._id}`);
    } else {
      navigate(`/freelancer/jobs/${job._id}`);
    }
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
            <p className="mt-4 text-white">Loading your active jobs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar />

      <div className="bg-gradient-to-r mb-6 h-[200px] from-[#9333EA]/20 to-[#0a0a0f] border-b border-[#2d2d3a] flex items-center">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-2">Freelancer Jobs</h1>
          <p className="text-gray-400">View and manage your jobs</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-md flex items-center">
            <AlertCircle size={20} className="text-red-400 mr-2" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] mb-6">
          <div className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row gap-2 justify-between">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="pl-10 pr-4 py-2 bg-[#1e1e2d] border border-[#2d2d3a] rounded-md focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent w-full sm:w-64"
                />
              </div>

              <div className="relative">
                <Filter
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
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

        <div className="mb-6">
          <div className="flex border-b border-[#2d2d3a]">
            <button
              className={`py-2 px-4 ${
                activeTab === "inProgress"
                  ? "border-b-2 border-[#9333EA] text-[#9333EA]"
                  : "text-gray-400"
              }`}
              onClick={() => setActiveTab("inProgress")}
            >
              In Progress
            </button>
            <button
              className={`py-2 px-4 ${
                activeTab === "completed"
                  ? "border-b-2 border-[#9333EA] text-[#9333EA]"
                  : "text-gray-400"
              }`}
              onClick={() => setActiveTab("completed")}
            >
              Completed
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {currentProposals.length === 0 ? (
            <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] p-8 text-center">
              <div className="w-16 h-16 bg-[#1e1e2d] rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase size={24} className="text-[#9333EA]" />
              </div>
              <h3 className="text-xl font-bold mb-2">No jobs found</h3>
              <p className="text-gray-400 mb-6">
                You don't have any active or completed jobs at the moment.
              </p>
              <button
                onClick={() => navigate("/jobs")}
                className="px-4 py-2 bg-[#9333EA] hover:bg-[#a855f7] text-white rounded-md transition-colors"
              >
                Browse Jobs
              </button>
            </div>
          ) : (
            currentProposals.map((proposal) => (
              <div
                key={proposal._id}
                className="bg-[#121218] rounded-lg border border-[#2d2d3a] overflow-hidden hover:border-[#9333EA]/50 transition-colors cursor-pointer"
                onClick={() => viewJobDetails(proposal)}
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-1 group-hover:text-[#9333EA] transition-colors">
                        {proposal.title || "Untitled Job"}
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
                          Accepted on {formatDate(proposal.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">
                      Milestones
                    </h4>
                    <div className="space-y-2">
                      {proposal.isCrowdsourced
                        ? proposal.team
                            .find((member) => member.freelancer === user._id)
                            ?.milestones?.map((milestone, index) => (
                              <div
                                key={index}
                                className="flex justify-between items-center bg-[#1e1e2d] p-3 rounded-md"
                              >
                                <div>
                                  <p className="font-medium">
                                    {milestone.title}
                                  </p>
                                  <p className="text-sm text-gray-400 truncate max-w-md">
                                    {milestone.description}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">
                                    PKR {milestone.amount.toLocaleString()}
                                  </p>
                                  <p className="text-sm text-gray-400">
                                    Due: {formatDate(milestone.deadline)}
                                  </p>
                                </div>
                              </div>
                            ))
                        : proposal.milestones.map((milestone, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center bg-[#1e1e2d] p-3 rounded-md"
                            >
                              <div>
                                <p className="font-medium">{milestone.title}</p>
                                <p className="text-sm text-gray-400 truncate max-w-md">
                                  {milestone.description}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">
                                  PKR {milestone.amount.toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-400">
                                  Due: {formatDate(milestone.deadline)}
                                </p>
                              </div>
                            </div>
                          ))}
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        viewJobDetails(proposal);
                      }}
                      className="flex items-center text-[#9333EA] hover:text-[#a855f7] transition-colors"
                    >
                      View Job Details
                      <ArrowUpRight size={16} className="ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FreelancerJobs;
