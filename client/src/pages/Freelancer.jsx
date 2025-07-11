"use client"

import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import axios from "axios" // Make sure to import axios
import {
  Briefcase,
  Calendar,
  ChevronRight,
  Clock,
  DollarSign,
  Star,
  TrendingUp,
  Users,
  ArrowUpRight,
  Search,
  Bell,
} from "lucide-react"
import { toast } from "react-hot-toast"; // Ensure you have react-toastify installed

// Import components
import JobCard from "../components/job-card"
import ProjectCard from "../components/project-card"
import EarningsChart from "../components/earnings-chart"
import ProfileCompletion from "../components/profile-completion"
import Navbar from "../components/Navbar"

const Freelancer = () => {
  const user = useSelector((state) => state.Auth.user)
  const [activeTab, setActiveTab] = useState("recommended")
  const [isLoading, setIsLoading] = useState(true)
 const [isJobsLoading, setIsJobsLoading] = useState(true)
 const token = localStorage.getItem("authToken")
 // Mock data - in a real app, this would come from an API
 const [stats, setStats] = useState({
   earnings: { total: 0, thisMonth: 0, pending: 0 },
   jobs: { completed: 0, active: 0, proposals: 0 },
   profileViews: 0,
   profileCompleteness: 0,
   unreadMessages: 0,
 })

 const [recommendedJobs, setRecommendedJobs] = useState([])
 const [activeProjects, setActiveProjects] = useState([])

 // Simulate data loading
 useEffect(() => {
   const loadDashboardData = async () => {
     // In a real app, you would fetch this data from your API
     await new Promise((resolve) => setTimeout(resolve, 800))

     setStats({
       earnings: { total: 12580, thisMonth: 2340, pending: 750 },
       jobs: { completed: 24, active: 3, proposals: 5 },
       profileViews: 142,
       profileCompleteness: 85,
       unreadMessages: 3,
     })

     setActiveProjects([
       {
         id: 101,
         title: "Social Media Dashboard",
         client: "Marketing Experts Ltd.",
         deadline: "Aug 15, 2023",
         progress: 75,
         budget: 1800,
         messages: 2,
         status: "in_progress",
       },
       {
         id: 102,
         title: "E-commerce Product Page Redesign",
         client: "Fashion Outlet",
         deadline: "Aug 22, 2023",
         progress: 40,
         budget: 1200,
         messages: 0,
         status: "in_progress",
       },
       {
         id: 103,
         title: "API Integration for Payment System",
         client: "FinTech Startup",
         deadline: "Aug 10, 2023",
         progress: 90,
         budget: 2500,
         messages: 1,
         status: "review",
       },
     ])

     setIsLoading(false)
   }

   loadDashboardData()
 }, [])

 // Fetch job data
 useEffect(() => {
   const fetchJobs = async () => {
     setIsJobsLoading(true)
     try {
       const response = await axios.get("http://localhost:5000/api/jobs", {
         headers: {
           'Authorization': `Bearer ${token}`
         }
       });
       console.log("Jobs response:", response.data)
       const jobs = response.data.data.map(job => ({
         id: job._id,
         title: job.title,
         description: job.description,
         budget: `${job.budget}`,
         duration: job.duration,
         skills: job.skills,
         postedAt: new Date(job.createdAt).toLocaleString(),
         client: {
           name: job.client?.name || 'Unknown',
          profileImage: job.client?.profileImage || 'https://via.placeholder.com/150',
          companyName: job.client?.companyName || 'Unknown',
           totalSpent: job.client?.totalSpent || 0,
         },
         matchScore: job.skillMatchPercentage, // Random score between 80-100
         isSaved: job.isSaved || false, 
         hasApplied: job.hasApplied || false,
       }))
       setRecommendedJobs(jobs)
     } catch (error) {
       console.error("Error fetching jobs:", error)
     } finally {
       setIsJobsLoading(false)
     }
   }

   fetchJobs()
 }, [token])

 const saveJob = async (jobId) => {
  try {
    await axios.post(`http://localhost:5000/api/jobs/${jobId}/save`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    toast.success('Job saved successfully');
    // Update the job in the state
    setRecommendedJobs(prevJobs => 
      prevJobs.map(job => 
        job.id === jobId ? { ...job, isSaved: true } : job
      )
    );
  } catch (error) {
    console.error("Error saving job:", error);
    toast.error('Failed to save job');
  }
};

const unsaveJob = async (jobId) => {
  try {
    await axios.delete(`http://localhost:5000/api/jobs/${jobId}/unsave`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    toast.success('Job unsaved successfully');
    // Update the job in the state
    setRecommendedJobs(prevJobs => 
      prevJobs.map(job => 
        job.id === jobId ? { ...job, isSaved: false } : job
      )
    );
  } catch (error) {
    console.error("Error unsaving job:", error);
    toast.error('Failed to unsave job');
  }
};

 if (isLoading) {
   return (
     <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
       <div className="flex flex-col items-center">
         <div className="w-16 h-16 border-4 border-[#9333EA] border-t-transparent rounded-full animate-spin"></div>
         <p className="mt-4 text-white">Loading your dashboard...</p>
       </div>
     </div>
   )
 }

 return (
   <div className="min-h-screen bg-[#0a0a0f] text-white pb-12">
     <Navbar />
     {/* Welcome Header */}
     <div className="bg-gradient-to-r from-[#9333EA]/20 to-[#0a0a0f] border-b mb-4 border-[#2d2d3a]">
       <div className="container mx-auto px-4 py-8">
         <div className="flex flex-col md:flex-row md:items-center md:justify-between">
           <div className="h-[200px] relative">
             {/* Animated decorative elements */}
             <div className="absolute -top-4 -left-4 w-20 h-20 rounded-full bg-[#9333EA]/10 blur-xl animate-pulse"></div>
             <div className="absolute bottom-10 right-10 w-16 h-16 rounded-full bg-[#6366F1]/10 blur-xl animate-pulse" style={{ animationDelay: "1s" }}></div>

             {/* Animated greeting text */}
             <div className="relative z-10">
               <div className="overflow-hidden">
                 <h1
                   className=" md:text-[3.5rem] h-full font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-[#9333EA] to-white animate-gradient"
                   style={{
                     animation: "gradient 3s ease infinite",
                     backgroundSize: "200% auto"
                   }}
                 >
                   Welcome back, {user?.name || "Freelancer"}
                 </h1>
               </div>

               <div className="flex items-center mt-3 space-x-2">

                 <p className="text-gray-400">
                   {new Date().toLocaleDateString("en-US", {
                     weekday: "long",
                     year: "numeric",
                     month: "long",
                     day: "numeric",
                   })}
                 </p>
               </div>


             </div>

             <style jsx>{`
   @keyframes gradient {
     0% { background-position: 0% 50%; }
     50% { background-position: 100% 50%; }
     100% { background-position: 0% 50%; }
   }
 `}</style>
           </div>


         </div>
       </div>
     </div>

     <div className="container mx-auto px-4 py-8">
       {/* Stats Overview */}

       {/* Main Content - Two Column Layout */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Left Column - 2/3 width */}
         <div className="lg:col-span-2 space-y-8">
           {/* Jobs Section */}
           <div className="bg-[#121218] rounded-lg border border-[#2d2d3a]">
             <div className="p-6 border-b border-[#2d2d3a]">
               <div className="flex items-center justify-between">
                 <h2 className="text-xl font-bold">Jobs For You</h2>
                 
               </div>

               {/* Job Tabs */}
               <div className="flex mt-4 border-b border-[#2d2d3a]">
                
                 {/* <button
                   className={`px-4 py-2 text-sm font-medium ${activeTab === "saved" ? "text-[#9333EA] border-b-2 border-[#9333EA]" : "text-gray-400 hover:text-white"}`}
                   onClick={() => setActiveTab("saved")}
                 >
                   Saved Jobs
                 </button> */}
                
               </div>
             </div>

             {/* Job Listings */}
             <div className="p-4">
               {isJobsLoading ? (
                 <div className="flex justify-center items-center h-40">
                   <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#9333EA]"></div>
                 </div>
               ) : recommendedJobs.length > 0 ? (
                 recommendedJobs.map((job) => (
                   <JobCard key={job.id} job={job}  onSave={() => saveJob(job.id)}
                   onUnsave={() => unsaveJob(job.id)}  saveJob={saveJob} unsaveJob={unsaveJob} />
                 ))
               ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No jobs found matching your skills.</p>
                  </div>
                )}
              </div>

              {/* Search Jobs Button */}
              <div className="p-4 border-t border-[#2d2d3a] flex justify-center">
                <button className="flex items-center gap-2 bg-[#1e1e2d] hover:bg-[#2d2d3a] text-white px-6 py-2 rounded-md border border-[#2d2d3a] transition-colors">
                  <Search size={16} />
                  <span>Search More Jobs</span>
                </button>
              </div>
            </div>

            {/* Active Projects Section */}

          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-8">
            {/* Profile Completion Card */}
            <div className="bg-[#121218] rounded-lg border border-[#2d2d3a]">
              <div className="p-6 border-b border-[#2d2d3a]">
                <h2 className="text-xl font-bold">Complete Your Profile</h2>
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium">Profile Completeness</p>
                </div>

                

                <ProfileCompletion userId={user._id} />

                
              </div>
            </div>

            {/* Earnings Chart */}
           

            {/* Upcoming Deadlines */}
            {/* <div className="bg-[#121218] rounded-lg border border-[#2d2d3a]">
              <div className="p-6 border-b border-[#2d2d3a]">
                <h2 className="text-xl font-bold">Upcoming Deadlines</h2>
              </div>

              <div className="p-4">
                <div className="space-y-4">
                  {activeProjects.slice(0, 2).map((project) => (
                    <div key={`deadline-${project.id}`} className="flex items-center p-3 bg-[#1e1e2d] rounded-lg">
                      <div className="bg-[#9333EA]/20 p-2 rounded-lg mr-4">
                        <Calendar size={20} className="text-[#9333EA]" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{project.title}</h4>
                        <p className="text-gray-400 text-xs">Due {project.deadline}</p>
                      </div>
                      <div
                        className={`px-2 py-1 rounded-md text-xs font-medium ${new Date(project.deadline) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
                            ? "bg-red-900/20 text-red-400"
                            : "bg-green-900/20 text-green-400"
                          }`}
                      >
                        {new Date(project.deadline) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
                          ? "Urgent"
                          : "On Track"}
                      </div>
                    </div>
                  ))}
                </div>

                <a
                  href="/freelancer/projects"
                  className="block text-center text-[#9333EA] hover:text-[#a855f7] text-sm mt-4"
                >
                  View All Deadlines
                </a>
              </div>
            </div> */}


          </div>
        </div>
      </div>
    </div>
  )
}

export default Freelancer
