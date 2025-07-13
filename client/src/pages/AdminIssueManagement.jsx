import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  User,
  Calendar,
  ArrowRight,
  MessageCircle,
  Paperclip,
  Settings,
  TrendingUp,
  Users,
  FileText,
  Eye,
  UserCheck,
  Flag
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { adminApi } from '../services/adminApi';
import { issueApi } from '../services/issueApi';

const AdminIssueManagement = () => {
  const user = useSelector((state) => state.Auth.user);
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assignedToFilter, setAssignedToFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const categories = [
    { value: 'technical', label: 'Technical Issues', icon: '🔧' },
    { value: 'payment', label: 'Payment Issues', icon: '💳' },
    { value: 'account', label: 'Account Issues', icon: '👤' },
    { value: 'job_posting', label: 'Job Posting', icon: '📝' },
    { value: 'freelancer_issues', label: 'Freelancer Issues', icon: '👨‍💻' },
    { value: 'client_issues', label: 'Client Issues', icon: '👨‍💼' },
    { value: 'billing', label: 'Billing', icon: '💰' },
    { value: 'verification', label: 'Verification', icon: '✅' },
    { value: 'other', label: 'Other', icon: '📋' },
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-green-500' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-500' },
    { value: 'high', label: 'High', color: 'text-orange-500' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-500' },
  ];

  const statuses = [
    { value: 'open', label: 'Open', icon: Clock, color: 'text-blue-500' },
    { value: 'in_progress', label: 'In Progress', icon: AlertTriangle, color: 'text-yellow-500' },
    { value: 'resolved', label: 'Resolved', icon: CheckCircle, color: 'text-green-500' },
    { value: 'closed', label: 'Closed', icon: XCircle, color: 'text-gray-500' },
  ];

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchIssues();
      fetchStats();
    }
  }, [currentPage, statusFilter, categoryFilter, priorityFilter, assignedToFilter, searchQuery, user]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 15,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        assignedTo: assignedToFilter !== 'all' ? assignedToFilter : undefined,
        search: searchQuery || undefined,
      };

      const response = await issueApi.getAllIssues(params);
      if (response.data.success) {
        setIssues(response.data.data.issues);
        setTotalPages(response.data.data.pagination.totalPages);
        setTotalCount(response.data.data.pagination.totalCount);
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await adminApi.getIssueStats();
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching issue stats:', error);
    }
  };

  const getStatusIcon = (status) => {
    const statusObj = statuses.find(s => s.value === status);
    return statusObj ? statusObj.icon : Clock;
  };

  const getStatusColor = (status) => {
    const statusObj = statuses.find(s => s.value === status);
    return statusObj ? statusObj.color : 'text-gray-500';
  };

  const getPriorityColor = (priority) => {
    const priorityObj = priorities.find(p => p.value === priority);
    return priorityObj ? priorityObj.color : 'text-gray-500';
  };

  const getCategoryIcon = (category) => {
    const categoryObj = categories.find(c => c.value === category);
    return categoryObj ? categoryObj.icon : '📋';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Quick actions
  const handleQuickStatusChange = async (issueId, newStatus) => {
    try {
      await issueApi.updateIssueStatus(issueId, { status: newStatus });
      fetchIssues();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleQuickAssign = async (issueId, assignedTo) => {
    try {
      await issueApi.assignIssue(issueId, { assignedTo });
      fetchIssues();
    } catch (error) {
      console.error('Error assigning issue:', error);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-[#9333EA]/20 to-[#0a0a0f] border-b border-[#2d2d3a]">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center">
                <Settings className="text-[#9333EA] mr-3" size={28} />
                <h1 className="text-3xl font-bold">Issue Management</h1>
              </div>
              <p className="text-gray-400 mt-2">
                Manage and respond to user support issues
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-[#121218] p-6 rounded-lg border border-[#2d2d3a]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Issues</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.totalIssues}</h3>
                </div>
                <div className="bg-[#9333EA]/20 p-3 rounded-lg">
                  <FileText size={24} className="text-[#9333EA]" />
                </div>
              </div>
            </div>

            <div className="bg-[#121218] p-6 rounded-lg border border-[#2d2d3a]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Open Issues</p>
                  <h3 className="text-2xl font-bold mt-1 text-orange-500">{stats.openIssues}</h3>
                </div>
                <div className="bg-orange-500/20 p-3 rounded-lg">
                  <Clock size={24} className="text-orange-500" />
                </div>
              </div>
            </div>

            <div className="bg-[#121218] p-6 rounded-lg border border-[#2d2d3a]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">In Progress</p>
                  <h3 className="text-2xl font-bold mt-1 text-yellow-500">{stats.inProgressIssues}</h3>
                </div>
                <div className="bg-yellow-500/20 p-3 rounded-lg">
                  <AlertTriangle size={24} className="text-yellow-500" />
                </div>
              </div>
            </div>

            <div className="bg-[#121218] p-6 rounded-lg border border-[#2d2d3a]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Resolved</p>
                  <h3 className="text-2xl font-bold mt-1 text-green-500">{stats.resolvedIssues}</h3>
                </div>
                <div className="bg-green-500/20 p-3 rounded-lg">
                  <CheckCircle size={24} className="text-green-500" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search issues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#1e1e2d] border border-[#2d2d3a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#1e1e2d] text-white px-4 py-3 rounded-lg border border-[#2d2d3a] focus:outline-none focus:ring-2 focus:ring-[#9333EA]"
            >
              <option value="all">All Status</option>
              {statuses.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-[#1e1e2d] text-white px-4 py-3 rounded-lg border border-[#2d2d3a] focus:outline-none focus:ring-2 focus:ring-[#9333EA]"
            >
              <option value="all">All Priority</option>
              {priorities.map(priority => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#1e1e2d] text-white px-4 py-3 rounded-lg border border-[#2d2d3a] focus:outline-none focus:ring-2 focus:ring-[#9333EA]"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.icon} {category.label}
                </option>
              ))}
            </select>

            {/* Assigned To Filter */}
            <select
              value={assignedToFilter}
              onChange={(e) => setAssignedToFilter(e.target.value)}
              className="bg-[#1e1e2d] text-white px-4 py-3 rounded-lg border border-[#2d2d3a] focus:outline-none focus:ring-2 focus:ring-[#9333EA]"
            >
              <option value="all">All Assigned</option>
              <option value="unassigned">Unassigned</option>
              <option value={user._id}>Assigned to Me</option>
            </select>
          </div>
        </div>

        {/* Issues List */}
        <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] overflow-hidden">
          <div className="p-6 border-b border-[#2d2d3a]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Support Issues</h2>
              <span className="text-gray-400 text-sm">
                {totalCount} total issues
              </span>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-[#9333EA] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-gray-400">Loading issues...</p>
            </div>
          ) : issues.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 text-lg">No issues found</p>
              <p className="text-gray-500 text-sm mt-2">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#2d2d3a]">
              {issues.map((issue) => {
                const StatusIcon = getStatusIcon(issue.status);
                return (
                  <div
                    key={issue._id}
                    className="p-6 hover:bg-[#1e1e2d] transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-grow">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg">{getCategoryIcon(issue.category)}</span>
                          <h3 className="font-semibold text-lg text-white">{issue.title}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(issue.priority)} bg-opacity-20`}>
                            {issue.priority}
                          </span>
                          {!issue.viewedByUser && (
                            <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">
                              New Response
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                          {issue.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <User size={14} />
                            <span>{issue.submittedBy?.name} ({issue.submittedBy?.role})</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>{formatDate(issue.createdAt)}</span>
                          </div>
                          {issue.responseCount > 0 && (
                            <div className="flex items-center gap-1">
                              <MessageCircle size={14} />
                              <span>{issue.responseCount} responses</span>
                            </div>
                          )}
                          {issue.attachments && issue.attachments.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Paperclip size={14} />
                              <span>{issue.attachments.length} files</span>
                            </div>
                          )}
                        </div>

                        {/* Quick Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedIssue(issue)}
                            className="flex items-center gap-1 px-3 py-1 text-xs bg-[#9333EA] hover:bg-[#a855f7] text-white rounded transition-colors"
                          >
                            <Eye size={12} />
                            View
                          </button>
                          
                          {issue.status === 'open' && (
                            <button
                              onClick={() => handleQuickStatusChange(issue._id, 'in_progress')}
                              className="flex items-center gap-1 px-3 py-1 text-xs bg-yellow-600 hover:bg-yellow-500 text-white rounded transition-colors"
                            >
                              <AlertTriangle size={12} />
                              Start
                            </button>
                          )}
                          
                          {issue.status === 'in_progress' && (
                            <button
                              onClick={() => handleQuickStatusChange(issue._id, 'resolved')}
                              className="flex items-center gap-1 px-3 py-1 text-xs bg-green-600 hover:bg-green-500 text-white rounded transition-colors"
                            >
                              <CheckCircle size={12} />
                              Resolve
                            </button>
                          )}
                          
                          {!issue.assignedTo && (
                            <button
                              onClick={() => handleQuickAssign(issue._id, user._id)}
                              className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
                            >
                              <UserCheck size={12} />
                              Assign to Me
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 ml-4">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getStatusColor(issue.status)} bg-opacity-20`}>
                          <StatusIcon size={16} />
                          <span className="capitalize">{issue.status.replace('_', ' ')}</span>
                        </div>
                        {issue.assignedTo && (
                          <div className="text-xs text-gray-400">
                            Assigned to: {issue.assignedTo.name}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          #{issue._id.slice(-8)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-6 border-t border-[#2d2d3a]">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Showing {Math.min((currentPage - 1) * 15 + 1, totalCount)} to {Math.min(currentPage * 15, totalCount)} of {totalCount} results
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm bg-[#1e1e2d] border border-[#2d2d3a] rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2d2d3a] transition-colors"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 text-sm rounded transition-colors ${
                          page === currentPage
                            ? 'bg-[#9333EA] text-white'
                            : 'bg-[#1e1e2d] border border-[#2d2d3a] hover:bg-[#2d2d3a]'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm bg-[#1e1e2d] border border-[#2d2d3a] rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2d2d3a] transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Issue Detail Modal */}
      {selectedIssue && (
        <AdminIssueDetailModal
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
          onUpdate={fetchIssues}
          categories={categories}
          priorities={priorities}
          statuses={statuses}
        />
      )}
    </div>
  );
};

// Admin Issue Detail Modal Component (placeholder - would be fully implemented)
const AdminIssueDetailModal = ({ issue, onClose, onUpdate, categories, priorities, statuses }) => {
  const [response, setResponse] = useState('');
  const [newStatus, setNewStatus] = useState(issue.status);
  const [newPriority, setNewPriority] = useState(issue.priority);
  const [loading, setLoading] = useState(false);

  const handleAddResponse = async (e) => {
    e.preventDefault();
    if (!response.trim()) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('message', response);

      await issueApi.addResponse(issue._id, formData);
      setResponse('');
      onUpdate();
    } catch (error) {
      console.error('Error adding response:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    try {
      await issueApi.updateIssueStatus(issue._id, { status: newStatus });
      onUpdate();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handlePriorityUpdate = async () => {
    try {
      await issueApi.updateIssuePriority(issue._id, { priority: newPriority });
      onUpdate();
    } catch (error) {
      console.error('Error updating priority:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#2d2d3a]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">{issue.title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <XCircle size={24} />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Issue Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Issue Details</h3>
              <p className="text-gray-300 mb-4">{issue.description}</p>
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-400">Category:</span> {issue.category}</div>
                <div><span className="text-gray-400">Submitted by:</span> {issue.submittedBy?.name} ({issue.submittedBy?.email})</div>
                <div><span className="text-gray-400">Created:</span> {new Date(issue.createdAt).toLocaleString()}</div>
                <div><span className="text-gray-400">Last Activity:</span> {new Date(issue.lastActivityAt).toLocaleString()}</div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Management</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <div className="flex gap-2">
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="bg-[#1e1e2d] text-white px-3 py-2 rounded border border-[#2d2d3a] flex-grow"
                    >
                      {statuses.map(status => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleStatusUpdate}
                      className="px-4 py-2 bg-[#9333EA] hover:bg-[#a855f7] text-white rounded"
                    >
                      Update
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <div className="flex gap-2">
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value)}
                      className="bg-[#1e1e2d] text-white px-3 py-2 rounded border border-[#2d2d3a] flex-grow"
                    >
                      {priorities.map(priority => (
                        <option key={priority.value} value={priority.value}>
                          {priority.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handlePriorityUpdate}
                      className="px-4 py-2 bg-[#9333EA] hover:bg-[#a855f7] text-white rounded"
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Responses */}
          <div>
            <h3 className="font-semibold mb-4">Responses ({issue.responseCount})</h3>
            <div className="space-y-4 max-h-60 overflow-y-auto mb-4">
              {issue.responses && issue.responses.map((resp, index) => (
                <div key={index} className="bg-[#1e1e2d] p-4 rounded border border-[#2d2d3a]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{resp.author?.name}</span>
                    <span className="text-xs text-gray-400">{new Date(resp.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-gray-300">{resp.message}</p>
                </div>
              ))}
            </div>
            
            {/* Add Response */}
            <form onSubmit={handleAddResponse} className="space-y-4">
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Type your response..."
                rows={4}
                className="w-full px-4 py-3 bg-[#1e1e2d] border border-[#2d2d3a] rounded text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] resize-none"
              />
              <button
                type="submit"
                disabled={loading || !response.trim()}
                className="px-6 py-2 bg-[#9333EA] hover:bg-[#a855f7] text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Response'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminIssueManagement;
