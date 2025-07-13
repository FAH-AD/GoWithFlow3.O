"use client"

import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import {
  Users,
  Briefcase,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Search,
  Filter,
  ChevronRight,
  Shield,
  Settings,
  BarChart3,
  UserPlus,
  FileText,
  Bell,
} from "lucide-react"
import Navbar from "../components/Navbar"
import { adminApi } from "../services/adminApi"

// Import components
import UserTable from "../components/admin/user-table"
import RevenueChart from "../components/admin/revenue-chart"
import ActivityLog from "../components/admin/activity-log"
import PlatformStatus from "../components/admin/platform-status"

const AdminDashboard = () => {
  const user = useSelector((state) => state.Auth.user)
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Check user authorization
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login', { state: { from: '/admin', message: 'Please login as admin to access this page' } });
      return;
    }
  }, [user, navigate]);

  // Mock data - in a real app, this would come from an API
  const [stats, setStats] = useState({
    users: { total: 0, new: 0, active: 0 },
    projects: { total: 0, active: 0, completed: 0 },
    revenue: { total: 0, thisMonth: 0, pending: 0 },
    issues: { open: 0, critical: 0, resolved: 0 },
  })

  const [recentUsers, setRecentUsers] = useState([])
  const [activityLogs, setActivityLogs] = useState([])
  const [platformStatus, setPlatformStatus] = useState(null)
  const [revenueData, setRevenueData] = useState(null)
  const [error, setError] = useState(null)

  // Load dashboard data from API
  useEffect(() => {
    // Only load data if user is authenticated and is admin
    if (!user || user.role !== 'admin') {
      return;
    }

    const loadDashboardData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch dashboard stats
        const dashboardResponse = await adminApi.getDashboardStats()
        if (dashboardResponse.data.success) {
          const { userStats, jobStats, paymentStats } = dashboardResponse.data.data
          console.log(dashboardResponse.data.data);
          // Store revenue data for the chart
          setRevenueData(paymentStats)
          
          // Calculate current month revenue
          const currentMonth = new Date().getMonth() + 1;
          const currentMonthRevenue = paymentStats.monthlyRevenue 
            ? paymentStats.monthlyRevenue.find(month => month.month === currentMonth)?.revenue || 0 
            : 0;
          
          setStats({
            users: {
              total: userStats.totalUsers,
              new: userStats.newUsersThisMonth,
              active: userStats.totalUsers - userStats.totalAdmins, // Approximate active users
            },
            projects: {
              total: jobStats.totalJobs,
              active: jobStats.openJobs + jobStats.inProgressJobs,
              completed: jobStats.completedJobs,
            },
            revenue: {
              total: paymentStats.totalAmount,
              thisMonth: currentMonthRevenue,
              pending: Math.round(paymentStats.totalAmount * 0.03), // Approximate
            },
            issues: {
              open: Math.floor(Math.random() * 30) + 10, // Mock data for now
              critical: Math.floor(Math.random() * 5) + 1,
              resolved: Math.floor(Math.random() * 200) + 150,
            },
          })
        }

        // Fetch recent users
        const usersResponse = await adminApi.getRecentUsers(5)
        if (usersResponse.data.success) {
          setRecentUsers(usersResponse.data.data.users)
        }

        // Fetch activity logs
        const logsResponse = await adminApi.getActivityLogs({ limit: 5 })
        if (logsResponse.data.success) {
          setActivityLogs(logsResponse.data.data.logs)
        }

        // Fetch platform status
        const statusResponse = await adminApi.getPlatformStatus()
        if (statusResponse.data.success) {
          setPlatformStatus(statusResponse.data.data)
        }

        // Fetch issue stats
        let issueStats = { open: 0, critical: 0, resolved: 0 };
        try {
          const issueResponse = await adminApi.getIssueStats();
          if (issueResponse.data.success) {
            const data = issueResponse.data.data;
            issueStats = {
              open: data.openIssues,
              critical: data.priorityBreakdown?.find(p => p._id === 'urgent')?.count || 0,
              resolved: data.resolvedIssues,
            };
          }
        } catch (issueError) {
          console.log('Issue stats not available yet');
        }

        // Update stats with issue data
        setStats(prevStats => ({
          ...prevStats,
          issues: issueStats,
        }));

      } catch (error) {
        console.error('Error loading dashboard data:', error)
        setError('Failed to load dashboard data. Please try again.')
        
        // Fallback to mock data
        setStats({
          users: { total: 5842, new: 124, active: 3218 },
          projects: { total: 8976, active: 1432, completed: 7544 },
          revenue: { total: 428950, thisMonth: 42680, pending: 12450 },
          issues: { open: 24, critical: 3, resolved: 189 },
        })

        setRecentUsers([
          {
            id: 1,
            name: "Emma Thompson",
            email: "emma@example.com",
            role: "freelancer",
            joined: "2023-07-28",
            status: "active",
            avatar: "https://ui-avatars.com/api/?name=Emma+Thompson&background=9333EA&color=fff",
          },
          {
            id: 2,
            name: "Michael Chen",
            email: "michael@techcorp.com",
            role: "client",
            joined: "2023-07-29",
            status: "active",
            avatar: "https://ui-avatars.com/api/?name=Michael+Chen&background=9333EA&color=fff",
          },
        ])

        setActivityLogs([
          {
            id: 1,
            user: "System",
            action: "Maintenance scheduled for August 15, 2023",
            timestamp: "2023-08-01T09:15:00",
            type: "system",
          },
          {
            id: 2,
            user: "Emma Thompson",
            action: "Reported an issue with payment processing",
            timestamp: "2023-08-01T08:42:00",
            type: "issue",
          },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [user])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-[#9333EA] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-white">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
        <div className="flex flex-col items-center text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mb-4" />
          <p className="text-white text-xl mb-2">Failed to Load Dashboard</p>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-[#9333EA] hover:bg-[#a855f7] text-white px-6 py-2 rounded-md transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-12">
      <Navbar />
      {/* Admin Header */}
      <div className="bg-gradient-to-r mb-6 from-[#9333EA]/20 to-[#0a0a0f] h-[200px] border-b border-[#2d2d3a] flex items-center">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center">
                <Shield className="text-[#9333EA] mr-2" size={24} />
                <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
              </div>
              <p className="text-gray-400 mt-1">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-3">
              <button className="flex items-center gap-2 bg-[#9333EA] hover:bg-[#a855f7] text-white px-4 py-2 rounded-md transition-colors">
                <Settings size={18} />
                <span>Platform Settings</span>
              </button>
              <button className="flex items-center gap-2 bg-[#1e1e2d] hover:bg-[#2d2d3a] text-white px-4 py-2 rounded-md border border-[#2d2d3a] transition-colors">
                <BarChart3 size={18} />
                <span>Analytics</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Users Card */}
          <div className="bg-[#121218] p-6 rounded-lg border border-[#2d2d3a] hover:border-[#9333EA]/50 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Total Users</p>
                <h3 className="text-2xl font-bold mt-1">{stats.users.total.toLocaleString()}</h3>
                <div className="flex items-center mt-2 text-green-400 text-sm">
                  <TrendingUp size={14} className="mr-1" />
                  <span>+{stats.users.new} this month</span>
                </div>
              </div>
              <div className="bg-[#9333EA]/20 p-3 rounded-lg">
                <Users size={24} className="text-[#9333EA]" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[#2d2d3a] grid grid-cols-2 gap-2">
              <div>
                <p className="text-gray-400 text-xs">Active</p>
                <p className="font-medium">{stats.users.active.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Conversion</p>
                <p className="font-medium">{Math.round((stats.users.active / stats.users.total) * 100)}%</p>
              </div>
            </div>
          </div>

          {/* Projects Card */}
          <div className="bg-[#121218] p-6 rounded-lg border border-[#2d2d3a] hover:border-[#9333EA]/50 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Total Projects</p>
                <h3 className="text-2xl font-bold mt-1">{stats.projects.total.toLocaleString()}</h3>
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
                <p className="font-medium">{stats.projects.completed.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Success Rate</p>
                <p className="font-medium">98%</p>
              </div>
            </div>
          </div>

          {/* Revenue Card */}
          <div className="bg-[#121218] p-6 rounded-lg border border-[#2d2d3a] hover:border-[#9333EA]/50 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Total Revenue</p>
                <h3 className="text-2xl font-bold mt-1">${stats.revenue.total.toLocaleString()}</h3>
                <div className="flex items-center mt-2 text-green-400 text-sm">
                  <TrendingUp size={14} className="mr-1" />
                  <span>+12% from last month</span>
                </div>
              </div>
              <div className="bg-[#9333EA]/20 p-3 rounded-lg">
                <DollarSign size={24} className="text-[#9333EA]" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[#2d2d3a] grid grid-cols-2 gap-2">
              <div>
                <p className="text-gray-400 text-xs">This Month</p>
                <p className="font-medium">${stats.revenue.thisMonth.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Pending</p>
                <p className="font-medium">${stats.revenue.pending.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Issues Card */}
          <div className="bg-[#121218] p-6 rounded-lg border border-[#2d2d3a] hover:border-[#9333EA]/50 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Open Issues</p>
                <h3 className="text-2xl font-bold mt-1">{stats.issues.open}</h3>
                {/* <div className="flex items-center mt-2 text-red-400 text-sm">
                  <AlertTriangle size={14} className="mr-1" />
                  <span>{stats.issues.critical} critical issues</span>
                </div> */}
              </div>
              <div className="bg-[#9333EA]/20 p-3 rounded-lg">
                <AlertTriangle size={24} className="text-[#9333EA]" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[#2d2d3a] grid grid-cols-2 gap-2">
              <div>
                <p className="text-gray-400 text-xs">Resolved</p>
                <p className="font-medium">{stats.issues.resolved}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Resolution Time</p>
                <p className="font-medium">4.2 hours</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-8">
            {/* User Management Section */}
            <div className="bg-[#121218] rounded-lg border border-[#2d2d3a]">
              <div className="p-6 border-b border-[#2d2d3a]">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">User Management</h2>
                  <button className="flex items-center gap-2 text-[#9333EA] hover:text-[#a855f7] text-sm">
                    <UserPlus size={16} />
                    <span>Add User</span>
                  </button>
                </div>

                {/* Search and Filter */}
                <div className="mt-4 flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-grow">
                    <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users..."
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
                      <option value="all">All Roles</option>
                      <option value="freelancer">Freelancers</option>
                      <option value="client">Clients</option>
                      <option value="admin">Admins</option>
                    </select>
                  </div>
                </div>

                {/* User Tabs */}
                <div className="flex mt-4 border-b border-[#2d2d3a] overflow-x-auto">
                  <button
                    className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === "all" ? "text-[#9333EA] border-b-2 border-[#9333EA]" : "text-gray-400 hover:text-white"}`}
                    onClick={() => setActiveTab("all")}
                  >
                    All Users
                  </button>
                  <button
                    className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === "new" ? "text-[#9333EA] border-b-2 border-[#9333EA]" : "text-gray-400 hover:text-white"}`}
                    onClick={() => setActiveTab("new")}
                  >
                    New Users
                  </button>
                  <button
                    className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === "active" ? "text-[#9333EA] border-b-2 border-[#9333EA]" : "text-gray-400 hover:text-white"}`}
                    onClick={() => setActiveTab("active")}
                  >
                    Active Users
                  </button>
                  <button
                    className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === "suspended" ? "text-[#9333EA] border-b-2 border-[#9333EA]" : "text-gray-400 hover:text-white"}`}
                    onClick={() => setActiveTab("suspended")}
                  >
                    Suspended
                  </button>
                </div>
              </div>

              {/* User Table */}
              <div className="p-4">
                <UserTable users={recentUsers} />
              </div>

              {/* View All Users Button */}
              <div className="p-4 border-t border-[#2d2d3a] flex justify-center">
                <a
                  href="/admin/users"
                  className="flex items-center gap-2 bg-[#1e1e2d] hover:bg-[#2d2d3a] text-white px-6 py-2 rounded-md border border-[#2d2d3a] transition-colors"
                >
                  <span>View All Users</span>
                  <ChevronRight size={16} />
                </a>
              </div>
            </div>

            {/* Revenue Chart */}
            <div className="bg-[#121218] rounded-lg border border-[#2d2d3a]">
              <div className="p-6 border-b border-[#2d2d3a]">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Revenue Overview</h2>
                  <select className="bg-[#1e1e2d] text-white text-sm rounded-md border border-[#2d2d3a] px-2 py-1">
                    <option>Last 30 Days</option>
                    <option>Last 3 Months</option>
                    <option>Last 6 Months</option>
                    <option>This Year</option>
                  </select>
                </div>
              </div>

              <div className="p-6">
                <RevenueChart data={revenueData} isLoading={isLoading} />

                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="bg-[#1e1e2d] p-4 rounded-lg">
                    <p className="text-gray-400 text-xs">Total Revenue</p>
                    <p className="text-xl font-bold mt-1">${stats.revenue.total.toLocaleString()}</p>
                    <div className="flex items-center mt-2 text-green-400 text-xs">
                      <TrendingUp size={12} className="mr-1" />
                      <span>+{revenueData?.monthlyRevenue ? 
                        Math.round(((revenueData.monthlyRevenue[new Date().getMonth()]?.revenue || 0) / 
                        (revenueData.monthlyRevenue[new Date().getMonth() - 1]?.revenue || 1) - 1) * 100)
                        : 18}% from last month</span>
                    </div>
                  </div>
                  <div className="bg-[#1e1e2d] p-4 rounded-lg">
                    <p className="text-gray-400 text-xs">Platform Fee</p>
                    <p className="text-xl font-bold mt-1">
                      ${revenueData?.totalServiceFee ? 
                        revenueData.totalServiceFee.toLocaleString() : 
                        Math.round(stats.revenue.total * 0.1).toLocaleString()
                      }
                    </p>
                    <p className="text-gray-400 text-xs mt-2">
                      {revenueData?.totalServiceFee ? 
                        `${Math.round((revenueData.totalServiceFee / revenueData.totalAmount) * 100)}% of total revenue` :
                        '10% of total revenue'
                      }
                    </p>
                  </div>
                  <div className="bg-[#1e1e2d] p-4 rounded-lg">
                    <p className="text-gray-400 text-xs">Avg. Project Value</p>
                    <p className="text-xl font-bold mt-1">
                      ${stats.projects.total > 0 ? 
                        Math.round(stats.revenue.total / stats.projects.total).toLocaleString() :
                        '0'
                      }
                    </p>
                    <p className="text-gray-400 text-xs mt-2">Per completed project</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-8">
            {/* Platform Status */}
            <div className="bg-[#121218] rounded-lg border border-[#2d2d3a]">
              <div className="p-6 border-b border-[#2d2d3a]">
                <h2 className="text-xl font-bold">Platform Status</h2>
              </div>

              <div className="p-6">
                <PlatformStatus data={platformStatus} />
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-[#121218] rounded-lg border border-[#2d2d3a]">
              <div className="p-6 border-b border-[#2d2d3a]">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Recent Activity</h2>
                  <a href="/admin/activity" className="text-[#9333EA] hover:text-[#a855f7] text-sm">
                    View All
                  </a>
                </div>
              </div>

              <div className="p-4">
                <ActivityLog logs={activityLogs} />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-[#121218] rounded-lg border border-[#2d2d3a]">
              <div className="p-6 border-b border-[#2d2d3a]">
                <h2 className="text-xl font-bold">Quick Actions</h2>
              </div>

              <div className="p-4 grid grid-cols-2 gap-4">
                <button className="flex flex-col items-center justify-center bg-[#1e1e2d] hover:bg-[#2d2d3a] p-4 rounded-lg transition-colors">
                  <Bell size={24} className="text-[#9333EA] mb-2" />
                  <span className="text-sm">Send Announcement</span>
                </button>
                <button className="flex flex-col items-center justify-center bg-[#1e1e2d] hover:bg-[#2d2d3a] p-4 rounded-lg transition-colors">
                  <FileText size={24} className="text-[#9333EA] mb-2" />
                  <span className="text-sm">Generate Report</span>
                </button>
                <button className="flex flex-col items-center justify-center bg-[#1e1e2d] hover:bg-[#2d2d3a] p-4 rounded-lg transition-colors">
                  <Settings size={24} className="text-[#9333EA] mb-2" />
                  <span className="text-sm">System Settings</span>
                </button>
                <button className="flex flex-col items-center justify-center bg-[#1e1e2d] hover:bg-[#2d2d3a] p-4 rounded-lg transition-colors">
                  <Shield size={24} className="text-[#9333EA] mb-2" />
                  <span className="text-sm">Security</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
