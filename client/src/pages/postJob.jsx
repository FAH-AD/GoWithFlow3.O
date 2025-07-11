"use client";

import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  DollarSign,
  FileText,
  Paperclip,
  Users,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import Navbar from "../components/Navbar";

// Form steps component imports
import BasicDetails from "../components/job-form/basic-details";
import SkillsRequirements from "../components/job-form/skills-requirements";
import BudgetTimeline from "../components/job-form/budget-timeline";
import AttachmentsVisibility from "../components/job-form/attachments-visibility";
import JobPreview from "../components/job-form/job-preview";
import { uploadFile } from "../services/fileUpload";

const PostJob = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.Auth.user);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const token = localStorage.getItem("authToken"); // Assuming token is stored in localStorage
  const [userStatus, setUserStatus] = useState("");

  // Form data state
  const [jobData, setJobData] = useState({
    title: "",
    description: "",
    subCategory: "Web Development",
    skills: [],
    budget: 0,
    deadline: "",
    duration: "1-3-months",
    experienceLevel: "intermediate",
    location: "remote",
    attachments: [],
    isPromoted: false,
    isPublic: true,
    invitedFreelancers: [],
    isCrowdsourced: false,
    crowdsourcingRoles: [],
  });

  // Check if user is authorized (client role)
  useEffect(() => {
    if (!user) {
      navigate("/login", {
        state: {
          from: "/client/post-job",
          message: "Please login to post a job",
        },
      });
    } else if (user.role !== "client") {
      navigate("/", { state: { message: "Only clients can post jobs" } });
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/user-profile/${user._id}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setUserStatus(data.data.user.clientVerification.status);
        setUserProfile(data.data.user);
      } catch (error) {
        console.error("Error fetching user profile:", error.message);
        // If the token is invalid, you might want to log the user out
        if (error.message.includes("401")) {
          console.log("Token seems to be invalid. Logging out.");
        }
      }
    };

    fetchProfile();
  }, [token]);

  const renderVerificationBanner = () => {
    switch (userStatus) {
      case "not-verified":
        return (
          <div className="bg-gradient-to-r mb-4 from-[#9333EA]/20 to-[#0a0a0f] border-b border-[#2d2d3a] text-yellow-500 p-2">
            <div className="container mx-auto flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="mr-2" />
                <span>
                  Your company is not verified. Some features may be limited.
                </span>
              </div>
              <button
                onClick={() => navigate("/client/verify-company")}
                className="bg-[#9333EA] text-white px-4 py-2 rounded hover:bg-gray-800"
              >
                Verify Now
              </button>
            </div>
          </div>
        );
      case "pending":
        return (
          <div className="bg-gradient-to-r mb-4 from-[#9333EA]/20 to-[#0a0a0f] border-b border-[#2d2d3a] text-blue-500 p-2">
            <div className="container mx-auto flex items-center">
              <Clock className="mr-2" />
              <span>
                Your verification status is pending. It will take 2-3 working
                days.
              </span>
            </div>
          </div>
        );
      case "rejected":
        return (
          <div className="bg-gradient-to-r mb-4 from-[#9333EA]/20 to-[#0a0a0f] border-b border-[#2d2d3a] text-red-500 p-2">
            <div className="container mx-auto flex items-center justify-between">
              <div className="flex items-center">
                <AlertOctagon className="mr-2" />
                <span>
                  Your verification was rejected. Please try another way to
                  verify your company.
                </span>
              </div>
              <button
                onClick={() => navigate("/verify-company")}
                className="bg-[#9333EA] text-white px-4 py-2 rounded hover:bg-gray-800"
              >
                Try Again
              </button>
            </div>
          </div>
        );
      case "verified":
        return null;
      default:
        return null;
    }
  };

  // Handle form data changes
  const handleChange = (field, value) => {
    setJobData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Validate form data before submission
  const validateJobData = () => {
    // Basic validation
    if (!jobData.title.trim()) return "Job title is required";
    if (!jobData.description.trim()) return "Job description is required";
    if (jobData.skills.length === 0) return "At least one skill is required";
    if (!jobData.budget || jobData.budget <= 0)
      return "Valid budget is required";
    if (!jobData.deadline) return "Deadline is required";

    // Validate crowdsourcing roles if enabled
    if (jobData.isCrowdsourced) {
      if (
        !jobData.crowdsourcingRoles ||
        jobData.crowdsourcingRoles.length === 0
      ) {
        return "At least one role is required for crowdsourcing";
      }

      for (let i = 0; i < jobData.crowdsourcingRoles.length; i++) {
        const role = jobData.crowdsourcingRoles[i];
        if (!role.title.trim()) return `Role #${i + 1}: Title is required`;
        if (!role.description.trim())
          return `Role #${i + 1}: Description is required`;
        if (role.skills.length === 0)
          return `Role #${i + 1}: At least one skill is required`;
        if (!role.budget || role.budget <= 0)
          return `Role #${i + 1}: Valid budget is required`;
      }
    }

    return null;
  };

  // Handle form submission
  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    // Validate form data
    const validationError = validateJobData();
    if (validationError) {
      setError(validationError);
      setIsLoading(false);
      return;
    }

    try {
      // Prepare form data for API
      const formDataToSend = new FormData();

      // Add basic job data
      Object.keys(jobData).forEach((key) => {
        if (key === "skills") {
          jobData.skills.forEach((skill, index) => {
            formDataToSend.append(`skills[${index}]`, skill);
          });
        } else if (key !== "attachments" && key !== "crowdsourcingRoles") {
          formDataToSend.append(
            key,
            typeof jobData[key] === "object"
              ? JSON.stringify(jobData[key])
              : jobData[key]
          );
        }
      });

      // Add crowdsourcing roles as JSON
      if (jobData.isCrowdsourced && jobData.crowdsourcingRoles.length > 0) {
        jobData.crowdsourcingRoles.forEach((role, index) => {
          Object.keys(role).forEach((key) => {
            if (key === "skills") {
              // Append each skill separately
              role.skills.forEach((skill, skillIndex) => {
                formDataToSend.append(
                  `crowdsourcingRoles[${index}][skills][${skillIndex}]`,
                  skill
                );
              });
            } else {
              formDataToSend.append(
                `crowdsourcingRoles[${index}][${key}]`,
                role[key]
              );
            }
          });
        });
      }

      // Add attachments
      if (jobData.attachments && jobData.attachments.length > 0) {
        const uploadPromises = jobData.attachments.map((file) =>
          uploadFile(file)
        );
        const uploadedUrls = await Promise.all(uploadPromises);

        uploadedUrls.forEach((url, index) => {
          formDataToSend.append(`attachments[${index}]`, url);
        });
      }

      // Send data to API
      const response = await fetch("http://localhost:5000/api/jobs", {
        method: "POST",
        body: formDataToSend,
        headers: {
          // Don't set Content-Type when using FormData, browser will set it automatically with boundary
          Authorization: `Bearer ${token}`, // Assuming token is stored in localStorage
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to post job");
      }

      // Show success message
      setSuccess(true);

      // Reset form after success
      setTimeout(() => {
        navigate("/client", { state: { message: "Job posted successfully!" } });
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to post job. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Steps configuration
  const steps = [
    { id: 1, name: "Basic Details", icon: FileText },
    { id: 2, name: "Skills & Requirements", icon: Users },
    { id: 3, name: "Budget & Timeline", icon: DollarSign },
    { id: 4, name: "Attachments", icon: Paperclip },
    { id: 5, name: "Preview & Post", icon: CheckCircle },
  ];

  // Next step handler
  const handleNextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  // Previous step handler
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <BasicDetails jobData={jobData} handleChange={handleChange} />;
      case 2:
        return (
          <SkillsRequirements jobData={jobData} handleChange={handleChange} />
        );
      case 3:
        return <BudgetTimeline jobData={jobData} handleChange={handleChange} />;
      case 4:
        return (
          <AttachmentsVisibility
            jobData={jobData}
            handleChange={handleChange}
          />
        );
      case 5:
        return <JobPreview jobData={jobData} />;
      default:
        return null;
    }
  };

  // Check if current step is valid
  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return (
          jobData.title.trim().length > 0 &&
          jobData.description.trim().length > 0
        );
      case 2:
        return jobData.skills.length > 0;
      case 3:
        // Additional validation for crowdsourcing
        if (jobData.isCrowdsourced) {
          return (
            jobData.budget > 0 &&
            jobData.deadline &&
            jobData.crowdsourcingRoles.length > 0 &&
            jobData.crowdsourcingRoles.every(
              (role) =>
                role.title.trim() &&
                role.description.trim() &&
                role.skills.length > 0 &&
                role.budget > 0
            )
          );
        }
        return jobData.budget > 0 && jobData.deadline;
      case 4:
        return true; // No required fields in this step
      case 5:
        return true; // Preview step
      default:
        return false;
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="bg-[#121218] p-8 rounded-lg border border-[#2d2d3a] max-w-md w-full text-center">
          <div className="mx-auto w-16 h-16 bg-[#9333EA]/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle size={32} className="text-[#9333EA]" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Job Posted Successfully!</h2>
          <p className="text-gray-400 mb-6">
            Your job has been posted and is now visible to freelancers.
          </p>
          <div className="animate-pulse">
            <p className="text-sm text-gray-400">Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-12">
      <Navbar />
      {renderVerificationBanner()}
      {/* Header */}
      <div className="bg-gradient-to-r mb-6 h-[200px] from-[#9333EA]/20 to-[#0a0a0f] border-b border-[#2d2d3a] flex items-center">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full">
            <div>
              <div className="flex items-center">
                <Briefcase className="text-[#9333EA] mr-2" size={24} />
                <h1 className="text-2xl md:text-3xl font-bold">
                  Post a New Job
                </h1>
              </div>
              <p className="text-gray-400 mt-1">
                Find the perfect freelancer for your project
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <button
                onClick={() => navigate("/client")}
                className="flex items-center gap-2 bg-[#1e1e2d] hover:bg-[#2d2d3a] text-white px-4 py-2 rounded-md border border-[#2d2d3a] transition-colors"
              >
                <ArrowLeft size={18} />
                <span>Back to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Steps Progress */}
        <div className="mb-8">
          <div className="hidden md:flex items-center justify-center">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    currentStep >= step.id ? "bg-[#9333EA]" : "bg-[#2d2d3a]"
                  } transition-colors duration-300`}
                >
                  <step.icon size={18} className="text-white" />
                </div>
                <div
                  className={`text-sm font-medium mx-2 ${
                    currentStep >= step.id ? "text-white" : "text-gray-400"
                  } transition-colors duration-300`}
                >
                  {step.name}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 h-1 ${
                      currentStep > step.id ? "bg-[#9333EA]" : "bg-[#2d2d3a]"
                    } transition-colors duration-300`}
                  ></div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile Steps Display */}
          <div className="md:hidden">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <div className="bg-[#9333EA] w-8 h-8 rounded-full flex items-center justify-center mr-2">
                  {steps[currentStep - 1].icon &&
                    React.createElement(steps[currentStep - 1].icon, {
                      size: 16,
                      className: "text-white",
                    })}
                </div>
                <span className="font-medium">
                  Step {currentStep}: {steps[currentStep - 1].name}
                </span>
              </div>
              <span className="text-gray-400 text-sm">
                {currentStep}/{steps.length}
              </span>
            </div>
            <div className="w-full bg-[#2d2d3a] h-2 rounded-full">
              <div
                className="bg-[#9333EA] h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-md flex items-center">
            <AlertTriangle size={20} className="text-red-400 mr-2" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Form Content */}
        <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] mb-8">
          <div className="p-6 border-b border-[#2d2d3a]">
            <h2 className="text-xl font-bold">{steps[currentStep - 1].name}</h2>
            <p className="text-gray-400 mt-1">
              {currentStep === 1 && "Provide basic information about your job"}
              {currentStep === 2 &&
                "Specify the skills and requirements for your job"}
              {currentStep === 3 && "Set your budget and timeline expectations"}
              {currentStep === 4 &&
                "Upload relevant files and set visibility options"}
              {currentStep === 5 && "Review your job posting before publishing"}
            </p>
          </div>

          <div className="p-6">{renderStepContent()}</div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevStep}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 px-6 py-3 rounded-md transition-colors ${
              currentStep === 1
                ? "bg-[#1e1e2d] text-gray-500 cursor-not-allowed"
                : "bg-[#1e1e2d] hover:bg-[#2d2d3a] text-white"
            }`}
          >
            <ArrowLeft size={18} />
            <span>Previous</span>
          </button>

          {currentStep < steps.length ? (
            <button
              onClick={handleNextStep}
              disabled={!isStepValid()}
              className={`flex items-center gap-2 px-6 py-3 rounded-md transition-colors ${
                isStepValid()
                  ? "bg-[#9333EA] hover:bg-[#a855f7] text-white"
                  : "bg-[#9333EA]/50 text-white/70 cursor-not-allowed"
              }`}
            >
              <span>Next</span>
              <ArrowRight size={18} />
            </button>
          ) : (
            <div className="relative group">
              <button
                onClick={handleSubmit}
                disabled={
                  isLoading ||
                  userStatus === "not-verified" ||
                  userStatus === "pending"
                }
                className={`flex items-center gap-2 px-6 py-3 rounded-md transition-colors ${
                  isLoading ||
                  userStatus === "not-verified" ||
                  userStatus === "pending"
                    ? "bg-[#9333EA]/50 text-white/70 cursor-not-allowed"
                    : "bg-[#9333EA] hover:bg-[#a855f7] text-white"
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <span>Post Job</span>
                    <CheckCircle size={18} />
                  </>
                )}
              </button>
              {(userStatus === "not-verified" || userStatus === "pending") && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                  Verify your account to continue
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostJob;
