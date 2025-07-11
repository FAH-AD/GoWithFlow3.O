"use client"

import { useState, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import {
  Briefcase,
  DollarSign,
  TrendingUp,
  Users,
  Search,
  Filter,
  ChevronRight,
  Clock,
  Plus,
  Star,
  MessageSquare,
  AlertTriangle,
} from "lucide-react"

import Navbar from "../components/Navbar"

// Import components
import ProjectCard from "../components/client/project-card"
import FreelancerCard from "../components/client/freelancer-card"
import BudgetChart from "../components/client/budget-chart"
import ProjectTimeline from "../components/client/project-timeline"
import { useNavigate } from "react-router-dom"
const ClientDashboard = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [userStatus, setUserStatus] = useState("")
  const [userProfile, setUserProfile] = useState(null);
  const navigate = useNavigate()
  const token = localStorage.getItem("authToken")
 

  const user = useSelector((state) => state.Auth.user)
  useEffect(() => {
    const fetchProfile = async () => {

      try {
        const response = await fetch(`http://localhost:5000/api/user-profile/${user._id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setUserStatus(data.data.user.clientVerification.status);
        setUserProfile(data.data.user);
      } catch (error) {
        console.error('Error fetching user profile:', error.message);
        // If the token is invalid, you might want to log the user out
        if (error.message.includes('401')) {
          console.log("Token seems to be invalid. Logging out.");
        }
      }
    }


    fetchProfile();
  }, [ token]);

  const renderVerificationBanner = () => {

    switch (userStatus) {
      case "not-verified":
        return (
          <div className="bg-gradient-to-r mb-4 from-[#9333EA]/20 to-[#0a0a0f] border-b border-[#2d2d3a] text-yellow-500 p-2">
            <div className="container mx-auto flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="mr-2" />
                <span>Your company is not verified. Some features may be limited.</span>
              </div>
              <button
                onClick={() => navigate("/client/verify-company")}
                className="bg-[#9333EA] text-white px-4 py-2 rounded hover:bg-gray-800"
              >
                Verify Now
              </button>
            </div>
          </div>
        )
      case "pending":
        return (
          <div className="bg-gradient-to-r mb-4 from-[#9333EA]/20 to-[#0a0a0f] border-b border-[#2d2d3a] text-blue-500 p-2">
            <div className="container mx-auto flex items-center">
              <Clock className="mr-2" />
              <span>Your verification status is pending. It will take 2-3 working days.</span>
            </div>
          </div>
        )
      case "rejected":
        return (
          <div className="bg-gradient-to-r mb-4 from-[#9333EA]/20 to-[#0a0a0f] border-b border-[#2d2d3a] text-red-500 p-2">
            <div className="container mx-auto flex items-center justify-between">
              <div className="flex items-center">
                <AlertOctagon className="mr-2" />
                <span>Your verification was rejected. Please try another way to verify your company.</span>
              </div>
              <button
                onClick={() => navigate("/verify-company")}
                className="bg-[#9333EA] text-white px-4 py-2 rounded hover:bg-gray-800"
              >
                Try Again
              </button>
            </div>
          </div>
        )
      case "verified":
        return null
      default:
        return null
    }
  }
  // Mock data - in a real app, this would come from an API
  const [stats, setStats] = useState({
    projects: { total: 0, active: 0, completed: 0 },
    budget: { total: 0, spent: 0, remaining: 0 },
    freelancers: { hired: 0, saved: 0 },
    messages: { unread: 0 },
  })

  const [projects, setProjects] = useState([])
  const [savedFreelancers, setSavedFreelancers] = useState([])

  // Simulate data loading
  useEffect(() => {
    const loadDashboardData = async () => {
      // In a real app, you would fetch this data from your API
      await new Promise((resolve) => setTimeout(resolve, 800))

      setStats({
        projects: { total: 12, active: 4, completed: 8 },
        budget: { total: 24500, spent: 18200, remaining: 6300 },
        freelancers: { hired: 7, saved: 15 },
        messages: { unread: 3 },
      })

      setProjects([
        {
          id: 1,
          title: "E-commerce Website Redesign",
          description: "Redesign of our online store with improved UX and mobile responsiveness.",
          budget: 5800,
          spent: 3200,
          deadline: "2023-08-25",
          progress: 65,
          status: "in_progress",
          freelancer: {
            name: "Alex Johnson",
            avatar: "https://randomuser.me/api/portraits/men/32.jpg",
            rating: 4.9,
          },
        },
        {
          id: 2,
          title: "Mobile App Development",
          description: "Creating a native mobile app for iOS and Android platforms.",
          budget: 8500,
          spent: 7200,
          deadline: "2023-09-15",
          progress: 85,
          status: "in_progress",
          freelancer: {
            name: "Sarah Williams",
            avatar: "https://randomuser.me/api/portraits/women/44.jpg",
            rating: 5.0,
          },
        },
        {
          id: 3,
          title: "Brand Identity Design",
          description: "Creating a new brand identity including logo, color palette, and style guide.",
          budget: 3200,
          spent: 3200,
          deadline: "2023-07-30",
          progress: 100,
          status: "completed",
          freelancer: {
            name: "Michael Chen",
            avatar: "https://randomuser.me/api/portraits/men/45.jpg",
            rating: 4.8,
          },
        },
        {
          id: 4,
          title: "Content Marketing Strategy",
          description: "Developing a comprehensive content strategy for Q3 and Q4.",
          budget: 2800,
          spent: 1400,
          deadline: "2023-08-10",
          progress: 50,
          status: "in_progress",
          freelancer: {
            name: "Emily Rodriguez",
            avatar: "https://randomuser.me/api/portraits/women/33.jpg",
            rating: 4.7,
          },
        },
      ])

      setSavedFreelancers([
        {
          id: 101,
          name: "David Wilson",
          title: "Full Stack Developer",
          avatar: "https://randomuser.me/api/portraits/men/22.jpg",
          hourlyRate: 65,
          rating: 4.9,
          reviews: 37,
          skills: ["React", "Node.js", "MongoDB", "AWS"],
          availability: "Full-time",
        },
        {
          id: 102,
          name: "Jessica Lee",
          title: "UI/UX Designer",
          avatar: "https://randomuser.me/api/portraits/women/56.jpg",
          hourlyRate: 55,
          rating: 5.0,
          reviews: 42,
          skills: ["UI Design", "UX Research", "Figma", "Adobe XD"],
          availability: "Part-time",
        },
        {
          id: 103,
          name: "Robert Taylor",
          title: "Digital Marketing Specialist",
          avatar: "https://randomuser.me/api/portraits/men/78.jpg",
          hourlyRate: 45,
          rating: 4.7,
          reviews: 28,
          skills: ["SEO", "Content Marketing", "Social Media", "Google Ads"],
          availability: "Contract",
        },
      ])

      setIsLoading(false)
    }

    loadDashboardData()
  }, [])

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

      {renderVerificationBanner()}
      {/* Client Header */}
      <div className="bg-gradient-to-r mb-4 from-[#9333EA]/20 to-[#0a0a0f] border-b border-[#2d2d3a]">
        <div className="container mb-4 mx-auto px-4 py-8">
          <div className="flex mb-4 flex-col md:flex-row md:items-center md:justify-between">
            <div className="h-[200px]  relative">
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






            <div className="mt-4 md:mt-0 flex items-center gap-3">


              <button onClick={() => navigate("/client/post-job")} className="flex items-center gap-2 bg-[#9333EA] hover:bg-[#a855f7] text-white px-4 py-2 rounded-md transition-colors">
                <Plus size={18} />
                <span>Post a Job</span>
              </button>

              <button onClick={() => navigate("/client/search-freelancers")} className="flex items-center gap-2 bg-[#1e1e2d] hover:bg-[#2d2d3a] text-white px-4 py-2 rounded-md border border-[#2d2d3a] transition-colors">
                <Users size={18} />
                <span>Find Talent</span>
              </button>
            </div>
          </div>
        </div >
      </div >

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Projects Card */}
          <div className="bg-[#121218] p-6 rounded-lg border border-[#2d2d3a] hover:border-[#9333EA]/50 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Total Projects</p>
                <h3 className="text-2xl font-bold mt-1">{stats.projects.total}</h3>
                <div className="flex items-center mt-2 text-[#9333EA] text-sm">
                  <Briefcase size={14} className="mr-1" />
                  <span>{stats.projects.active} active projects</span>
                </div>
              </div>
              <div className="bg-[#9333EA]/20 p-3 rounded-lg">
                <Briefcase size={24} className="text-[#9333EA]" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[#2d2d3a] grid grid-cols-2 gap-2">
              <div>
                <p className="text-gray-400 text-xs">Completed</p>
                <p className="font-medium">{stats.projects.completed}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Completion Rate</p>
                <p className="font-medium">{Math.round((stats.projects.completed / stats.projects.total) * 100)}%</p>
              </div>
            </div>
          </div>

          {/* Budget Card */}
          <div className="bg-[#121218] p-6 rounded-lg border border-[#2d2d3a] hover:border-[#9333EA]/50 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Total Spendings</p>
                <h3 className="text-2xl font-bold mt-1">PKR {userProfile?.totalSpent}</h3>
               
              </div>
              <div className="bg-[#9333EA]/20 p-3 rounded-lg">
                <DollarSign size={24} className="text-[#9333EA]" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[#2d2d3a]">
              {/* <div className="flex justify-between items-center text-sm mb-1">
                <span className="text-gray-400">Budget spent</span>
                <span className="font-medium">{Math.round((stats.budget.spent / stats.budget.total) * 100)}%</span>
              </div> */}
              {/* <div className="w-full h-2 bg-[#2d2d3a] rounded-full">
                <div
                  className="h-full bg-[#9333EA] rounded-full"
                  style={{ width: `${(stats.budget.spent / stats.budget.total) * 100}%` }}
                ></div>
              </div> */}
            </div>
          </div>

          {/* Freelancers Card */}
          <div className="bg-[#121218] p-6 rounded-lg border border-[#2d2d3a] hover:border-[#9333EA]/50 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Hired Freelancers</p>
                <h3 className="text-2xl font-bold mt-1">{stats.freelancers.hired}</h3>
                <div className="flex items-center mt-2 text-[#9333EA] text-sm">
                  <Users size={14} className="mr-1" />
                  <span>{stats.freelancers.saved} saved talents</span>
                </div>
              </div>
              <div className="bg-[#9333EA]/20 p-3 rounded-lg">
                <Users size={24} className="text-[#9333EA]" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[#2d2d3a] grid grid-cols-2 gap-2">
              <div>
                <p className="text-gray-400 text-xs">Avg. Rating</p>
                <div className="flex items-center">
                  <p className="font-medium mr-1">4.8</p>
                  <Star size={12} fill="#9333EA" className="text-[#9333EA]" />
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Rehire Rate</p>
                <p className="font-medium">85%</p>
              </div>
            </div>
          </div>

          {/* Timeline Card */}
          <div className="bg-[#121218] p-6 rounded-lg border border-[#2d2d3a] hover:border-[#9333EA]/50 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Upcoming Deadlines</p>
                <h3 className="text-2xl font-bold mt-1">3</h3>
                <div className="flex items-center mt-2 text-yellow-400 text-sm">
                  <Clock size={14} className="mr-1" />
                  <span>1 due this week</span>
                </div>
              </div>
              <div className="bg-[#9333EA]/20 p-3 rounded-lg">
                <Clock size={24} className="text-[#9333EA]" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[#2d2d3a]">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <MessageSquare size={14} className="mr-2 text-[#9333EA]" />
                  <p className="text-sm">Unread Messages</p>
                </div>
                <div className="bg-[#9333EA] text-white text-xs font-bold px-2 py-1 rounded-full">
                  {stats.messages.unread}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-8">
            {/* Projects Section */}
            <div className="bg-[#121218] rounded-lg border border-[#2d2d3a]">
              <div className="p-6 border-b border-[#2d2d3a]">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">My Projects</h2>
                  <button className="flex items-center gap-2 text-[#9333EA] hover:text-[#a855f7] text-sm">
                    <Plus size={16} />
                    <span>New Project</span>
                  </button>
                </div>

                {/* Search and Filter */}
                <div className="mt-4 flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-grow">
                    <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search projects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-[#1e1e2d] border border-[#2d2d3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 bg-[#1e1e2d] hover:bg-[#2d2d3a] text-white px-4 py-2 rounded-md border border-[#2d2d3a] transition-colors">
                      <Filter size={16} />
                      <span>Filter</span>
                    </button>
                    <select className="bg-[#1e1e2d] text-white px-4 py-2 rounded-md border border-[#2d2d3a] focus:outline-none focus:ring-2 focus:ring-[#9333EA]">
                      <option value="all">All Projects</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </div>

                {/* Project Tabs */}
                <div className="flex mt-4 border-b border-[#2d2d3a] overflow-x-auto">
                  <button
                    className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === "all" ? "text-[#9333EA] border-b-2 border-[#9333EA]" : "text-gray-400 hover:text-white"}`}
                    onClick={() => setActiveTab("all")}
                  >
                    All Projects
                  </button>
                  <button
                    className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === "active" ? "text-[#9333EA] border-b-2 border-[#9333EA]" : "text-gray-400 hover:text-white"}`}
                    onClick={() => setActiveTab("active")}
                  >
                    Active
                  </button>
                  <button
                    className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === "completed" ? "text-[#9333EA] border-b-2 border-[#9333EA]" : "text-gray-400 hover:text-white"}`}
                    onClick={() => setActiveTab("completed")}
                  >
                    Completed
                  </button>
                  <button
                    className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === "draft" ? "text-[#9333EA] border-b-2 border-[#9333EA]" : "text-gray-400 hover:text-white"}`}
                    onClick={() => setActiveTab("draft")}
                  >
                    Draft
                  </button>
                </div>
              </div>

              {/* Project Cards */}
              <div className="p-4 grid gap-4">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}

                {projects.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No projects found.</p>
                    <button className="mt-4 bg-[#9333EA] hover:bg-[#a855f7] text-white px-4 py-2 rounded-md transition-colors">
                      Create New Project
                    </button>
                  </div>
                )}
              </div>

              {/* View All Projects Button */}
              <div className="p-4 border-t border-[#2d2d3a] flex justify-center">
                <a
                  href="/client/projects"
                  className="flex items-center gap-2 bg-[#1e1e2d] hover:bg-[#2d2d3a] text-white px-6 py-2 rounded-md border border-[#2d2d3a] transition-colors"
                >
                  <span>View All Projects</span>
                  <ChevronRight size={16} />
                </a>
              </div>
            </div>

            {/* Budget Overview */}

          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-8">

          <div className="bg-[#121218] rounded-lg border border-[#2d2d3a]">
              <div className="p-6 border-b border-[#2d2d3a]">
                <h2 className="text-xl font-bold">Quick Actions</h2>
              </div>

              <div className="p-4 grid grid-cols-2 gap-4">
                <button onClick={() => navigate("/client/post-job")} className="flex flex-col items-center justify-center bg-[#1e1e2d] hover:bg-[#2d2d3a] p-4 rounded-lg transition-colors">
                  <Plus size={24} className="text-[#9333EA] mb-2" />
                  <span className="text-sm">Post a Job</span>
                </button>
                <button onClick={() => navigate("/client/search-freelancers")} className="flex flex-col items-center justify-center bg-[#1e1e2d] hover:bg-[#2d2d3a] p-4 rounded-lg transition-colors">
                  <Users size={24} className="text-[#9333EA] mb-2" />
                  <span className="text-sm">Find Talent</span>
                </button>
                <button onClick={() => navigate("/client/messages")} className="flex flex-col items-center justify-center bg-[#1e1e2d] hover:bg-[#2d2d3a] p-4 rounded-lg transition-colors">
                  <MessageSquare size={24} className="text-[#9333EA] mb-2" />
                  <span className="text-sm">Messages</span>
                </button>
                <button onClick={() => navigate("/client/my-jobs")} className="flex flex-col items-center justify-center bg-[#1e1e2d] hover:bg-[#2d2d3a] p-4 rounded-lg transition-colors">
                  <Briefcase size={24} className="text-[#9333EA] mb-2" />
                  <span className="text-sm">My Jobs</span>
                </button>
              </div>
            </div>
            {/* Project Timeline */}
            <div className="bg-[#121218] rounded-lg border border-[#2d2d3a]">
              <div className="p-6 border-b border-[#2d2d3a]">
                <h2 className="text-xl font-bold">Project Timeline</h2>
              </div>

              <div className="p-6">
                <ProjectTimeline projects={projects} />
              </div>
            </div>

            {/* Saved Freelancers */}
            

            {/* Quick Actions */}
            



          </div>
        </div>
      </div>
    </div >
  )
}

export default ClientDashboard
