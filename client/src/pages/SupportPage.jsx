import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  FileText,
  User,
  Calendar,
  ArrowRight,
  MessageCircle,
  Paperclip
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { issueApi } from '../services/issueApi';

const SupportPage = () => {
  const user = useSelector((state) => state.Auth.user);
  const [activeTab, setActiveTab] = useState('my-issues');
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

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
    fetchIssues();
  }, [currentPage, statusFilter, categoryFilter, searchQuery]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 10,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        search: searchQuery || undefined,
      };

      const response = await issueApi.getMyIssues(params);
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

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-[#9333EA]/20 to-[#0a0a0f] border-b border-[#2d2d3a]">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center">
                <MessageSquare className="text-[#9333EA] mr-3" size={28} />
                <h1 className="text-3xl font-bold">Support Center</h1>
              </div>
              <p className="text-gray-400 mt-2">
                Get help with your account, jobs, payments, and more
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 md:mt-0 flex items-center gap-2 bg-[#9333EA] hover:bg-[#a855f7] text-white px-6 py-3 rounded-lg transition-colors"
            >
              <Plus size={20} />
              Create Issue
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-grow">
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
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400" />
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
            </div>

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
          </div>
        </div>

        {/* Issues List */}
        <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] overflow-hidden">
          <div className="p-6 border-b border-[#2d2d3a]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Your Issues</h2>
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
                {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first issue to get started'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#2d2d3a]">
              {issues.map((issue) => {
                const StatusIcon = getStatusIcon(issue.status);
                return (
                  <div
                    key={issue._id}
                    className="p-6 hover:bg-[#1e1e2d] transition-colors cursor-pointer"
                    onClick={() => setSelectedIssue(issue)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-grow">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg">{getCategoryIcon(issue.category)}</span>
                          <h3 className="font-semibold text-lg text-white">{issue.title}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(issue.priority)} bg-opacity-20`}>
                            {issue.priority}
                          </span>
                        </div>
                        
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                          {issue.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
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
                          <div className="flex items-center gap-1">
                            <User size={14} />
                            <span>#{issue._id.slice(-8)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 ml-4">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getStatusColor(issue.status)} bg-opacity-20`}>
                          <StatusIcon size={16} />
                          <span className="capitalize">{issue.status.replace('_', ' ')}</span>
                        </div>
                        <ArrowRight size={16} className="text-gray-600" />
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
                  Showing {Math.min((currentPage - 1) * 10 + 1, totalCount)} to {Math.min(currentPage * 10, totalCount)} of {totalCount} results
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

      {/* Create Issue Modal */}
      {showCreateModal && (
        <CreateIssueModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchIssues();
          }}
          categories={categories}
          priorities={priorities}
        />
      )}

      {/* Issue Detail Modal */}
      {selectedIssue && (
        <IssueDetailModal
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

// Create Issue Modal Component
const CreateIssueModal = ({ onClose, onSuccess, categories, priorities }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    tags: '',
  });
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('category', formData.category);
      submitData.append('priority', formData.priority);
      
      if (formData.tags) {
        submitData.append('tags', formData.tags);
      }

      // Add attachments
      attachments.forEach((file) => {
        submitData.append('attachments', file);
      });

      const response = await issueApi.createIssue(submitData);
      if (response.data.success) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating issue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files].slice(0, 5)); // Limit to 5 files
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#2d2d3a]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Create Support Issue</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <XCircle size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-[#1e1e2d] border border-[#2d2d3a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
              placeholder="Brief description of your issue"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 bg-[#1e1e2d] border border-[#2d2d3a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
              required
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.icon} {category.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-4 py-3 bg-[#1e1e2d] border border-[#2d2d3a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
            >
              {priorities.map(priority => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 bg-[#1e1e2d] border border-[#2d2d3a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent resize-none"
              placeholder="Provide detailed information about your issue..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tags (optional)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-4 py-3 bg-[#1e1e2d] border border-[#2d2d3a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
              placeholder="Separate tags with commas"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Attachments (optional)</label>
            <input
              type="file"
              onChange={handleFileChange}
              multiple
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt"
              className="w-full px-4 py-3 bg-[#1e1e2d] border border-[#2d2d3a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-1">
              Max 5 files, 10MB each. Supported: images, PDFs, documents
            </p>
            
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-[#1e1e2d] rounded">
                    <span className="text-sm text-gray-300">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#9333EA] hover:bg-[#a855f7] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Issue Detail Modal Component
const IssueDetailModal = ({ issue, onClose, onUpdate, categories, priorities, statuses }) => {
  const [fullIssue, setFullIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [responseText, setResponseText] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);

  useEffect(() => {
    fetchIssueDetails();
  }, [issue._id]);

  const fetchIssueDetails = async () => {
    try {
      setLoading(true);
      const response = await issueApi.getIssueById(issue._id);
      if (response.data.success) {
        setFullIssue(response.data.data.issue);
      }
    } catch (error) {
      console.error('Error fetching issue details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddResponse = async (e) => {
    e.preventDefault();
    if (!responseText.trim()) return;

    try {
      setSubmittingResponse(true);
      const response = await issueApi.addResponse(issue._id, {
        message: responseText.trim()
      });
      
      if (response.data.success) {
        setResponseText('');
        await fetchIssueDetails(); // Refresh to show new response
        onUpdate(); // Update the main issue list
      }
    } catch (error) {
      console.error('Error adding response:', error);
      alert('Failed to add response. Please try again.');
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleCloseIssue = async () => {
    if (!window.confirm('Are you sure you want to close this issue?')) return;

    try {
      await issueApi.closeIssue(issue._id);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error closing issue:', error);
      alert('Failed to close issue. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const statusObj = statuses.find(s => s.value === status);
    return statusObj ? statusObj.color : 'text-gray-500';
  };

  const getPriorityColor = (priority) => {
    const priorityObj = priorities.find(p => p.value === priority);
    return priorityObj ? priorityObj.color : 'text-gray-500';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] w-full max-w-4xl max-h-[90vh] p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9333EA]"></div>
            <span className="ml-3 text-gray-300">Loading issue details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!fullIssue) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] w-full max-w-4xl max-h-[90vh] p-8">
          <div className="text-center text-red-400">
            <p>Failed to load issue details</p>
            <button onClick={onClose} className="mt-4 px-4 py-2 bg-[#9333EA] text-white rounded-lg hover:bg-[#7c2d9f]">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#121218] rounded-lg border border-[#2d2d3a] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#2d2d3a] flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">{fullIssue.title}</h2>
              <div className="flex items-center gap-4 text-sm">
                <span className={`${getStatusColor(fullIssue.status)} font-medium capitalize`}>
                  {fullIssue.status.replace('_', ' ')}
                </span>
                <span className={`${getPriorityColor(fullIssue.priority)} font-medium capitalize`}>
                  {fullIssue.priority} priority
                </span>
                <span className="text-gray-400">
                  #{fullIssue._id.slice(-8)}
                </span>
                <span className="text-gray-400">
                  Created {formatDate(fullIssue.createdAt)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {fullIssue.status !== 'closed' && (
                <button
                  onClick={handleCloseIssue}
                  className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Close Issue
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Original Issue */}
          <div className="p-6 border-b border-[#2d2d3a]">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#9333EA] rounded-full flex items-center justify-center text-white font-bold">
                {fullIssue.submittedBy?.name?.[0] || 'U'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-white">{fullIssue.submittedBy?.name || 'User'}</span>
                  <span className="text-gray-400 text-sm">{formatDate(fullIssue.createdAt)}</span>
                </div>
                <div className="text-gray-300 whitespace-pre-wrap">{fullIssue.description}</div>
                {fullIssue.attachments && fullIssue.attachments.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                      <Paperclip size={16} />
                      <span>Attachments ({fullIssue.attachments.length})</span>
                    </div>
                    <div className="space-y-1">
                      {fullIssue.attachments.map((attachment, index) => (
                        <div key={index} className="text-sm text-blue-400 hover:text-blue-300">
                          {attachment.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Responses */}
          {fullIssue.responses && fullIssue.responses.length > 0 && (
            <div className="space-y-0">
              {fullIssue.responses.map((response, index) => {
                const isAdmin = response.author?.role === 'admin';
                return (
                  <div key={index} className="p-6 border-b border-[#2d2d3a]">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        isAdmin ? 'bg-orange-600' : 'bg-[#9333EA]'
                      }`}>
                        {response.author?.name?.[0] || 'A'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-white">{response.author?.name || 'Admin'}</span>
                          {isAdmin && (
                            <span className="px-2 py-1 bg-orange-600 text-white text-xs rounded-full">Admin</span>
                          )}
                          <span className="text-gray-400 text-sm">{formatDate(response.timestamp)}</span>
                        </div>
                        <div className="text-gray-300 whitespace-pre-wrap">{response.message}</div>
                        {response.attachments && response.attachments.length > 0 && (
                          <div className="mt-3">
                            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                              <Paperclip size={16} />
                              <span>Attachments ({response.attachments.length})</span>
                            </div>
                            <div className="space-y-1">
                              {response.attachments.map((attachment, idx) => (
                                <div key={idx} className="text-sm text-blue-400 hover:text-blue-300">
                                  {attachment.name}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Response Form */}
          {fullIssue.status !== 'closed' && (
            <div className="p-6">
              <form onSubmit={handleAddResponse}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Add Response
                  </label>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Type your response here..."
                    className="w-full px-3 py-2 bg-[#1a1a24] border border-[#2d2d3a] rounded-lg text-white placeholder-gray-500 resize-vertical min-h-[100px]"
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingResponse || !responseText.trim()}
                    className="px-4 py-2 bg-[#9333EA] text-white rounded-lg hover:bg-[#7c2d9f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {submittingResponse ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <MessageSquare size={16} />
                        Send Response
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
