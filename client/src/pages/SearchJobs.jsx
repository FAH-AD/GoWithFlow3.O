"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useSelector } from "react-redux"
import {
  Search,
  MapPin,
  Briefcase,
  DollarSign,
  Calendar,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Loader,
  AlertTriangle,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Navbar from "../components/Navbar"

const SearchJobs = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useSelector((state) => state.Auth?.user)

  // Parse query params from URL
  const queryParams = new URLSearchParams(location.search)
  const initialTitle = queryParams.get("title") || ""
  const initialLocation = queryParams.get("location") || ""
  const initialCategory = queryParams.get("category") || ""
  const initialMinBudget = queryParams.get("minBudget") || ""
  const initialMaxBudget = queryParams.get("maxBudget") || ""
  const initialExperience = queryParams.get("experience") || ""
  const initialPage = Number.parseInt(queryParams.get("page") || "1", 10)

  // Search state
  const [searchParams, setSearchParams] = useState({
    title: initialTitle,
    location: initialLocation,
    category: initialCategory,
    minBudget: initialMinBudget,
    maxBudget: initialMaxBudget,
    experience: initialExperience,
    page: initialPage,
    limit: 10,
  })

  // UI state
  const [jobs, setJobs] = useState([])
  const [totalJobs, setTotalJobs] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showFilters, setShowFilters] = useState(false)

  // Fetch jobs on mount and when search params change
  useEffect(() => {
    if (user) {
      fetchJobs()
    } else {
      navigate("/login", { state: { from: "", message: "Please login to search jobs" } })
    }
  }, [searchParams.page, user, navigate])

  // Update URL when search params change
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchParams.title) params.set("title", searchParams.title)
    if (searchParams.location) params.set("location", searchParams.location)
    if (searchParams.category) params.set("category", searchParams.category)
    if (searchParams.minBudget) params.set("minBudget", searchParams.minBudget)
    if (searchParams.maxBudget) params.set("maxBudget", searchParams.maxBudget)
    if (searchParams.experience) params.set("experience", searchParams.experience)
    if (searchParams.page > 1) params.set("page", searchParams.page.toString())

    navigate(`/freelancer/search-job?${params.toString()}`, { replace: true })
  }, [searchParams, navigate])

  // Fetch jobs from API
  const fetchJobs = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Build query string
      const params = new URLSearchParams()
      if (searchParams.title) params.set("title", searchParams.title)
      if (searchParams.location) params.set("location", searchParams.location)
      if (searchParams.category) params.set("category", searchParams.category)
      if (searchParams.minBudget) params.set("minBudget", searchParams.minBudget)
      if (searchParams.maxBudget) params.set("maxBudget", searchParams.maxBudget)
      if (searchParams.experience) params.set("experience", searchParams.experience)
      params.set("page", searchParams.page.toString())
      params.set("limit", searchParams.limit.toString())

      const response = await fetch(`http://localhost:5000/api/jobs/search?${params.toString()}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch jobs")
      }

      const data = await response.json()
      console.log(data, "data in search jobs")
      setJobs(data.data.jobs)
      setTotalJobs(data.data.totalJobs || 0)
      setTotalPages(data.data.totalPages || 1)
    } catch (err) {
      setError(err.message || "Failed to load jobs")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault()
    setSearchParams((prev) => ({ ...prev, page: 1 })) // Reset to page 1
    fetchJobs()
  }

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setSearchParams((prev) => ({ ...prev, [name]: value }))
  }

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return
    setSearchParams((prev) => ({ ...prev, page: newPage }))
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchParams({
      title: "",
      location: "",
      category: "",
      minBudget: "",
      maxBudget: "",
      experience: "",
      page: 1,
      limit: 10,
    })
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

  // Format location
  const formatLocation = (location) => {
    switch (location) {
      case "remote":
        return "Remote"
      case "on-site":
        return "On-site"
      case "hybrid":
        return "Hybrid"
      default:
        return location
    }
  }

  // Format experience level
  const formatExperience = (level) => {
    switch (level) {
      case "entry":
        return "Entry Level"
      case "intermediate":
        return "Intermediate"
      case "expert":
        return "Expert"
      default:
        return level
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r mb-4 h-[200px] from-[#9333EA]/20 to-[#0a0a0f] border-b border-[#2d2d3a] flex items-center">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-2">Find Jobs</h1>
          <p className="text-gray-400">Discover opportunities that match your skills and interests</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search Form */}
        <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] mb-6">
          <div className="p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="title"
                    value={searchParams.title}
                    onChange={handleInputChange}
                    placeholder="Job title or keyword"
                    className="w-full pl-10 pr-4 py-3 bg-[#1e1e2d] border border-[#2d2d3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin size={18} className="text-gray-400" />
                  </div>
                  <select
                    name="location"
                    value={searchParams.location}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-[#1e1e2d] border border-[#2d2d3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent appearance-none"
                  >
                    <option value="">All Locations</option>
                    <option value="remote">Remote</option>
                    <option value="on-site">On-site</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-[#9333EA] hover:bg-[#a855f7] text-white rounded-md transition-colors flex items-center justify-center gap-2"
                  >
                    <Search size={18} />
                    <span>Search</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className="px-4 py-3 bg-[#1e1e2d] hover:bg-[#2d2d3a] text-white rounded-md transition-colors flex items-center justify-center"
                  >
                    <Filter size={18} />
                    {showFilters ? (
                      <ChevronUp size={18} className="ml-1" />
                    ) : (
                      <ChevronDown size={18} className="ml-1" />
                    )}
                  </button>
                </div>
              </div>

              {/* Advanced Filters */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 border-t border-[#2d2d3a]">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label htmlFor="category" className="block text-sm font-medium mb-2">
                            Category
                          </label>
                          <select
                            id="category"
                            name="category"
                            value={searchParams.category}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-[#1e1e2d] border border-[#2d2d3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent appearance-none"
                          >
                            <option value="">All Categories</option>
                            <option value="Web Development">Web Development</option>
                            <option value="Mobile Development">Mobile Development</option>
                            <option value="UI/UX Design">UI/UX Design</option>
                            <option value="Graphic Design">Graphic Design</option>
                            <option value="Content Writing">Content Writing</option>
                            <option value="Digital Marketing">Digital Marketing</option>
                            <option value="Data Science">Data Science</option>
                            <option value="Video Editing">Video Editing</option>
                            <option value="Audio Production">Audio Production</option>
                            <option value="Translation">Translation</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label htmlFor="experience" className="block text-sm font-medium mb-2">
                            Experience Level
                          </label>
                          <select
                            id="experience"
                            name="experience"
                            value={searchParams.experience}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-[#1e1e2d] border border-[#2d2d3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent appearance-none"
                          >
                            <option value="">All Levels</option>
                            <option value="entry">Entry Level</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="expert">Expert</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Budget Range (PKR)</label>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              name="minBudget"
                              value={searchParams.minBudget}
                              onChange={handleInputChange}
                              placeholder="Min"
                              className="w-full px-4 py-3 bg-[#1e1e2d] border border-[#2d2d3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
                            />
                            <input
                              type="number"
                              name="maxBudget"
                              value={searchParams.maxBudget}
                              onChange={handleInputChange}
                              placeholder="Max"
                              className="w-full px-4 py-3 bg-[#1e1e2d] border border-[#2d2d3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end mt-4">
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="flex items-center gap-1 text-sm px-3 py-1 text-gray-400 hover:text-white transition-colors"
                        >
                          <X size={16} />
                          <span>Clear Filters</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-md flex items-center">
            <AlertTriangle size={20} className="text-red-400 mr-2" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Results Count */}
        <div className="mb-4 flex justify-between items-center">
          <p className="text-gray-400">
            {isLoading ? "Searching..." : `Found ${totalJobs} job${totalJobs !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="flex flex-col items-center">
              <Loader size={36} className="text-[#9333EA] animate-spin" />
              <p className="mt-4 text-gray-400">Searching for jobs...</p>
            </div>
          </div>
        )}

        {/* No Results */}
        {!isLoading && jobs.length === 0 && (
          <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] p-12 text-center">
            <div className="w-16 h-16 bg-[#1e1e2d] rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase size={24} className="text-[#9333EA]" />
            </div>
            <h3 className="text-xl font-bold mb-2">No jobs found</h3>
            <p className="text-gray-400 mb-6">Try adjusting your search filters or search for something else</p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-[#1e1e2d] hover:bg-[#2d2d3a] text-white rounded-md transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Job Results */}
        {!isLoading && jobs.length > 0 && (
          <div className="space-y-6">
            {jobs.map((job) => (
              <motion.div
                key={job._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-[#121218] rounded-lg border border-[#2d2d3a] overflow-hidden hover:border-[#9333EA]/50 transition-colors cursor-pointer"
               
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-1">{job.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                        <span className="flex items-center">
                          <Briefcase size={14} className="mr-1" />
                          {job.client?.name || "Client"}
                        </span>
                        <span className="flex items-center">
                          <MapPin size={14} className="mr-1" />
                          {formatLocation(job.location)}
                        </span>
                        <span className="flex items-center">
                          <Calendar size={14} className="mr-1" />
                          Posted {formatDate(job.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="bg-[#1e1e2d] px-4 py-2 rounded-md flex items-center">
                       
                        <span className="font-bold">PKR {job?.budget?.toLocaleString()}</span>
                      </div>
                      {job.hasApplied ? (
                        <div className="bg-green-900/20 text-green-500 px-4 py-2 rounded-md flex items-center">
                          <CheckCircle size={16} className="mr-1" />
                          <span>Applied</span>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/freelancer/apply-job/${job._id}`)
                          }}
                          className="bg-[#9333EA] hover:bg-[#a855f7] px-4 py-2 rounded-md transition-colors"
                        >
                          Apply Now
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-300 mb-4 line-clamp-2">{job.description}</p>

                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill, index) => (
                      <span key={index} className="bg-[#1e1e2d] text-white px-3 py-1 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3 text-sm">
                    <span className="bg-[#1e1e2d] text-gray-300 px-3 py-1 rounded-full flex items-center">
                      <span className="w-2 h-2 bg-[#9333EA] rounded-full mr-2"></span>
                      {formatExperience(job.experienceLevel)}
                    </span>
                    <span className="bg-[#1e1e2d] text-gray-300 px-3 py-1 rounded-full flex items-center">
                      <span className="w-2 h-2 bg-[#9333EA] rounded-full mr-2"></span>
                      {job.bidCount} Proposal{job.bidCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(searchParams.page - 1)}
                disabled={searchParams.page === 1}
                className={`px-3 py-2 rounded-md ${
                  searchParams.page === 1
                    ? "bg-[#1e1e2d] text-gray-500 cursor-not-allowed"
                    : "bg-[#1e1e2d] hover:bg-[#2d2d3a] text-white"
                }`}
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`w-10 h-10 rounded-md ${
                    searchParams.page === page
                      ? "bg-[#9333EA] text-white"
                      : "bg-[#1e1e2d] hover:bg-[#2d2d3a] text-white"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(searchParams.page + 1)}
                disabled={searchParams.page === totalPages}
                className={`px-3 py-2 rounded-md ${
                  searchParams.page === totalPages
                    ? "bg-[#1e1e2d] text-gray-500 cursor-not-allowed"
                    : "bg-[#1e1e2d] hover:bg-[#2d2d3a] text-white"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchJobs
