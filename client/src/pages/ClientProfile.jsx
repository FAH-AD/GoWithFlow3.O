"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams} from "react-router-dom"
import { useSelector } from "react-redux"
import { motion } from "framer-motion"
import {uploadFile} from '../services/fileUpload'
import { Briefcase, Globe, Building, Mail, AlertTriangle, Loader } from "lucide-react"
import Navbar from "../components/Navbar"
import ProfileHeader from "../components/profileHeader"
import ReviewSummary from "../components/ReviewSummary"
import ReviewsList from "../components/ReviewsList"
import { reviewService } from "../services/reviewService"

const ClientProfile = () => {
  const navigate = useNavigate()
  const user = useSelector((state) => state.Auth?.user)
  const { userId } = useParams()
  

  const [profileData, setProfileData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    companyWebsite: "",
    industry: "",
    profilePic: null,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [reviews, setReviews] = useState([])
  const [reviewStats, setReviewStats] = useState(null)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const isOwnProfile = !userId || (user && userId === user._id)

  // Check if user is authorized
  useEffect(() => {
    if (!user) {
      navigate("/login", { state: { from: "/profile", message: "Please login to view your profile" } })
    } else if (user.role !== "client") {
      navigate("/freelancer/profile")
    } else {
      fetchProfileData()
    }
  }, [user, navigate])

  // Fetch profile data
  const fetchProfileData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`http://localhost:5000/api/user-profile/${user._id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch profile data")
      }

      const data = await response.json()
      console.log("Profile data:", data)
      setProfileData(data.data.user)

      // Fetch reviews for this user
      if (data.data.user._id) {
        fetchReviews(data.data.user._id);
      }

      // Initialize form data

      setFormData({
        name: data.data.user.name || "",
        companyName: data.data.user.companyName || "",
        companyWebsite: data.data.user.companyWebsite || "",
        industry: data.data.user.industry || "",
        profilePic: null,
      })
    } catch (err) {
      setError(err.message || "Failed to load profile data")
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch reviews for the user
  const fetchReviews = async (targetUserId) => {
    setReviewsLoading(true);
    try {
      const reviewsData = await reviewService.getUserReviews(targetUserId);
      console.log('Client reviews data received:', reviewsData);
      setReviews(reviewsData.reviews || []);
      setReviewStats(reviewsData.stats || null);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
      setReviewStats(null);
    } finally {
      setReviewsLoading(false);
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle profile image change
  const handleImageChange = (file) => {
    setFormData((prev) => ({
      ...prev,
      profilePic: file,
    }))
  
    // Preview the selected image
    const reader = new FileReader()
    reader.onloadend = () => {
      setProfileData((prev) => ({
        ...prev,
        profilePic: reader.result,
      }))
    }
    reader.readAsDataURL(file)
  }

  // Handle edit mode toggle
  const handleEdit = () => {
    setIsEditing(true)
  }

  // Handle cancel edit
  const handleCancel = () => {
    setIsEditing(false)
    // Reset form data to current profile data
    setFormData({
      name: profileData.name || "",
      companyName: profileData.companyName || "",
      companyWebsite: profileData.companyWebsite || "",
      industry: profileData.industry || "",
      profilePic: null,
    })
    setSuccessMessage("")
  }

  // Handle save profile
  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    setSuccessMessage("")
  
    try {
      let profilePicUrl = profileData.profilePic
  
      // Upload new profile picture if it exists
      if (formData.profilePic) {
        const uploadResult = await uploadFile(formData.profilePic)
        profilePicUrl = uploadResult.url
      }
  
      // Prepare data to send
      const dataToSend = {
        name: formData.name,
        companyName: formData.companyName,
        companyWebsite: formData.companyWebsite,
        industry: formData.industry,
        profilePic: profilePicUrl
      }
  
      console.log("Data to send for profile update:", dataToSend)
  
      const response = await fetch(`http://localhost:5000/api/user-profile/${user._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(dataToSend),
      })
  
      if (!response.ok) {
        throw new Error("Failed to update profile")
      }
  
      const data = await response.json()
      setProfileData(data.user)
      setSuccessMessage("Profile updated successfully!")
      setIsEditing(false)
    } catch (err) {
      setError(err.message || "Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }
  

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-[#9333EA] border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-white">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar />

      <ProfileHeader
        user={profileData}
        isEditing={isEditing && isOwnProfile}
        isOwnProfile={isOwnProfile}
        onEdit={handleEdit}
        onSave={handleSave}
        onCancel={handleCancel}
        onImageChange={handleImageChange}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-md flex items-center"
          >
            <AlertTriangle size={20} className="text-red-400 mr-2" />
            <p className="text-red-400">{error}</p>
          </motion.div>
        )}

        {/* Success Message */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-900/20 border border-green-800 rounded-md flex items-center"
          >
            <div className="text-green-400 mr-2">✓</div>
            <p className="text-green-400">{successMessage}</p>
          </motion.div>
        )}

        {/* Profile Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] overflow-hidden">
              <div className="p-6 border-b border-[#2d2d3a]">
                <h2 className="text-xl font-bold">Company Information</h2>
              </div>

              <div className="p-6">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-2">
                        Full Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-[#1e1e2d] border border-[#2d2d3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="companyName" className="block text-sm font-medium mb-2">
                        Company Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        id="companyName"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-[#1e1e2d] border border-[#2d2d3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="companyWebsite" className="block text-sm font-medium mb-2">
                        Company Website
                      </label>
                      <input
                        type="url"
                        id="companyWebsite"
                        name="companyWebsite"
                        value={formData.companyWebsite}
                        onChange={handleChange}
                        placeholder="https://example.com"
                        className="w-full px-4 py-3 bg-[#1e1e2d] border border-[#2d2d3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label htmlFor="industry" className="block text-sm font-medium mb-2">
                        Industry <span className="text-red-400">*</span>
                      </label>
                      <select
                        id="industry"
                        name="industry"
                        value={formData.industry}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-[#1e1e2d] border border-[#2d2d3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent appearance-none"
                        required
                      >
                        <option value="">Select Industry</option>
                        <option value="Technology">Technology</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Design">Design</option>
                        <option value="Finance">Finance</option>
                        <option value="Education">Education</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {isSaving && (
                      <div className="flex items-center justify-center py-2">
                        <Loader size={24} className="text-[#9333EA] animate-spin" />
                        <span className="ml-2">Saving changes...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-start">
                      <Building size={20} className="text-[#9333EA] mt-1 mr-3" />
                      <div>
                        <h3 className="font-medium">Company Name</h3>
                        <p className="text-gray-300 mt-1">{profileData?.companyName || "Not specified"}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Briefcase size={20} className="text-[#9333EA] mt-1 mr-3" />
                      <div>
                        <h3 className="font-medium">Industry</h3>
                        <p className="text-gray-300 mt-1">{profileData?.industry || "Not specified"}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Globe size={20} className="text-[#9333EA] mt-1 mr-3" />
                      <div>
                        <h3 className="font-medium">Company Website</h3>
                        {profileData?.companyWebsite ? (
                          <a
                            href={profileData.companyWebsite}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#9333EA] hover:underline mt-1 inline-block"
                          >
                            {profileData.companyWebsite}
                          </a>
                        ) : (
                          <p className="text-gray-300 mt-1">Not specified</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Mail size={20} className="text-[#9333EA] mt-1 mr-3" />
                      <div>
                        <h3 className="font-medium">Email</h3>
                        <p className="text-gray-300 mt-1">{profileData?.email || "Not specified"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Stats */}
            <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] overflow-hidden">
              <div className="p-6 border-b border-[#2d2d3a]">
                <h2 className="text-xl font-bold">Account Statistics</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#1e1e2d] p-4 rounded-lg">
                    <p className="text-sm text-gray-400">Member Since</p>
                    <p className="text-xl font-bold mt-1">
                      {new Date(profileData?.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="bg-[#1e1e2d] p-4 rounded-lg">
                    <p className="text-sm text-gray-400">Total Spent</p>
                    <p className="text-xl font-bold mt-1">PKR {profileData?.totalSpent?.toLocaleString() || "0"}</p>
                  </div>

                  <div className="bg-[#1e1e2d] p-4 rounded-lg">
                    <p className="text-sm text-gray-400">Active Jobs</p>
                    <p className="text-xl font-bold mt-1">{profileData?.activeJobs || "0"}</p>
                  </div>

                  <div className="bg-[#1e1e2d] p-4 rounded-lg">
                    <p className="text-sm text-gray-400">Completed Jobs</p>
                    <p className="text-xl font-bold mt-1">{profileData?.completedJobs || "0"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Status */}
            <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] overflow-hidden">
              <div className="p-6 border-b border-[#2d2d3a]">
                <h2 className="text-xl font-bold">Verification Status</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Email Verification</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        profileData?.isEmailVerified
                          ? "bg-green-500/20 text-green-500"
                          : "bg-yellow-500/20 text-yellow-500"
                      }`}
                    >
                      {profileData?.isEmailVerified ? "Verified" : "Pending"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Company Verification</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        profileData?.clientVerification.status=== "verified"
                          ? "bg-green-500/20 text-green-500"
                          : "bg-yellow-500/20 text-yellow-500"
                      }`}
                    >
                      {profileData?.clientVerification.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Identity Verification</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        profileData?.clientVerification?.status === "verified"
                          ? "bg-green-500/20 text-green-500"
                          : "bg-yellow-500/20 text-yellow-500"
                      }`}
                    >
                      {profileData?.clientVerification?.status === "verified"
                        ? "Verified"
                        : profileData?.clientVerification?.status || "Not Started"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] overflow-hidden">
              <div className="p-6 border-b border-[#2d2d3a]">
                <h2 className="text-xl font-bold">Reviews & Ratings</h2>
              </div>
              <div className="p-6">
                <ReviewSummary 
                  userId={profileData?._id} 
                  stats={reviewStats} 
                  reviews={reviews} 
                />
                
                {reviews.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">Recent Reviews</h3>
                    <ReviewsList 
                      reviews={reviews.slice(0, 3)} 
                      loading={reviewsLoading}
                      showJobTitles={true}
                    />
                    
                    {reviews.length > 3 && (
                      <div className="mt-4 text-center">
                        <button className="text-[#9333EA] hover:text-[#a855f7] text-sm">
                          View All Reviews ({reviews.length})
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Payment Information */}
            {/* <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] overflow-hidden">
              <div className="p-6 border-b border-[#2d2d3a]">
                <h2 className="text-xl font-bold">Payment Information</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">In Progress</span>
                    <span className="font-bold">PKR {profileData?.payments?.inProgress?.toLocaleString() || "0"}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Pending</span>
                    <span className="font-bold">PKR {profileData?.payments?.pending?.toLocaleString() || "0"}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Available</span>
                    <span className="font-bold">PKR {profileData?.payments?.available?.toLocaleString() || "0"}</span>
                  </div>
                </div>
              </div>
            </div>
 */}


          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientProfile
