"use client"

import { useState } from "react"
import { Edit, Check, X, Upload } from "lucide-react"
import { motion } from "framer-motion"

const ProfileHeader = ({ user, isEditing, onEdit, onSave, onCancel, onImageChange, isOwnProfile, isSaving,isUploading }) => {
  const [imagePreview, setImagePreview] = useState(user?.profilePic || null)
  const [dragActive, setDragActive] = useState(false)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
        onImageChange(file)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
        onImageChange(file)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="bg-gradient-to-r from-[#9333EA]/20 to-[#0a0a0f] border-b border-[#2d2d3a] py-8 mb-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Profile Image */}
          <div className="relative">
            {isEditing ? (
              <div
                className={`w-32 h-32 rounded-full overflow-hidden border-2 ${dragActive ? "border-[#9333EA]" : "border-[#2d2d3a]"
                  } flex items-center justify-center cursor-pointer relative`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById("profile-image-upload").click()}
              >
                {imagePreview ? (
                  <img
                    src={imagePreview || "https://res.cloudinary.com/dxmeatsae/image/upload/v1745772539/client_verification_docs/mhpbkpi3vnkejxe0kpai.png"}
                    alt={user?.name || "Profile"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#1e1e2d] flex items-center justify-center">
                    <span className="text-4xl"></span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  {isUploading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
                  ) : (
                    <Upload size={24} className="text-white" />
                  )}
                </div>
                <input
                  type="file"
                  id="profile-image-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-[#2d2d3a]">
                {user?.profilePic ? (
                  <img
                    src={user.profilePic || "https://res.cloudinary.com/dxmeatsae/image/upload/v1745772539/client_verification_docs/mhpbkpi3vnkejxe0kpai.png"}
                    alt={user.name || "Profile"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#1e1e2d] flex items-center justify-center">
                    <span className="text-4xl"></span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold">{user?.name || "User Name"}</h1>
            <p className="text-gray-400 mt-1">
              {user?.role === "client"
                ? `${user?.companyName || "Company"} • ${user?.industry || "Industry"}`
                : user?.title || "Professional Title"}
            </p>
            <div className="flex flex-wrap gap-2 mt-2 justify-center md:justify-start">
              <span className="bg-[#2d2d3a] text-white px-3 py-1 rounded-full text-sm">
                {user?.role === "client" ? "Client" : "Freelancer"}
              </span>
              {user?.location && (
                <span className="bg-[#2d2d3a] text-white px-3 py-1 rounded-full text-sm">{user.location}</span>
              )}
              {user?.role === "freelancer" && user?.availability && (
                <span className="bg-[#2d2d3a] text-white px-3 py-1 rounded-full text-sm">
                  {user.availability.charAt(0).toUpperCase() + user.availability.slice(1).replace("-", " ")}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {isOwnProfile && (
            <div className="flex gap-2">
              {isEditing ? (
                <>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onSave}
                    className="flex items-center gap-2 px-4 py-2 bg-[#9333EA] hover:bg-[#a855f7] text-white rounded-md transition-colors"
                  >


                    {isSaving ? (
                      <>
                       
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        <span>Save</span>
                      </>
                    )}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onCancel}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1e1e2d] hover:bg-[#2d2d3a] text-white rounded-md transition-colors"
                  >
                    <X size={18} />
                    <span>Cancel</span>
                  </motion.button>
                </>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1e1e2d] hover:bg-[#2d2d3a] text-white rounded-md transition-colors"
                >
                  <Edit size={18} />
                  <span>Edit Profile</span>
                </motion.button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfileHeader
