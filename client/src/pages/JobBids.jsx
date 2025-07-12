"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Navigate, useParams } from "react-router-dom"
import { useNavigate } from "react-router-dom"
import { useSelector } from "react-redux";

import Navbar from "../components/Navbar"
import {
  DollarSign,
  Clock,
  Paperclip,
  MessageSquare,
  UserCheck,
  Briefcase,
  Star,
  CheckCircle,
  X,
  ExternalLink,
  ChevronDown,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import HirePopup from "../components/HirePopup"
import useConversation from "../components/useConversation"

const JobBids = () => {
  const [bids, setBids] = useState(null)
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedBid, setSelectedBid] = useState(null)
  const [selectedRole, setSelectedRole] = useState("")
  const [roles,setRoles] = useState([])
  const { jobId } = useParams()
  const token = localStorage.getItem("authToken")
  const [hirePopupOpen, setHirePopupOpen] = useState(false)
  const [freelancerId, setFreelancerId] = useState(null)
  const [selectedBidForHire, setSelectedBidForHire] = useState(null)
    const user = useSelector((state) => state.Auth.user);
    const userId = user? user.id : null;
   const { startConversation } = useConversation({ user});
   const navigate = useNavigate();

  const openHirePopup = (bid,freelancerId) => {
    console.log("user", user)
    setSelectedBidForHire(bid)
    setFreelancerId(freelancerId)
    setHirePopupOpen(true)
  }

  useEffect(() => {
    const fetchBids = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/bids/job/${jobId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        console.log(response.data.data, "bids data")
        setBids(response.data.data.bids)
      
        setJob(response.data.data)
   console.log(Object.keys(response.data.data.bids) , "bid roles")
   setRoles(Object.keys(response.data.data.bids))
        if (response.data.data.isCrowdsourced) {
          setSelectedRole(Object.keys(response.data.data.bids)[0] || "")
        }
        setLoading(false)
      } catch (err) {
        setError("Failed to fetch bids")
        setLoading(false)
      }
    }

    fetchBids()
  }, [jobId, token])

  const handleHire = (bidId,freelancerId) => {
    openHirePopup(bidId,freelancerId)
  }

  const handleMessage = (freelancerId) => {
    // Implement message functionality
    console.log(`Messaging freelancer ${freelancerId}`)
  }

  const handleViewDetails = (bid) => {
    setSelectedBid(bid)
  }

  const closePopup = () => {
    setSelectedBid(null)
  }

  const handleStartConversation = ({freelancerId}) => {
    console.log(freelancerId,'freelancerid')
    startConversation({
      receiverId: freelancerId,
      jobId,
      onSuccess: (data) => {
        navigate(`/client/messages/${data.message.conversation._id}`)
        
        console.log("Conversation created and joined:", data);
      },
      onError: (err) => {
        console.error("Failed to start conversation", err);
      },
    });
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#9333EA]"></div>
      </div>
    )
  if (error) return <div className="text-red-500 text-center">{error}</div>

  const renderBids = (bidsToRender) => {
    if (!bidsToRender || bidsToRender.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center text-gray-400 py-4"
        >
          No bids for this role yet.
        </motion.div>
      )
    }

    return bidsToRender.map((bid, index) => (
      <motion.div
        key={bid._id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        className="bg-[#1c1c24] rounded-lg shadow-md p-6 transition duration-300 ease-in-out transform hover:scale-105"
      >
        <div className="flex items-center gap-2 mb-4">
          <img
            src={
              bid.freelancer.profilePicture ||
              "https://res.cloudinary.com/dxmeatsae/image/upload/v1745772539/client_verification_docs/mhpbkpi3vnkejxe0kpai.png"
            }
            alt={bid.freelancer.name}
            className="w-12 h-10 rounded-full "
          />
          <div>
            <h3 className="text-xl font-semibold text-white">{bid.freelancer.name}</h3>
            <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center mt-1">
                <Star className="text-yellow-400 mr-1" size={16} />
                <span className="text-sm text-gray-300 text-nowrap">{bid.freelancer.successRate}% Success Rate</span>
              </div>
              <div className="flex items-center mt-1">
                <CheckCircle className="text-green-400 mr-1" size={16} />
                <span className="text-sm text-gray-300 text-nowrap">{bid.freelancer.completedJobs} Jobs Completed</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mb-4">
          <p className="text-gray-300">
            {bid.proposal.length > 150 ? `${bid.proposal.substring(0, 150)}...` : bid.proposal}....
            <span className="text-[#9333EA] cursor-pointer hover:underline" onClick={() => handleViewDetails(bid)}>
              View Details
            </span>
          </p>
        </div>
        <div className="flex items-center mb-2">
          <span className="font-semibold text-white">PKR {bid.budget}</span>
        </div>
        <div className="flex items-center mb-2">
          <Clock className="text-[#9333EA] mr-2" size={18} />
          <span className="text-gray-300">
            {bid.deliveryTime} {bid.deliveryTimeUnit}
          </span>
        </div>
        <div className="flex items-center mb-4">
          <Paperclip className="text-[#9333EA] mr-2" size={18} />
          <span className="text-gray-300">{bid.attachments.length} attachment(s)</span>
        </div>

        <div className="flex justify-between mt-6">
          {bid.offerSent ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gray-500 text-white px-6 py-2 rounded-md flex items-center transition duration-300 ease-in-out cursor-not-allowed"
              disabled
            >
              <CheckCircle className="mr-2" size={18} />
              Offer Sent
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleHire(bid._id,bid.freelancer._id)}
              className="bg-[#9333EA] text-white px-6 py-2 rounded-md flex items-center transition duration-300 ease-in-out hover:bg-[#7928CA]"
            >
              <UserCheck className="mr-2" size={18} />
              Hire
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={ () => handleStartConversation({freelancerId: bid.freelancer._id})}
            className="bg-[#2D3748] text-white px-6 py-2 rounded-md flex items-center transition duration-300 ease-in-out hover:bg-[#4A5568]"
          >
            <MessageSquare className="mr-2" size={18} />
            Message
          </motion.button>
        </div>
      </motion.div>
    ))
  }

  const BidDetailsPopup = ({ bid }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="bg-[#1c1c24] rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Bid Details</h2>
          <button onClick={closePopup} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <div className="space-y-4">
          <div className="flex items-center">
            <img
              src={
                bid.freelancer.profilePicture ||
                "https://res.cloudinary.com/dxmeatsae/image/upload/v1745772539/client_verification_docs/mhpbkpi3vnkejxe0kpai.png"
              }
              alt={bid.freelancer.name}
              className="w-16 h-16 rounded-full mr-4"
            />
            <div>
              <h3 className="text-xl font-semibold text-white">{bid.freelancer.name}</h3>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center">
                  <Star className="text-yellow-400 mr-1" size={16} />
                  <span className="text-sm text-gray-300">{bid.freelancer.successRate}% Success Rate</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="text-green-400 mr-1" size={16} />
                  <span className="text-sm text-gray-300">{bid.freelancer.completedJobs} Jobs Completed</span>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white mb-2">Proposal</h4>
            <p className="text-gray-300">{bid.proposal}</p>
          </div>
          <div>
          <h4 className="text-lg font-semibold text-white mb-2">Milestones</h4>
          {bid.milestones && bid.milestones.length > 0 ? (
            <div className="space-y-4">
              {bid.milestones.map((milestone, index) => (
                <div key={milestone._id} className="bg-[#2d2d3a] p-4 rounded-lg">
                  <h5 className="text-md font-semibold text-white">{milestone.title}</h5>
                  <p className="text-gray-300 text-sm mt-1">{milestone.description}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-400 text-sm">Amount: PKR {milestone.amount}</span>
                    <span className="text-gray-400 text-sm">Due: {new Date(milestone.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-2">
                    <span className={`text-sm px-2 py-1 rounded ${
                      milestone.status === 'pending' ? 'bg-yellow-500 text-yellow-900' :
                      milestone.status === 'completed' ? 'bg-green-500 text-green-900' :
                      'bg-gray-500 text-gray-900'
                    }`}>
                      {milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-300">No milestones specified for this bid.</p>
          )}
        </div>

          <div className="flex items-center">
            <span className="font-semibold text-white">PKR {bid.budget}</span>
          </div>
          <div className="flex items-center">
            <Clock className="text-[#9333EA] mr-2" size={18} />
            <span className="text-gray-300">
              {bid.deliveryTime} {bid.deliveryTimeUnit}
            </span>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white mb-2">Attachments</h4>
            <ul className="list-disc list-inside text-gray-300">
              {bid.attachments.map((attachment, index) => (
                <a
                  href={attachment}
                  key={index}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#9333EA] hover:underline flex items-center"
                >
                  Attachment No. {index + 1} <ExternalLink size={14} className="ml-1" />
                </a>
              ))}
            </ul>
          </div>
          <div className="flex justify-between mt-6">
            {bid.offerSent ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gray-500 text-white px-6 py-2 rounded-md flex items-center transition duration-300 ease-in-out cursor-not-allowed"
                disabled
              >
                <CheckCircle className="mr-2" size={18} />
                Offer Sent
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleHire(job.isCrowdsourced ? bid.freelancer._id : bid._id)}
                className="bg-[#9333EA] text-white px-6 py-2 rounded-md flex items-center transition duration-300 ease-in-out hover:bg-[#7928CA]"
              >
                <UserCheck className="mr-2" size={18} />
                Hire
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleMessage(bid.freelancer._id)}
              className="bg-[#2D3748] text-white px-6 py-2 rounded-md flex items-center transition duration-300 ease-in-out hover:bg-[#4A5568]"
            >
              <MessageSquare className="mr-2" size={18} />
              Message
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )

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
                <Briefcase className="text-[#9333EA] mr-2" size={24} />
                <h1 className="text-2xl md:text-3xl font-bold">Bids for {job?.jobTitle}</h1>
              </div>
              <p className="text-gray-400 mt-1">Manage and track bids for your posted job</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 py-8">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-3xl font-bold mb-6 text-white"
        >
          {job?.jobTitle}
        </motion.h2>
        {job?.isCrowdsourced ? (
          <div>
            <div className="mb-6">
              <label htmlFor="role-select" className="block text-sm font-medium text-gray-400 mb-2">
                Select Role
              </label>
              <div className="relative">
                <select
                  id="role-select"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="block appearance-none w-full bg-[#1c1c24] border border-[#2d2d3a] text-white py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-[#2d2d3a] focus:border-[#9333EA]"
                >
                  {Object.keys(bids || {}).map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <ChevronDown size={20} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderBids(bids?.[selectedRole])}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{renderBids(bids)}</div>
        )}
      </div>
      <AnimatePresence>{selectedBid && <BidDetailsPopup bid={selectedBid} />}</AnimatePresence>

      <AnimatePresence>
        {hirePopupOpen && (
          <HirePopup
            bid={selectedBidForHire}
            onClose={() => setHirePopupOpen(false)}
            jobId={jobId}
            isCrowdsourced={job?.isCrowdsourced}
            roles={job?.isCrowdsourced ? roles.map((role) => role) : []}
            freelancerId={freelancerId}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default JobBids
