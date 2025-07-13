"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  Users,
  Briefcase,
  DollarSign,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Plus,
  Download,
  Calendar,
  X,
  CheckSquare,
  User,
  MessageSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ClientTeams = () => {
  const [teams, setTeams] = useState([]);
  const { jobId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [newMilestoneOpen, setNewMilestoneOpen] = useState(false);
  const [approvingMilestoneId, setApprovingMilestoneId] = useState(null);
  const token = localStorage.getItem("authToken");

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/jobs/client/teams",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setTeams(response.data.data);
        if (jobId) {
          const teamToSelect = response.data.data.find(
            (team) => team._id === jobId
          );
          if (teamToSelect) {
            setSelectedTeam(teamToSelect);
          }
        }
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch teams");
        setLoading(false);
      }
    };

    fetchTeams();
  }, [token]);

  const handleTeamSelect = (team) => {
    setSelectedTeam(team);
    setSelectedMember(null);
    console.log('Selected team:', team);
  };

  const handleMemberSelect = (member) => {
    setSelectedMember(member);
    console.log('Selected member:', member);
  };

  const handleApproveMilestone = async (jobId, freelancerId, milestoneId) => {
    try {
      setApprovingMilestoneId(milestoneId);
      await axios.put(
        `http://localhost:5000/api/jobs/${jobId}/milestones/${milestoneId}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Refresh the team data
      const response = await axios.get(
        "http://localhost:5000/api/jobs/client/teams",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setTeams(response.data.data);

      // Update the selected team and member
      const updatedTeam = response.data.data.find(
        (t) => t._id === selectedTeam._id
      );
      setSelectedTeam(updatedTeam);

      if (selectedMember) {
        const updatedMember = updatedTeam.team.find(
          (m) => m._id === selectedMember._id
        );
        setSelectedMember(updatedMember);
      }
    } catch (err) {
      console.error("Error approving milestone:", err);
    } finally {
      setApprovingMilestoneId(null);
    }
  };

  const handleRequestRevision = async (jobId, freelancerId, milestoneId) => {
    try {
      // You'll need to implement this API endpoint on your backend
      await axios.post(
        `http://localhost:5000/api/jobs/${jobId}/freelancer/${freelancerId}/milestone/${milestoneId}/requestRevision`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Refresh the team data
      const response = await axios.get("http://localhost:5000/api/jobs/teams", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTeams(response.data.data);

      // Update the selected team and member
      const updatedTeam = response.data.data.find(
        (t) => t._id === selectedTeam._id
      );
      setSelectedTeam(updatedTeam);

      if (selectedMember) {
        const updatedMember = updatedTeam.team.find(
          (m) => m._id === selectedMember._id
        );
        setSelectedMember(updatedMember);
      }
    } catch (err) {
      console.error("Error requesting revision:", err);
    }
  };

  const NewMilestoneForm = ({ jobId, freelancerId, onClose }) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [deadline, setDeadline] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setError("");

      try {
        await axios.post(
          `http://localhost:5000/api/jobs/${jobId}/milestones`,
          {
            freelancerId,
            title,
            description,
            amount: Number.parseFloat(amount),
            deadline,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setSuccess(true);

        // Refresh the team data
        const response = await axios.get(
          "http://localhost:5000/api/jobs/client/teams",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setTeams(response.data.data);

        // Update the selected team and member
        const updatedTeam = response.data.data.find(
          (t) => t._id === selectedTeam._id
        );
        setSelectedTeam(updatedTeam);

        if (selectedMember) {
          const updatedMember = updatedTeam.team.find(
            (m) => m._id === selectedMember._id
          );
          setSelectedMember(updatedMember);
        }

        setTimeout(() => {
          onClose();
        }, 2000);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to create milestone");
      } finally {
        setLoading(false);
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 px-4 py-6 sm:p-0"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.9 }}
          className="bg-[#1c1c24] rounded-lg p-4 sm:p-6 md:p-8 w-full max-w-md mx-auto relative"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>

          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            Create New Milestone
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Add a new milestone for this team member
          </p>

          {success && (
            <div className="bg-green-900/30 border border-green-500 text-green-200 px-4 py-3 rounded mb-4 flex items-center">
              <CheckCircle size={18} className="mr-2" />
              <span>Milestone created successfully!</span>
            </div>
          )}

          {error && (
            <div className="bg-red-900/30 border border-red-500 text-red-200 px-4 py-3 rounded mb-4 flex items-center">
              <AlertCircle size={18} className="mr-2" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Milestone Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#2d2d3a] text-white rounded-md px-3 py-2 text-sm border border-[#3d3d4a] focus:border-[#9333EA] focus:outline-none"
                placeholder="e.g., Design Homepage"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#2d2d3a] text-white rounded-md px-3 py-2 text-sm border border-[#3d3d4a] focus:border-[#9333EA] focus:outline-none"
                rows="3"
                placeholder="Describe what should be delivered in this milestone"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Amount (PKR)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#2d2d3a] text-white rounded-md px-3 py-2 text-sm border border-[#3d3d4a] focus:border-[#9333EA] focus:outline-none"
                placeholder="e.g., 500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Deadline
              </label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-[#2d2d3a] text-white rounded-md px-3 py-2 text-sm border border-[#3d3d4a] focus:border-[#9333EA] focus:outline-none"
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 mt-6">
              <button
                type="submit"
                disabled={loading || success}
                className={`${
                  loading || success
                    ? "bg-[#9333EA]/50 cursor-not-allowed"
                    : "bg-[#9333EA] hover:bg-[#7928CA]"
                } text-white px-4 py-2 rounded-md text-sm font-medium w-full sm:w-auto flex items-center justify-center`}
              >
                {loading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                    Processing...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle size={16} className="mr-2" />
                    Created!
                  </>
                ) : (
                  "Create Milestone"
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="bg-[#2D3748] text-white px-4 py-2 rounded-md hover:bg-[#4A5568] text-sm font-medium w-full sm:w-auto"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    );
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#9333EA]"></div>
      </div>
    );

  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r mb-6 h-[200px] from-[#9333EA]/20 to-[#0a0a0f] border-b border-[#2d2d3a] flex items-center"
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full">
            <div>
              <div className="flex items-center">
                <Users className="text-[#9333EA] mr-2" size={24} />
                <h1 className="text-2xl md:text-3xl font-bold">My Teams</h1>
              </div>
              <p className="text-gray-400 mt-1">
                Manage your crowdsourced teams and milestones
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 py-8">
        {teams.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-[#1c1c24] rounded-lg p-8 text-center"
          >
            <Users size={48} className="text-[#9333EA] mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Teams Yet</h2>
            <p className="text-gray-400 mb-6">
              You haven't created any crowdsourced teams yet.
            </p>
            <Link
              to="/client/post-job"
              className="bg-[#9333EA] text-white px-6 py-3 rounded-md inline-flex items-center hover:bg-[#7928CA] transition duration-300"
            >
              <Plus size={18} className="mr-2" />
              Post a Crowdsourced Job
            </Link>
          </motion.div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:w-1/3 bg-[#1c1c24] rounded-lg p-4 h-fit"
            >
              <h2 className="text-xl font-semibold mb-4 px-2">My Teams</h2>
              <div className="space-y-2">
                {teams.map((team) => (
                  <motion.div
                    key={team._id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleTeamSelect(team)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedTeam?._id === team._id
                        ? "bg-[#9333EA]/20 border border-[#9333EA]/50"
                        : "hover:bg-[#2d2d3a]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{team.title}</h3>
                        <div className="flex items-center text-sm text-gray-400 mt-1">
                          <Users size={14} className="mr-1" />
                          <span>{team.team.length} members</span>
                        </div>
                      </div>
                      <ChevronRight
                        size={18}
                        className={`text-gray-400 ${
                          selectedTeam?._id === team._id ? "text-[#9333EA]" : ""
                        }`}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {selectedTeam ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="lg:w-2/3 flex flex-col md:flex-row gap-6"
              >
                <div className="md:w-1/2 bg-[#1c1c24] rounded-lg p-4 h-fit">
                  <h2 className="text-xl font-semibold mb-4">Team Members</h2>
                  <div className="space-y-3">
                    {selectedTeam.team.length === 0 ? (
                      <p className="text-gray-400 text-center py-4">
                        No team members yet
                      </p>
                    ) : (
                      selectedTeam.team.map((member) => (
                        <motion.div
                          key={member._id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleMemberSelect(member)}
                          className={`p-3 rounded-lg cursor-pointer transition-all ${
                            selectedMember?._id === member._id
                              ? "bg-[#9333EA]/20 border border-[#9333EA]/50"
                              : "hover:bg-[#2d2d3a]"
                          }`}
                        >
                          <div className="flex items-center">
                            <img
                              src={
                                member.freelancer.profilePic ||
                                "https://res.cloudinary.com/dxmeatsae/image/upload/v1745772539/client_verification_docs/mhpbkpi3vnkejxe0kpai.png" ||
                                "/placeholder.svg" ||
                                "/placeholder.svg"
                              }
                              alt={member.freelancer.name}
                              className="w-10 h-10 rounded-full mr-3"
                            />
                            <div>
                              <h3 className="font-medium">
                                {member.freelancer.name}
                              </h3>
                              <div className="flex items-center text-sm text-gray-400 mt-1">
                                <span className="bg-[#9333EA]/20 text-[#9333EA] px-2 py-0.5 rounded text-xs">
                                  {member.role}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>

                {selectedMember && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="md:w-1/2 bg-[#1c1c24] rounded-lg p-4"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold">Milestones</h2>
                      <button
                        onClick={() => setNewMilestoneOpen(true)}
                        className="bg-[#9333EA] text-white p-2 rounded-md hover:bg-[#7928CA] transition-colors"
                      >
                        <Plus size={18} />
                      </button>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-md font-medium text-gray-300 mb-2">
                        Active Milestones
                      </h3>
                      {selectedMember.milestones.filter(
                        (m) => m.status === "in-progress"
                      ).length === 0 ? (
                        <p className="text-gray-400 text-sm py-2">
                          No active milestones
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {selectedMember.milestones
                            .filter((m) => m.status === "in-progress")
                            .map((milestone) => (
                              <div
                                key={milestone._id}
                                className="bg-[#2d2d3a] p-3 rounded-lg"
                              >
                                <h4 className="font-medium">
                                  {milestone.title}
                                </h4>
                                <p className="text-sm text-gray-400 mt-1">
                                  {milestone.description}
                                </p>
                                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                                  <div className="flex items-center text-sm">
                                    {/* <DollarSign size={14} className="text-[#9333EA] mr-1" /> */}
                                    <span>
                                      PKR {milestone.amount.toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center text-sm">
                                    <Calendar
                                      size={14}
                                      className="text-[#9333EA] mr-1"
                                    />
                                    <span>
                                      {new Date(
                                        milestone.deadline
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center text-sm">
                                    <div className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full text-xs">
                                      In Progress
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    <div className="mb-6">
                      <h3 className="text-md font-medium text-gray-300 mb-2">
                        Submitted Milestones
                      </h3>
                      {selectedMember.milestones.filter(
                        (m) => m.status === "submitted"
                      ).length === 0 ? (
                        <p className="text-gray-400 text-sm py-2">
                          No submitted milestones
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {selectedMember.milestones
                            .filter((m) => m.status === "submitted")
                            .map((milestone) => (
                              <div
                                key={milestone._id}
                                className="bg-[#2d2d3a] p-3 rounded-lg"
                              >
                                <h4 className="font-medium">
                                  {milestone.title}
                                </h4>
                                <p className="text-sm text-gray-400 mt-1">
                                  {milestone.description}
                                </p>
                                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                                  <div className="flex items-center text-sm">
                                    {/* <DollarSign size={14} className="text-[#9333EA] mr-1" /> */}
                                    <span>
                                      PKR {milestone.amount.toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center text-sm">
                                    <Calendar
                                      size={14}
                                      className="text-[#9333EA] mr-1"
                                    />
                                    <span>
                                      {new Date(
                                        milestone.deadline
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center text-sm">
                                    <div className="bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full text-xs">
                                      Submitted
                                    </div>
                                  </div>
                                </div>

                                {milestone.submission && (
                                  <div className="mt-3 p-3 bg-[#1c1c24] rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                      <h5 className="text-sm font-medium text-white">
                                        Submission Details
                                      </h5>
                                      <span className="text-xs text-gray-400">
                                        {new Date(
                                          milestone.submission.submittedAt
                                        ).toLocaleString()}
                                      </span>
                                    </div>

                                    {milestone.submission.message && (
                                      <p className="text-sm text-gray-300 mb-2">
                                        {milestone.submission.message}
                                      </p>
                                    )}

                                    {milestone.submission.attachments &&
                                      milestone.submission.attachments.length >
                                        0 && (
                                        <div className="space-y-2">
                                          <p className="text-xs text-gray-400">
                                            Attachments:
                                          </p>
                                          <div className="flex flex-wrap gap-2">
                                            {milestone.submission.attachments.map(
                                              (attachment) => (
                                                <a
                                                  key={attachment._id}
                                                  href={attachment.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="bg-[#2d2d3a] text-[#9333EA] px-3 py-1 rounded-md text-xs hover:bg-[#3d3d4a] transition-colors flex items-center"
                                                >
                                                  <Download
                                                    size={12}
                                                    className="mr-1"
                                                  />
                                                  View Attachment
                                                </a>
                                              )
                                            )}
                                          </div>
                                        </div>
                                      )}

                                    <div className="mt-3 flex justify-end gap-2">
                                      <button
                                        onClick={() =>
                                          handleRequestRevision(
                                            selectedTeam._id,
                                            selectedMember.freelancer._id,
                                            milestone._id
                                          )
                                        }
                                        className="bg-yellow-600 text-white px-3 py-1 rounded-md text-sm hover:bg-yellow-700 transition-colors flex items-center"
                                      >
                                        <AlertCircle
                                          size={14}
                                          className="mr-1"
                                        />
                                        Request Revision
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleApproveMilestone(
                                            selectedTeam._id,
                                            selectedMember.freelancer._id,
                                            milestone._id
                                          )
                                        }
                                        disabled={
                                          approvingMilestoneId === milestone._id
                                        }
                                        className={`bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700 transition-colors flex items-center ${
                                          approvingMilestoneId === milestone._id
                                            ? "opacity-50 cursor-not-allowed"
                                            : ""
                                        }`}
                                      >
                                        {approvingMilestoneId ===
                                        milestone._id ? (
                                          <>
                                            <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                                            Approving...
                                          </>
                                        ) : (
                                          <>
                                            <CheckSquare
                                              size={14}
                                              className="mr-1"
                                            />
                                            Approve
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-md font-medium text-gray-300 mb-2">
                        Completed Milestones
                      </h3>
                      {selectedMember.milestones.filter(
                        (m) => m.status === "approved"
                      ).length === 0 ? (
                        <p className="text-gray-400 text-sm py-2">
                          No completed milestones
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {selectedMember.milestones
                            .filter((m) => m.status === "approved")
                            .map((milestone) => (
                              <div
                                key={milestone._id}
                                className="bg-[#2d2d3a] p-3 rounded-lg border-l-4 border-green-500"
                              >
                                <h4 className="font-medium">
                                  {milestone.title}
                                </h4>
                                <p className="text-sm text-gray-400 mt-1">
                                  {milestone.description}
                                </p>
                                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                                  <div className="flex items-center text-sm">
                                    {/* <DollarSign size={14} className="text-[#9333EA] mr-1" /> */}
                                    <span>
                                      PKR {milestone.amount.toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center text-sm">
                                    <CheckCircle
                                      size={14}
                                      className="text-green-500 mr-1"
                                    />
                                    <span className="text-green-400">
                                      Completed
                                    </span>
                                  </div>
                                </div>
                                {milestone.submission &&
                                  milestone.submission.attachments &&
                                  milestone.submission.attachments.length >
                                    0 && (
                                    <div className="mt-2">
                                      <div className="flex flex-wrap gap-2">
                                        {milestone.submission.attachments.map(
                                          (attachment) => (
                                            <a
                                              key={attachment._id}
                                              href={attachment.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-[#9333EA] text-sm hover:underline flex items-center"
                                            >
                                              <Download
                                                size={14}
                                                className="mr-1"
                                              />
                                              View Deliverable
                                            </a>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex space-x-3">
                      <Link
                        to={`/freelancer/profile/${selectedMember.freelancer._id}`}
                        className="bg-[#2d2d3a] text-white px-4 py-2 rounded-md hover:bg-[#3d3d4a] transition-colors flex items-center text-sm"
                      >
                        <User size={16} className="mr-2" />
                        View Profile
                      </Link>
                      <button className="bg-[#2d2d3a] text-white px-4 py-2 rounded-md hover:bg-[#3d3d4a] transition-colors flex items-center text-sm">
                        <MessageSquare size={16} className="mr-2" />
                        Message
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="lg:w-2/3 bg-[#1c1c24] rounded-lg p-8 flex flex-col items-center justify-center"
              >
                <Briefcase size={48} className="text-[#9333EA] mb-4" />
                <h2 className="text-xl font-semibold mb-2">Select a Team</h2>
                <p className="text-gray-400 text-center">
                  Choose a team from the list to view its members and milestones
                </p>
              </motion.div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {newMilestoneOpen && selectedMember && (
          <NewMilestoneForm
            jobId={selectedTeam._id}
            freelancerId={selectedMember.freelancer._id}
            onClose={() => setNewMilestoneOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClientTeams;
