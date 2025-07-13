"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useSelector } from "react-redux"
import { motion } from "framer-motion"
import {
    Briefcase,
    Mail,
    MapPin,
    Clock,
    DollarSign,
    Languages,
    AlertTriangle,
    MessageSquare,
    Plus,
    Trash2,
    X,
    Image,
    Link,
    Calendar,
    Edit,
    Save,
    ChevronDown,
    ChevronUp,
} from "lucide-react"
import Navbar from "../components/Navbar"
import ProfileHeader from "../components/profileHeader"
import { uploadFile } from "../services/fileUpload"
import ReviewSummary from "../components/ReviewSummary"
import ReviewsList from "../components/ReviewsList"
import { reviewService, userService } from "../services/reviewService"


const FreelancerProfile = () => {
    const navigate = useNavigate()
    const { userId } = useParams()
    const currentUser = useSelector((state) => state.Auth?.user)
    const [isUploading, setIsUploading] = useState(false);
    const [profileData, setProfileData] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        title: "",
        bio: "",
        location: "",
        hourlyRate: "",
        skills: [],
        availability: "",
        languages: [],
        portfolio: [],
        experience: [],
        education: [],
        profilePic: null,
    })
    const [isSaving, setIsSaving] = useState(false)
    const [successMessage, setSuccessMessage] = useState("")
    const [skillInput, setSkillInput] = useState("")

    const [selectedPortfolio, setSelectedPortfolio] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [reviewStats, setReviewStats] = useState(null);
    const [reviewsLoading, setReviewsLoading] = useState(false);

    // Check if viewing own profile or someone else's
    const isOwnProfile = !userId || (currentUser && userId === currentUser._id)

    // Check if user is authorized
    useEffect(() => {
        if (!currentUser && !userId) {
            navigate("/login", { state: { from: "/profile", message: "Please login to view your profile" } })
        } else {
            fetchProfileData()
        }
    }, [currentUser, navigate, userId])

    // Fetch reviews for the user
    const fetchReviews = async (targetUserId) => {
        setReviewsLoading(true);
        try {
            const reviewsData = await reviewService.getUserReviews(targetUserId);
            console.log('User reviews data received:', reviewsData);
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

    // Fetch profile data
    const fetchProfileData = async () => {
        setIsLoading(true)
        setError(null)

        try {
            const endpoint = userId
                ? `http://localhost:5000/api/user-profile/${userId}`
                : "http://localhost:5000/api/user-profile/profile"

            const response = await fetch(endpoint, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                },
            })

            if (!response.ok) {
                throw new Error("Failed to fetch profile data")
            }

            const data = await response.json()
            console.log(data, "data in profile")
            setProfileData(data.data.user)

            // Fetch reviews for this user
            if (data.data.user._id) {
                fetchReviews(data.data.user._id);
            }

            // Initialize form data
            if (isOwnProfile) {
                setFormData({
                    name: data.data.user.name || "",
                    title: data.data.user.title || "",
                    bio: data.data.user.bio || "",
                    location: data.data.user.location || "",
                    hourlyRate: data.data.user.hourlyRate || "",
                    skills: data.data.user.skills || [],
                    availability: data.data.user.availability || "full-time",
                    languages: data.data.user.languages || [],
                    portfolio: data.data.user.portfolio || [],
                    experience: data.data.user.experience || [],
                    education: data.data.user.education || [],
                    profilePic: data.data.user.profilePic || null,
                })
            }
        } catch (err) {
            setError(err.message || "Failed to load profile data")
        } finally {
            setIsLoading(false)
        }
    }

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    // Handle profile image change
    // Handle profile image change
    
const handleImageChange = async (file) => {
    setIsUploading(true);
    setError(null);

    try {
        // Upload the file
        const uploadResult = await uploadFile(file);

        // Update the form data with the uploaded file URL
        setFormData((prev) => ({
            ...prev,
            profilePic: uploadResult,
        }));

        // Update the profile data for immediate preview
        setProfileData((prev) => ({
            ...prev,
            profilePic: uploadResult,
        }));
    } catch (error) {
        console.error("Error uploading file:", error);
        
        // Check for the specific file size error
        if (error.message === "File size too large. Got 10822574. Maximum is 10485760.") {
            const maxSizeMB = (10485760 / (1024 * 1024)).toFixed(2);
            setError(`File size too large. Maximum allowed size is ${maxSizeMB} MB. Please choose a smaller file.`);
        } else {
            setError(`Error uploading file.please try again`);
        }
    } finally {
        setIsUploading(false);
    }

    // Preview the selected image (as a fallback)
    const reader = new FileReader();
    reader.onloadend = () => {
        setProfileData((prev) => ({
            ...prev,
            profilePic: reader.result,
        }));
    };
    reader.readAsDataURL(file);
};
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
            title: profileData.title || "",
            bio: profileData.bio || "",
            location: profileData.location || "",
            hourlyRate: profileData.hourlyRate || "",
            skills: profileData.skills || [],
            availability: profileData.availability || "full-time",
            languages: profileData.languages || [],
            portfolio: profileData.portfolio || [],
            experience: profileData.experience || [],
            education: profileData.education || [],
            profilePic: profileData.profilePic || null,
        })
        setSuccessMessage("")
    }

    // Handle save profile
    const handleSave = async () => {
        setIsSaving(true)
        setError(null)
        setSuccessMessage("")

        try {
            // Create FormData object for file upload
            const formDataToSend = new FormData()

            formDataToSend.append("name", formData.name)
            formDataToSend.append("title", formData.title || "")
            formDataToSend.append("bio", formData.bio || "")
            formDataToSend.append("location", formData.location || "")
            formDataToSend.append("hourlyRate", formData.hourlyRate || "")
            formDataToSend.append("availability", formData.availability)

            // Append arrays as JSON strings
            formDataToSend.append("skills", JSON.stringify(formData.skills))
            formDataToSend.append("languages", JSON.stringify(formData.languages))
            formDataToSend.append("portfolio", JSON.stringify(formData.portfolio))
            formDataToSend.append("experience", JSON.stringify(formData.experience))
            formDataToSend.append("education", JSON.stringify(formData.education))

            const dataToSend = {
                name: formData.name,
                title: formData.title,
                bio: formData.bio,
                location: formData.location,
                hourlyRate: formData.hourlyRate,
                availability: formData.availability,
                skills: formData.skills,
                languages: formData.languages,
                portfolio: formData.portfolio,
                experience: formData.experience,
                education: formData.education,
                companyName: formData.companyName || "", // Optional for client profiles
                companyWebsite: formData.companyWebsite || "",
                industry: formData.industry || "",
                profilePic: formData.profilePic || null,
            };
            // Append profilePic URL if it exists



            console.log(dataToSend, "data to send")
            const response = await fetch(`http://localhost:5000/api/user-profile/${userId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                    "Content-Type": "application/json", // Set correct header
                },
                body: JSON.stringify(dataToSend), // Send JSON string
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

    // Handle skill input
    const handleSkillInputChange = (e) => {
        setSkillInput(e.target.value)
    }

    const handlePortfolioImageUpload = async (index, file) => {
        try {
            const imageUrl = await uploadFile(file);
            const updatedPortfolio = [...formData.portfolio];
            updatedPortfolio[index].images = [...(updatedPortfolio[index].images || []), imageUrl];
            setFormData({ ...formData, portfolio: updatedPortfolio });
        } catch (error) {
            console.error('Error uploading image:', error);
            // Handle error (e.g., show error message to user)
        }
    };

    const handleRemovePortfolioImage = (portfolioIndex, imageIndex) => {
        const updatedPortfolio = [...formData.portfolio];
        updatedPortfolio[portfolioIndex].images.splice(imageIndex, 1);
        setFormData({ ...formData, portfolio: updatedPortfolio });
    };

    // Add skill
    const handleAddSkill = () => {
        if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
            setFormData((prev) => ({
                ...prev,
                skills: [...prev.skills, skillInput.trim()],
            }))
            setSkillInput("")
        }
    }

    // Remove skill
    const handleRemoveSkill = (skillToRemove) => {
        setFormData((prev) => ({
            ...prev,
            skills: prev.skills.filter((skill) => skill !== skillToRemove),
        }))
    }

    // Handle language changes
    const handleLanguageChange = (index, field, value) => {
        const updatedLanguages = [...formData.languages]
        updatedLanguages[index] = {
            ...updatedLanguages[index],
            [field]: value,
        }
        setFormData((prev) => ({
            ...prev,
            languages: updatedLanguages,
        }))
    }

    // Add language
    const handleAddLanguage = () => {
        setFormData((prev) => ({
            ...prev,
            languages: [...prev.languages, { name: "", level: "beginner" }],
        }))
    }

    // Remove language
    const handleRemoveLanguage = (index) => {
        const updatedLanguages = [...formData.languages]
        updatedLanguages.splice(index, 1)
        setFormData((prev) => ({
            ...prev,
            languages: updatedLanguages,
        }))
    }

    // Handle education changes
    const handleEducationChange = (index, field, value) => {
        const updatedEducation = [...formData.education]
        updatedEducation[index] = {
            ...updatedEducation[index],
            [field]: value,
        }
        setFormData((prev) => ({
            ...prev,
            education: updatedEducation,
        }))
    }

    // Add education
    const handleAddEducation = () => {
        setFormData((prev) => ({
            ...prev,
            education: [
                ...prev.education,
                {
                    institution: "",
                    degree: "",
                    fieldOfStudy: "",
                    startDate: "",
                    endDate: "",
                    current: false,
                    description: "",
                },
            ],
        }))
    }

    // Remove education
    const handleRemoveEducation = (index) => {
        const updatedEducation = [...formData.education]
        updatedEducation.splice(index, 1)
        setFormData((prev) => ({
            ...prev,
            education: updatedEducation,
        }))
    }

    // Handle experience changes
    const handleExperienceChange = (index, field, value) => {
        const updatedExperience = [...formData.experience]
        updatedExperience[index] = {
            ...updatedExperience[index],
            [field]: value,
        }
        setFormData((prev) => ({
            ...prev,
            experience: updatedExperience,
        }))
    }

    // Add experience
    const handleAddExperience = () => {
        setFormData((prev) => ({
            ...prev,
            experience: [
                ...prev.experience,
                {
                    companyName: "",
                    position: "",
                    startDate: "",
                    endDate: "",
                    current: false,
                    description: "",
                },
            ],
        }))
    }

    // Remove experience
    const handleRemoveExperience = (index) => {
        const updatedExperience = [...formData.experience]
        updatedExperience.splice(index, 1)
        setFormData((prev) => ({
            ...prev,
            experience: updatedExperience,
        }))
    }

    // Handle portfolio changes
    const handlePortfolioChange = (index, field, value) => {
        const updatedPortfolio = [...formData.portfolio]
        updatedPortfolio[index] = {
            ...updatedPortfolio[index],
            [field]: value,
        }
        setFormData((prev) => ({
            ...prev,
            portfolio: updatedPortfolio,
        }))
    }

    // Add portfolio
    const handleAddPortfolio = () => {
        setFormData((prev) => ({
            ...prev,
            portfolio: [
                ...prev.portfolio,
                {
                    title: "",
                    description: "",
                    images: [],
                    startDate: "",
                    endDate: "",
                },
            ],
        }))
    }

    // Remove portfolio
    const handleRemovePortfolio = (index) => {
        const updatedPortfolio = [...formData.portfolio]
        updatedPortfolio.splice(index, 1)
        setFormData((prev) => ({
            ...prev,
            portfolio: updatedPortfolio,
        }))
    }

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return "Present"
        const date = new Date(dateString)
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
        })
    }

    // Handle hire button click
    const handleHire = () => {
        navigate(`/post-job?freelancer=${profileData._id}`)
    }

    // Handle message button click
    const handleMessage = () => {
        navigate(`/messages?user=${profileData._id}`)
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
                onEdit={handleEdit}
                onSave={handleSave}
                onCancel={handleCancel}
                 isUploading={isUploading}
                isOwnProfile={isOwnProfile}
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

                {/* Action Buttons for other users viewing this profile */}
                {!isOwnProfile && currentUser?.role === "client" && (
                    <div className="mb-6 flex flex-wrap gap-3">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleHire}
                            className="flex items-center gap-2 px-6 py-3 bg-[#9333EA] hover:bg-[#a855f7] text-white rounded-md transition-colors"
                        >
                            <Briefcase size={18} />
                            <span>Hire {profileData?.name?.split(" ")[0]}</span>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleMessage}
                            className="flex items-center gap-2 px-6 py-3 bg-[#1e1e2d] hover:bg-[#2d2d3a] text-white rounded-md transition-colors"
                        >
                            <MessageSquare size={18} />
                            <span>Message</span>
                        </motion.button>
                    </div>
                )}

                {/* Profile Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* About Me */}
                        <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] overflow-hidden">
                            <div className="p-6 border-b border-[#2d2d3a]">
                                <h2 className="text-xl font-bold">About Me</h2>
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
                                            <label htmlFor="title" className="block text-sm font-medium mb-2">
                                                Professional Title <span className="text-red-400">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                id="title"
                                                name="title"
                                                value={formData.title}
                                                onChange={handleChange}
                                                placeholder="e.g. Full Stack Developer"
                                                className="w-full px-4 py-3 bg-[#1e1e2d] border border-[#2d2d3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="bio" className="block text-sm font-medium mb-2">
                                                Bio <span className="text-red-400">*</span>
                                            </label>
                                            <textarea
                                                id="bio"
                                                name="bio"
                                                value={formData.bio}
                                                onChange={handleChange}
                                                placeholder="Tell clients about yourself and your expertise"
                                                rows="4"
                                                className="w-full px-4 py-3 bg-[#1e1e2d] border border-[#2d2d3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent resize-none"
                                                required
                                            ></textarea>
                                        </div>

                                        <div>
                                            <label htmlFor="location" className="block text-sm font-medium mb-2">
                                                Location
                                            </label>
                                            <input
                                                type="text"
                                                id="location"
                                                name="location"
                                                value={formData.location}
                                                onChange={handleChange}
                                                placeholder="City, Country"
                                                className="w-full px-4 py-3 bg-[#1e1e2d] border border-[#2d2d3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="hourlyRate" className="block text-sm font-medium mb-2">
                                                Hourly Rate (PKR)
                                            </label>
                                            <input
                                                type="number"
                                                id="hourlyRate"
                                                name="hourlyRate"
                                                value={formData.hourlyRate}
                                                onChange={handleChange}
                                                placeholder="Your hourly rate"
                                                className="w-full px-4 py-3 bg-[#1e1e2d] border border-[#2d2d3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="availability" className="block text-sm font-medium mb-2">
                                                Availability <span className="text-red-400">*</span>
                                            </label>
                                            <select
                                                id="availability"
                                                name="availability"
                                                value={formData.availability}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 bg-[#1e1e2d] border border-[#2d2d3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent appearance-none"
                                                required
                                            >
                                                <option value="full-time">Full Time</option>
                                                <option value="part-time">Part Time</option>
                                                <option value="contract">Contract</option>
                                            </select>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="prose prose-invert max-w-none">
                                        <p className="whitespace-pre-line">{profileData?.bio || "No bio provided."}</p>

                                        <div className="mt-6 flex flex-wrap gap-4">
                                            {profileData?.location && (
                                                <div className="flex items-center">
                                                    <MapPin size={18} className="text-[#9333EA] mr-2" />
                                                    <span>{profileData.location}</span>
                                                </div>
                                            )}

                                            {profileData?.hourlyRate && (
                                                <div className="flex items-center">
                                                    <DollarSign size={18} className="text-[#9333EA] mr-2" />
                                                    <span>PKR {profileData.hourlyRate}/hr</span>
                                                </div>
                                            )}

                                            <div className="flex items-center">
                                                <Clock size={18} className="text-[#9333EA] mr-2" />
                                                <span>
                                                    {profileData?.availability
                                                        ? profileData.availability.charAt(0).toUpperCase() +
                                                        profileData.availability.slice(1).replace("-", " ")
                                                        : "Full Time"}
                                                </span>
                                            </div>

                                            {/* <div className="flex items-center">
                                                <Mail size={18} className="text-[#9333EA] mr-2" />
                                                <span>{profileData?.email}</span>
                                            </div> */}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Skills */}
                        <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] overflow-hidden">
                            <div className="p-6 border-b border-[#2d2d3a]">
                                <h2 className="text-xl font-bold">Skills</h2>
                            </div>

                            <div className="p-6">
                                {isEditing ? (
                                    <div className="space-y-4">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={skillInput}
                                                onChange={handleSkillInputChange}
                                                placeholder="Add a skill"
                                                className="flex-1 px-4 py-3 bg-[#1e1e2d] border border-[#2d2d3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault()
                                                        handleAddSkill()
                                                    }
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleAddSkill}
                                                className="px-4 py-3 bg-[#9333EA] hover:bg-[#a855f7] text-white rounded-md transition-colors"
                                            >
                                                Add
                                            </button>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {formData.skills.map((skill, index) => (
                                                <div key={index} className="bg-[#1e1e2d] text-white px-3 py-1 rounded-full flex items-center">
                                                    {skill}
                                                    <button
                                                        type="button"
                                                        className="ml-2 text-gray-400 hover:text-red-400"
                                                        onClick={() => handleRemoveSkill(skill)}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {profileData?.skills && profileData.skills.length > 0 ? (
                                            profileData.skills.map((skill, index) => (
                                                <span key={index} className="bg-[#1e1e2d] text-white px-3 py-1 rounded-full">
                                                    {skill}
                                                </span>
                                            ))
                                        ) : (
                                            <p className="text-gray-400">No skills listed.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Languages */}
                        <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] overflow-hidden">
                            <div className="p-6 border-b border-[#2d2d3a] flex justify-between items-center">
                                <h2 className="text-xl font-bold">Languages</h2>
                                {isEditing && (
                                    <button
                                        type="button"
                                        onClick={handleAddLanguage}
                                        className="flex items-center gap-1 text-sm px-3 py-1 bg-[#1e1e2d] hover:bg-[#2d2d3a] rounded-md transition-colors"
                                    >
                                        <Plus size={16} />
                                        <span>Add Language</span>
                                    </button>
                                )}
                            </div>

                            <div className="p-6">
                                {isEditing ? (
                                    <div className="space-y-4">
                                        {formData.languages.map((language, index) => (
                                            <div key={index} className="bg-[#1e1e2d] p-4 rounded-lg">
                                                <div className="flex justify-between items-center mb-3">
                                                    <h3 className="font-medium">Language #{index + 1}</h3>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveLanguage(index)}
                                                        className="text-red-400 hover:text-red-300"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm mb-1">
                                                            Language <span className="text-red-400">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={language.name}
                                                            onChange={(e) => handleLanguageChange(index, "name", e.target.value)}
                                                            className="w-full px-3 py-2 bg-[#121218] border border-[#2d2d3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
                                                            required
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm mb-1">
                                                            Proficiency <span className="text-red-400">*</span>
                                                        </label>
                                                        <select
                                                            value={language.level}
                                                            onChange={(e) => handleLanguageChange(index, "level", e.target.value)}
                                                            className="w-full px-3 py-2 bg-[#121218] border border-[#2d2d3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent appearance-none"
                                                            required
                                                        >
                                                            <option value="beginner">Beginner</option>
                                                            <option value="intermediate">Intermediate</option>
                                                            <option value="fluent">Fluent</option>
                                                            <option value="bilingual">Bilingual/Native</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {profileData?.languages && profileData.languages.length > 0 ? (
                                            profileData.languages.map((language, index) => (
                                                <div key={index} className="flex items-center justify-between bg-[#1e1e2d] p-3 rounded-lg">
                                                    <div className="flex items-center">
                                                        <Languages size={18} className="text-[#9333EA] mr-3" />
                                                        <span>{language.name}</span>
                                                    </div>
                                                    <span className="text-sm bg-[#2d2d3a] px-2 py-1 rounded">
                                                        {language.level.charAt(0).toUpperCase() + language.level.slice(1)}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-400">No languages listed.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Experience */}
                        <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] overflow-hidden">
                            <div className="p-6 border-b border-[#2d2d3a] flex justify-between items-center">
                                <h2 className="text-xl font-bold">Work Experience</h2>
                                {isEditing && (
                                    <button
                                        type="button"
                                        onClick={handleAddExperience}
                                        className="flex items-center gap-1 text-sm px-3 py-1 bg-[#1e1e2d] hover:bg-[#2d2d3a] rounded-md transition-colors"
                                    >
                                        <Plus size={16} />
                                        <span>Add Experience</span>
                                    </button>
                                )}
                            </div>

                            <div className="p-6">
                                {isEditing ? (
                                    <div className="space-y-4">
                                        {formData.experience.map((exp, index) => (
                                            <div key={index} className="bg-[#1e1e2d] p-4 rounded-lg">
                                                <div className="flex justify-between items-center mb-3">
                                                    <h3 className="font-medium">Experience #{index + 1}</h3>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveExperience(index)}
                                                        className="text-red-400 hover:text-red-300"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>

                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm mb-1">
                                                            Company <span className="text-red-400">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={exp.companyName}
                                                            onChange={(e) => handleExperienceChange(index, "companyName", e.target.value)}
                                                            className="w-full px-3 py-2 bg-[#121218] border border-[#2d2d3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
                                                            required
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm mb-1">
                                                            Position <span className="text-red-400">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={exp.position}
                                                            onChange={(e) => handleExperienceChange(index, "position", e.target.value)}
                                                            className="w-full px-3 py-2 bg-[#121218] border border-[#2d2d3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
                                                            required
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm mb-1">
                                                                Start Date <span className="text-red-400">*</span>
                                                            </label>
                                                            <input
                                                                type="date"
                                                                value={exp.startDate ? new Date(exp.startDate).toISOString().split("T")[0] : ""}
                                                                onChange={(e) => handleExperienceChange(index, "startDate", e.target.value)}
                                                                className="w-full px-3 py-2 bg-[#121218] border border-[#2d2d3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
                                                                required
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm mb-1">End Date</label>
                                                            <input
                                                                type="date"
                                                                value={exp.endDate ? new Date(exp.endDate).toISOString().split("T")[0] : ""}
                                                                onChange={(e) => handleExperienceChange(index, "endDate", e.target.value)}
                                                                className="w-full px-3 py-2 bg-[#121218] border border-[#2d2d3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
                                                                disabled={exp.current}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            id={`current-${index}`}
                                                            checked={exp.current}
                                                            onChange={(e) => handleExperienceChange(index, "current", e.target.checked)}
                                                            className="w-4 h-4 text-[#9333EA] bg-[#121218] border-[#2d2d3a] rounded focus:ring-[#9333EA]"
                                                        />
                                                        <label htmlFor={`current-${index}`} className="ml-2 text-sm">
                                                            I currently work here
                                                        </label>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm mb-1">Description</label>
                                                        <textarea
                                                            value={exp.description}
                                                            onChange={(e) => handleExperienceChange(index, "description", e.target.value)}
                                                            rows="3"
                                                            className="w-full px-3 py-2 bg-[#121218] border border-[#2d2d3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent resize-none"
                                                        ></textarea>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {profileData?.experience && profileData.experience.length > 0 ? (
                                            profileData.experience.map((exp, index) => (
                                                <div key={index} className="border-b border-[#2d2d3a] last:border-b-0 pb-6 last:pb-0">
                                                    <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                                                        <div>
                                                            <h3 className="font-bold text-lg">{exp.position}</h3>
                                                            <p className="text-[#9333EA]">{exp.companyName}</p>
                                                        </div>
                                                        <div className="text-gray-400 mt-1 md:mt-0 text-sm">
                                                            {formatDate(exp.startDate)} - {exp.current ? "Present" : formatDate(exp.endDate)}
                                                        </div>
                                                    </div>
                                                    {exp.description && <p className="mt-3 text-gray-300">{exp.description}</p>}
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-400">No work experience listed.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Education */}
                        <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] overflow-hidden">
                            <div className="p-6 border-b border-[#2d2d3a] flex justify-between items-center">
                                <h2 className="text-xl font-bold">Education</h2>
                                {isEditing && (
                                    <button
                                        type="button"
                                        onClick={handleAddEducation}
                                        className="flex items-center gap-1 text-sm px-3 py-1 bg-[#1e1e2d] hover:bg-[#2d2d3a] rounded-md transition-colors"
                                    >
                                        <Plus size={16} />
                                        <span>Add Education</span>
                                    </button>
                                )}
                            </div>

                            <div className="p-6">
                                {isEditing ? (
                                    <div className="space-y-4">
                                        {formData.education.map((edu, index) => (
                                            <div key={index} className="bg-[#1e1e2d] p-4 rounded-lg">
                                                <div className="flex justify-between items-center mb-3">
                                                    <h3 className="font-medium">Education #{index + 1}</h3>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveEducation(index)}
                                                        className="text-red-400 hover:text-red-300"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>

                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm mb-1">
                                                            Institution <span className="text-red-400">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={edu.institution}
                                                            onChange={(e) => handleEducationChange(index, "institution", e.target.value)}
                                                            className="w-full px-3 py-2 bg-[#121218] border border-[#2d2d3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
                                                            required
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm mb-1">
                                                                Degree <span className="text-red-400">*</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={edu.degree}
                                                                onChange={(e) => handleEducationChange(index, "degree", e.target.value)}
                                                                className="w-full px-3 py-2 bg-[#121218] border border-[#2d2d3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
                                                                required
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm mb-1">
                                                                Field of Study <span className="text-red-400">*</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={edu.fieldOfStudy}
                                                                onChange={(e) => handleEducationChange(index, "fieldOfStudy", e.target.value)}
                                                                className="w-full px-3 py-2 bg-[#121218] border border-[#2d2d3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
                                                                required
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm mb-1">
                                                                Start Date <span className="text-red-400">*</span>
                                                            </label>
                                                            <input
                                                                type="date"
                                                                value={edu.startDate ? new Date(edu.startDate).toISOString().split("T")[0] : ""}
                                                                onChange={(e) => handleEducationChange(index, "startDate", e.target.value)}
                                                                className="w-full px-3 py-2 bg-[#121218] border border-[#2d2d3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
                                                                required
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm mb-1">End Date</label>
                                                            <input
                                                                type="date"
                                                                value={edu.endDate ? new Date(edu.endDate).toISOString().split("T")[0] : ""}
                                                                onChange={(e) => handleEducationChange(index, "endDate", e.target.value)}
                                                                className="w-full px-3 py-2 bg-[#121218] border border-[#2d2d3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
                                                                disabled={edu.current}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            id={`edu-current-${index}`}
                                                            checked={edu.current}
                                                            onChange={(e) => handleEducationChange(index, "current", e.target.checked)}
                                                            className="w-4 h-4 text-[#9333EA] bg-[#121218] border-[#2d2d3a] rounded focus:ring-[#9333EA]"
                                                        />
                                                        <label htmlFor={`edu-current-${index}`} className="ml-2 text-sm">
                                                            I am currently studying here
                                                        </label>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm mb-1">Description</label>
                                                        <textarea
                                                            value={edu.description}
                                                            onChange={(e) => handleEducationChange(index, "description", e.target.value)}
                                                            rows="3"
                                                            className="w-full px-3 py-2 bg-[#121218] border border-[#2d2d3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent resize-none"
                                                        ></textarea>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {profileData?.education && profileData.education.length > 0 ? (
                                            profileData.education.map((edu, index) => (
                                                <div key={index} className="border-b border-[#2d2d3a] last:border-b-0 pb-6 last:pb-0">
                                                    <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                                                        <div>
                                                            <h3 className="font-bold text-lg">{edu.institution}</h3>
                                                            <p className="text-[#9333EA]">
                                                                {edu.degree}, {edu.fieldOfStudy}
                                                            </p>
                                                        </div>
                                                        <div className="text-gray-400 mt-1 md:mt-0 text-sm">
                                                            {formatDate(edu.startDate)} - {edu.current ? "Present" : formatDate(edu.endDate)}
                                                        </div>
                                                    </div>
                                                    {edu.description && <p className="mt-3 text-gray-300">{edu.description}</p>}
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-400">No education listed.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Portfolio */}
                        <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] overflow-hidden">
                            <div className="p-6 border-b border-[#2d2d3a] flex justify-between items-center">
                                <h2 className="text-xl font-bold">Portfolio</h2>
                                {isEditing && (
                                    <button
                                        type="button"
                                        onClick={handleAddPortfolio}
                                        className="flex items-center gap-1 text-sm px-3 py-1 bg-[#1e1e2d] hover:bg-[#2d2d3a] rounded-md transition-colors"
                                    >
                                        <Plus size={16} />
                                        <span>Add Project</span>
                                    </button>
                                )}
                            </div>

                            <div className="p-6">
                                {isEditing ? (
                                    <div className="space-y-4">
                                        {formData.portfolio.map((project, index) => (
                                            <div key={index} className="bg-[#1e1e2d] p-4 rounded-lg">
                                                <div className="flex justify-between items-center mb-3">
                                                    <h3 className="font-medium">Project #{index + 1}</h3>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemovePortfolio(index)}
                                                        className="text-red-400 hover:text-red-300"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>

                                                <div className="space-y-4">
                                                    <input
                                                        type="text"
                                                        value={project.title}
                                                        onChange={(e) => handlePortfolioChange(index, 'title', e.target.value)}
                                                        placeholder="Project Title"
                                                        className="w-full px-3 py-2 bg-[#121218] border border-[#2d2d3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
                                                    />
                                                    <textarea
                                                        value={project.description}
                                                        onChange={(e) => handlePortfolioChange(index, 'description', e.target.value)}
                                                        placeholder="Project Description"
                                                        rows="3"
                                                        className="w-full px-3 py-2 bg-[#121218] border border-[#2d2d3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
                                                    ></textarea>
                                                    <div className="flex gap-4">
                                                        <div className="flex-1">
                                                            <label className="block text-sm mb-1">Start Date</label>
                                                            <input
                                                                type="date"
                                                                value={project.startDate}
                                                                onChange={(e) => handlePortfolioChange(index, 'startDate', e.target.value)}
                                                                className="w-full px-3 py-2 bg-[#121218] border border-[#2d2d3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <label className="block text-sm mb-1">End Date</label>
                                                            <input
                                                                type="date"
                                                                value={project.endDate}
                                                                onChange={(e) => handlePortfolioChange(index, 'endDate', e.target.value)}
                                                                className="w-full px-3 py-2 bg-[#121218] border border-[#2d2d3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm mb-1">Project Images</label>
                                                        <div className="flex flex-wrap gap-2 mb-2">
                                                            {(project.images || []).map((image, imageIndex) => (
                                                                <div key={imageIndex} className="relative">
                                                                    <img src={image} alt={`Project ${index + 1} image ${imageIndex + 1}`} className="w-20 h-20 object-cover rounded" />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemovePortfolioImage(index, imageIndex)}
                                                                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                                                                    >
                                                                        <X size={12} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handlePortfolioImageUpload(index, e.target.files[0])}
                                                            className="w-full px-3 py-2 bg-[#121218] border border-[#2d2d3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {profileData?.portfolio && profileData.portfolio.length > 0 ? (
                                            profileData.portfolio.map((project, index) => (
                                                <div
                                                    key={index}
                                                    className="bg-[#1e1e2d] rounded-lg overflow-hidden cursor-pointer"
                                                    onClick={() => setSelectedPortfolio(project)}
                                                >
                                                    {project.images && project.images.length > 0 && (
                                                        <div className="h-48 overflow-hidden">
                                                            <img
                                                                src={project.images[0] || "https://placehold.co/400"}
                                                                alt={project.title}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = "https://placehold.co/400";
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="p-4">
                                                        <h3 className="font-bold text-lg">{project.title}</h3>
                                                        <p className="text-gray-400 text-sm mb-2">
                                                            {formatDate(project.startDate)} - {project.endDate ? formatDate(project.endDate) : "Present"}
                                                        </p>
                                                        <p className="text-gray-300 line-clamp-3">{project.description}</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-400 col-span-2">No portfolio projects listed.</p>
                                        )}
                                    </div>
                                     

                                )}

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
                                            reviews={reviews.slice(0, 5)} 
                                            loading={reviewsLoading}
                                            showJobTitles={true}
                                        />
                                        
                                        {reviews.length > 5 && (
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

                        {/* Portfolio Popup */}
{selectedPortfolio && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-[#121218] rounded-lg max-w-2xl w-full mx-4 overflow-hidden">
            <div className="p-6 border-b border-[#2d2d3a] flex justify-between items-center">
                <h2 className="text-xl font-bold">{selectedPortfolio.title}</h2>
                <button
                    onClick={() => setSelectedPortfolio(null)}
                    className="text-gray-400 hover:text-white"
                >
                    <X size={24} />
                </button>
            </div>
            <div className="p-6 max-h-[80vh] overflow-y-auto">
                {selectedPortfolio.images && selectedPortfolio.images.length > 0 && (
                    <div className="mb-6">
                        <img
                            src={selectedPortfolio.images[0]}
                            alt={selectedPortfolio.title}
                            className="w-full h-64 object-cover rounded-lg"
                        />
                    </div>
                )}
                <p className="text-gray-400 mb-4">
                    {formatDate(selectedPortfolio.startDate)} - {selectedPortfolio.endDate ? formatDate(selectedPortfolio.endDate) : "Present"}
                </p>
                <p className="text-gray-300 mb-6">{selectedPortfolio.description}</p>
                {selectedPortfolio.images && selectedPortfolio.images.length > 1 && (
                    <div>
                        <h3 className="font-bold mb-3">Project Images</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {selectedPortfolio.images.slice(1).map((image, index) => (
                                <img
                                    key={index}
                                    src={image}
                                    alt={`${selectedPortfolio.title} image ${index + 2}`}
                                    className="w-full h-32 object-cover rounded-lg"
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
)}

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
                                            <p className="text-sm text-gray-400">Total Earnings</p>
                                            <p className="text-xl font-bold mt-1">PKR {profileData?.totalEarnings?.toLocaleString() || "0"}</p>
                                        </div>

                                        <div className="bg-[#1e1e2d] p-4 rounded-lg">
                                            <p className="text-sm text-gray-400">Completed Jobs</p>
                                            <p className="text-xl font-bold mt-1">{profileData?.completedJobs || "0"}</p>
                                        </div>

                                        <div className="bg-[#1e1e2d] p-4 rounded-lg">
                                            <p className="text-sm text-gray-400">Success Rate</p>
                                            <p className="text-xl font-bold mt-1">{profileData?.successRate || "0"}%</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Information */}
                            {isOwnProfile && (
                                <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] overflow-hidden">
                                    <div className="p-6 border-b border-[#2d2d3a]">
                                        <h2 className="text-xl font-bold">Payment Information</h2>
                                    </div>
                                    <div className="p-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-300">In Progress</span>
                                                <span className="font-bold">
                                                    PKR {profileData?.payments?.inProgress?.toLocaleString() || "0"}
                                                </span>
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
                            )}

                            {/* Contact Information */}
                            {!isOwnProfile && (
                                <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] overflow-hidden">
                                    <div className="p-6 border-b border-[#2d2d3a]">
                                        <h2 className="text-xl font-bold">Contact Information</h2>
                                    </div>
                                    <div className="p-6">
                                        <div className="space-y-4">
                                            {/* <div className="flex items-start">
                                                <Mail size={18} className="text-[#9333EA] mt-1 mr-3" />
                                                <div>
                                                    <h3 className="font-medium">Email</h3>
                                                    <p className="text-gray-300 mt-1">{profileData?.email}</p>
                                                </div>
                                            </div> */}

                                            {profileData?.location && (
                                                <div className="flex items-start">
                                                    <MapPin size={18} className="text-[#9333EA] mt-1 mr-3" />
                                                    <div>
                                                        <h3 className="font-medium">Location</h3>
                                                        <p className="text-gray-300 mt-1">{profileData.location}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-6 space-y-3">
                                            <button
                                                onClick={handleHire}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#9333EA] hover:bg-[#a855f7] text-white rounded-md transition-colors"
                                            >
                                                <Briefcase size={18} />
                                                <span>Hire {profileData?.name?.split(" ")[0]}</span>
                                            </button>

                                            <button
                                                onClick={handleMessage}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1e1e2d] hover:bg-[#2d2d3a] text-white rounded-md transition-colors"
                                            >
                                                <MessageSquare size={18} />
                                                <span>Send Message</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
    );
}

export default FreelancerProfile
