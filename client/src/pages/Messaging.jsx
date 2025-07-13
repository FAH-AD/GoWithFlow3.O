"use client";

import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  setConversations,
  setSelectedConversation,
  setMessages,
  addMessage,
  updateMessage,
  clearNewMessages,
} from "../redux/slices/messagingSlice";
import {
  Search,
  Send,
  Paperclip,
  Smile,
  MoreHorizontal,
  Phone,
  Video,
  Info,
  ChevronLeft,
  X,
  Check,
  CheckCheck,
  Clock,
  ArrowLeft,
  Download,
  Trash2,
  Star,
  StarOff,
  File,
  ImageIcon,
  MessageSquare,
  Users,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { format, isValid } from "date-fns";
import webSocketSingleton from "../socket";

// Socket.io connection
let socket;

const Messaging = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { conversationId } = useParams();
  const user = useSelector((state) => state.Auth.user);

  const [isLoading, setIsLoading] = useState(true);
  // const [conversations, setConversations] = useState([])
  const [filteredConversations, setFilteredConversations] = useState([]);
  // const [selectedConversation, setSelectedConversation] = useState(null)
  // const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [filter, setFilter] = useState("all");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const selectedConversation = useSelector(
    (state) => state.messaging.selectedConversation
  );
  const messages = useSelector((state) => state.messaging.messages || []);
  const [showZoomPopup, setShowZoomPopup] = useState(false);
  const [zoomTopic, setZoomTopic] = useState("");
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);
  const [meetingData, setMeetingData] = useState(null);

  const conversations = useSelector((state) => state.messaging.conversations);

  // console.log(messages,'ae ne message')
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const token = localStorage.getItem("authToken");
  //messages chats redux store

  // Check if user is authenticated
  useEffect(() => {
    if (!user) {
      navigate("/login", {
        state: {
          from: "/messaging",
          message: "Please login to access messaging",
        },
      });
      return;
    }

    // Initialize socket connection

    // Fetch conversations
    fetchConversations();

    // If conversationId is provided in URL, load that conversation
    if (conversationId) {
      fetchConversationById(conversationId);
    }

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
      if (recordingInterval) {
        clearInterval(recordingInterval);
      }
    };
  }, [user, navigate, conversationId]);

  // Initialize Socket.io connection

  // Fetch all conversations
  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        "http://localhost:5000/api/messages/conversations",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)``;
      }

      const data = await response.json();
      // console.log("Conversations API response:", data.message.conversations) // Debug log

      if (!data || !data.data || !Array.isArray(data.message.conversations)) {
        throw new Error("Invalid response structure");
      }

      // setConversations(data.message.conversations)
      dispatch(setConversations(data.message.conversations));
      setFilteredConversations(data.message.conversations);

      // If no conversation is selected and we have conversations, select the first one
      if (
        !selectedConversation &&
        data.message.conversations.length > 0 &&
        !conversationId
      ) {
        handleSelectConversation(data.message.conversations[0]);
      }
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
      setError("Failed to load conversations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch a specific conversation by ID
  const fetchConversationById = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/messages/conversations/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch conversation");
      }

      const data = await response.json();
      console.log("Conversation API response:", data); // Debug log

      // Find the conversation in our list or fetch it if not found
      const conversation = conversations.find((c) => c._id === id);

      // setSelectedConversation(conversation)
      dispatch(setSelectedConversation(conversation));
      dispatch(setMessages(data.message.messages));
      scrollToBottom();

      // Join the conversation room
    } catch (err) {
      console.error("Failed to fetch conversation:", err);
      setError("Failed to load conversation. Please try again.");
    }
  };

  useEffect(() => {
    console.log(conversations, "these are convos");
  }, [conversations]);
  // Fetch messages for a conversation
  const fetchMessages = async (conversationId, page = 1) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/messages/conversations/${conversationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      const data = await response.json();
      console.log("Messages API response:", data); // Debug log

      if (page === 1) {
        dispatch(setMessages(data.message.messages));
        scrollToBottom();
      } else {
        // Prepend older messages
        dispatch(setMessages([...data.message.messages, ...messages]));
      }

      // Check if there are more messages to load
      setHasMoreMessages(data.message.page < data.message.totalPages);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      setError("Failed to load messages. Please try again.");
    }
  };

  // Load more messages when scrolling up
  const handleLoadMoreMessages = () => {
    if (hasMoreMessages && selectedConversation) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMessages(selectedConversation._id, nextPage);
    }
  };

  // Handle selecting a conversation
  const handleSelectConversation = (conversation) => {
    // setSelectedConversation(conversation)
    dispatch(setSelectedConversation(conversation));
    setPage(1);
    setHasMoreMessages(true);
    fetchMessages(conversation._id, 1);

    // Join the conversation room

    // Update URL without reloading
    navigate(`/client/messages/${conversation._id}`, { replace: true });

    // Reset unread count for this conversation
    if (conversation.unreadCount > 0) {
      // Update locally
      // setConversations((prev) => prev.map((c) => (c._id === conversation._id ? { ...c, unreadCount: 0 } : c)))
      dispatch(
        setConversations((prev) =>
          prev.map((c) =>
            c._id === conversation._id ? { ...c, unreadCount: 0 } : c
          )
        )
      );
      setFilteredConversations((prev) =>
        prev.map((c) =>
          c._id === conversation._id ? { ...c, unreadCount: 0 } : c
        )
      );
    }

    // Close user info panel on mobile
    if (window.innerWidth < 768) {
      setShowUserInfo(false);
    }
  };

  // Create a new conversation
  const createConversation = async (userId, jobId = null) => {
    try {
      const payload = { userId };
      if (jobId) payload.jobId = jobId;

      const response = await fetch(
        "http://localhost:5000/api/messages/conversations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create conversation");
      }

      const data = await response.json();

      // Add to conversations list and select it
      // setConversations((prev) => [data.data.conversation, ...prev])
      dispatch(setConversations((prev) => [data.data.conversation, ...prev]));
      setFilteredConversations((prev) => [data.data.conversation, ...prev]);
      handleSelectConversation(data.data.conversation);

      return data.data.conversation;
    } catch (err) {
      console.error("Failed to create conversation:", err);
      setError("Failed to start conversation. Please try again.");
      return null;
    }
  };

  // Send a message
  const sendMessage = async (customMessage = null) => {
    const messageToSend = customMessage || newMessage.trim();
    if (!messageToSend || !selectedConversation || isSending) return;

    setIsSending(true);

    try {
      const tempId = `temp-${Date.now()}`;
      const currentTime = new Date().toISOString();

      const tempMessage = {
        _id: tempId,
        sender: {
          _id: user._id,
          name: user.name,
          profileImage: user.profilePic,
        },
        content: messageToSend,
        createdAt: currentTime,
        timestamp: currentTime,
        isRead: false,
        status: "sent",
        isTempMessage: true,
      };

      dispatch(addMessage(tempMessage));
      scrollToBottom();
      if (!customMessage) setNewMessage(""); // Only clear if it's not a custom message

      const response = await fetch("http://localhost:5000/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversation: selectedConversation._id,
          content: messageToSend,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();
      console.log("Message sent successfully:", data);

      const otherParticipant = selectedConversation.participants.find(
        (p) => p._id !== data.message.message.sender._id
      );

      const otherParticipantId = otherParticipant?._id;

      webSocketSingleton.sendMessage({
        conversationId: selectedConversation._id,
        message: data.message.message,
        receiverId: otherParticipantId,
      });

      // Update messages with the sent message
      dispatch(
        updateMessage({
          conversationId: selectedConversation._id,
          tempId: tempId,
          updatedMessage: { ...data.message.message, status: "sent" },
        })
      );

      // Update conversation with new message
      updateConversationWithNewMessage(
        selectedConversation._id,
        data.message.message
      );
    } catch (error) {
      console.error("Failed to send message:", error);
      dispatch(
        updateMessage({
          conversationId: selectedConversation._id,
          tempId: tempId,
          updatedMessage: { ...tempMessage, status: "failed" },
        })
      );
      setError("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    if (!selectedConversation) return;

    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsSending(true);

    try {
      const formData = new FormData();
      formData.append("conversationId", selectedConversation._id);
      formData.append("senderId", user._id);

      // Add files to form data
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }

      // Optimistically add message to UI
      const tempId = `temp-${Date.now()}`;
      const tempMessage = {
        _id: tempId,
        sender: user._id,
        content: `Sent ${files.length > 1 ? "files" : "a file"}`,
        createdAt: new Date().toISOString(),
        isRead: false,
        status: "sending",
        isTempMessage: true,
        attachments: Array.from(files).map((file) => ({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          tempUrl: URL.createObjectURL(file),
        })),
      };
      dispatch(
        updateMessage({
          conversationId: selectedConversation._id,
          tempId: tempId,
          updatedMessage: { ...tempMessage, status: "failed" },
        })
      );
      scrollToBottom();

      // Send files to server
      const response = await fetch("http://localhost:5000/api/messages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to send files");
      }

      const data = await response.json();

      // Replace temp message with actual message
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempId ? { ...data, status: "sent" } : msg
        )
      );

      // Update conversation with new message
      updateConversationWithNewMessage(selectedConversation._id, data);

      // Emit socket event

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Failed to send files:", err);

      // Mark temp message as failed
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempId ? { ...msg, status: "failed" } : msg
        )
      );

      setError("Failed to send files. Please try again.");
    } finally {
      setIsSending(false);
      setShowAttachmentOptions(false);
    }
  };

  // Update conversation list with new message
  const updateConversationWithNewMessage = (conversationId, message) => {
    dispatch(
      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if (conv._id === conversationId) {
            // Increment unread count if message is from other user and conversation is not selected
            const isFromOtherUser = message.sender !== user._id;
            const isCurrentConversation =
              selectedConversation &&
              selectedConversation._id === conversationId;

            return {
              ...conv,
              lastMessage: message,
              unreadCount:
                isFromOtherUser && !isCurrentConversation
                  ? (conv.unreadCount || 0) + 1
                  : conv.unreadCount || 0,
            };
          }
          return conv;
        });

        // Sort conversations to put the one with new message at top
        return updated.sort((a, b) => {
          if (a._id === conversationId) return -1;
          if (b._id === conversationId) return 1;
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        });
      })
    );
    // Also update filtered conversations
    setFilteredConversations((prev) => {
      const updated = prev.map((conv) => {
        if (conv._id === conversationId) {
          const isFromOtherUser = message.sender !== user._id;
          const isCurrentConversation =
            selectedConversation && selectedConversation._id === conversationId;

          return {
            ...conv,
            lastMessage: message,
            unreadCount:
              isFromOtherUser && !isCurrentConversation
                ? (conv.unreadCount || 0) + 1
                : conv.unreadCount || 0,
          };
        }
        return conv;
      });

      // Sort conversations to put the one with new message at top
      return updated.sort((a, b) => {
        if (a._id === conversationId) return -1;
        if (b._id === conversationId) return 1;
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });
    });
  };

  // Delete a message
  const deleteMessage = async (messageId) => {
    if (!messageId) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/messages/${messageId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete message");
      }

      // Remove message from UI
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));

      // Emit socket event
    } catch (err) {
      console.error("Failed to delete message:", err);
      setError("Failed to delete message. Please try again.");
    }
  };

  // Delete a conversation
  const deleteConversation = async (conversationId) => {
    if (!conversationId) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/messages/conversations/${conversationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete conversation");
      }

      // Remove conversation from UI
      console.log("conversaton");
      // setConversations((prev) => prev.filter((conv) => conv._id !== conversationId))
      dispatch(
        setConversations((prev) =>
          prev.filter((conv) => conv._id !== conversationId)
        )
      );
      setFilteredConversations((prev) =>
        prev.filter((conv) => conv._id !== conversationId)
      );

      // If the deleted conversation was selected, clear selection
      if (selectedConversation && selectedConversation._id === conversationId) {
        // setSelectedConversation(null)
        dispatch(setSelectedConversation(null));
        setMessages([]);
        navigate("/client/messages", { replace: true });
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
      setError("Failed to delete conversation. Please try again.");
    }
  };

  // Handle search
  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    if (!query.trim()) {
      setFilteredConversations(conversations);
      return;
    }

    const filtered = conversations.filter((conv) => {
      // Search in participant names
      const fullName =
        conv.participants.find((p) => p._id !== user._id)?.name || "";

      // Search in last message
      const lastMessageContent = conv.lastMessage?.content?.toLowerCase() || "";

      // Search in job title if exists
      const jobTitle = conv.job?.title?.toLowerCase() || "";

      return (
        fullName.includes(query) ||
        lastMessageContent.includes(query) ||
        jobTitle.includes(query)
      );
    });

    setFilteredConversations(filtered);
  };

  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);

    if (newFilter === "all") {
      setFilteredConversations(conversations);
    } else if (newFilter === "unread") {
      setFilteredConversations(conversations.filter((c) => c.unreadCount > 0));
    } else if (newFilter === "starred") {
      setFilteredConversations(conversations.filter((c) => c.isStarred));
    }
  };

  // Toggle star conversation
  const toggleStar = (conversation, e) => {
    e.stopPropagation();

    // In a real app, you would make an API call to update the star status
    // For now, we'll just update the UI

    // setConversations((prev) => prev.map((c) => (c._id === conversation._id ? { ...c, isStarred: !c.isStarred } : c)))
    dispatch(
      setConversations((prev) =>
        prev.map((c) =>
          c._id === conversation._id ? { ...c, isStarred: !c.isStarred } : c
        )
      )
    );

    setFilteredConversations((prev) =>
      prev.map((c) =>
        c._id === conversation._id ? { ...c, isStarred: !c.isStarred } : c
      )
    );

    if (selectedConversation && selectedConversation._id === conversation._id) {
      dispatch(
        setSelectedConversation({
          ...selectedConversation,
          isStarred: !selectedConversation.isStarred,
        })
      );
    }
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  // Format time for messages

  const formatMessageTime = (dateString) => {
    if (!dateString) return "Unknown";

    const date = new Date(dateString);
    if (!isValid(date)) {
      console.error("Invalid date:", dateString);
      return "Unknown";
    }

    const now = new Date();

    // If today, show time like "2:30 PM"
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // If yesterday, show "Yesterday"
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }

    // If within last 6 days (this week), show weekday name (e.g., "Mon", "Tue")
    const sixDaysAgo = new Date();
    sixDaysAgo.setDate(now.getDate() - 6);
    if (date >= sixDaysAgo && date < now) {
      return date.toLocaleDateString([], { weekday: "short" });
    }

    // Otherwise show short date like "Apr 25"
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  // Format time for conversations
  const formatConversationTime = (dateString) => {
    if (!dateString) return "Unknown";

    const date = new Date(dateString);
    if (!isValid(date)) {
      console.error("Invalid date:", dateString);
      return "Unknown";
    }
    return format(date, "HH:mm");
  };

  // Get message status icon
  const getMessageStatusIcon = (status) => {
    switch (status) {
      case "sending":
        return <Clock size={14} className="text-gray-400" />;
      case "sent":
        return <Check size={14} className="text-gray-400" />;
      case "delivered":
        return <Check size={14} className="text-gray-400" />;
      case "read":
        return <CheckCheck size={14} className="text-[#9333EA]" />;
      case "failed":
        return <X size={14} className="text-red-500" />;
      default:
        return null;
    }
  };

  const createZoomMeeting = async (topic) => {
    try {
      const response = await fetch("http://localhost:5000/api/zoom/meeting", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Assuming you have the token available
        },
        body: JSON.stringify({ topic: topic }),
      });

      if (!response.ok) {
        throw new Error("Failed to create Zoom meeting");
      }

      const data = await response.json();
      return {
        start_url: data.start_url,
        id: data.id,
        password: data.password,
        topic: data.topic,
      };
    } catch (error) {
      console.error("Error creating Zoom meeting:", error);
      throw error;
    }
  };

  const handleCreateZoomMeeting = async () => {
    if (!zoomTopic.trim() || !selectedConversation) return;
    setIsCreatingMeeting(true);
    try {
      const meetingData = await createZoomMeeting(zoomTopic);
  
      setMeetingData(meetingData);
    

      // Prepare the message content

      const messageContent = `
Zoom Meeting Created:
Topic: ${meetingData.topic}



`;
      // Send the Zoom meeting link as a message
      // await sendMessage(messageContent);
    } catch (error) {
      console.error("Failed to create Zoom meeting:", error);
      setError("Failed to create Zoom meeting. Please try again.");
    } finally {
      setIsCreatingMeeting(false);
    }
  };
  // Get other participant in conversation
  const getOtherParticipant = (conversation) => {
    if (!conversation || !conversation.participants) return null;
    return conversation.participants.find((p) => p._id !== user._id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-[#9333EA] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-white">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className=" bg-[#0a0a0f] text-white">
      <Navbar />
      <div className="flex flex-col">
        {/* Header */}
        {/* <div className="bg-gradient-to-r mb-6 h-[0px] from-[#9333EA]/20 to-[#0a0a0f] border-b border-[#2d2d3a] flex items-center">
          <div className="container mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => navigate(-1)}
                  className="mr-4 p-2 rounded-full hover:bg-[#1e1e2d] transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold">Messages</h1>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-full hover:bg-[#1e1e2d] transition-colors">
                  <Search size={20} />
                </button>
                <button className="p-2 rounded-full hover:bg-[#1e1e2d] transition-colors">
                  <MoreHorizontal size={20} />
                </button>
              </div>
            </div>
          </div>
        </div> */}

        {/* Error message */}
        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-2 text-sm">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-400 hover:text-red-300"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex h-[100%] overflow-hidden">
          {/* Conversations List */}
          <div
            className={`w-full md:w-80 lg:w-96 border-r border-[#2d2d3a] flex flex-col ${
              selectedConversation && window.innerWidth < 768 ? "hidden" : ""
            }`}
          >
            {/* Search and Filter */}
            <div className="p-4 border-b border-[#2d2d3a]">
              {/* <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 bg-[#1e1e2d] border border-[#2d2d3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
                />
              </div> */}

              {/* <div className="flex mt-3 border-b border-[#2d2d3a]">
                <button
                  onClick={() => handleFilterChange("all")}
                  className={`px-3 py-2 text-sm font-medium ${
                    filter === "all" ? "text-[#9333EA] border-b-2 border-[#9333EA]" : "text-gray-400 hover:text-white"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => handleFilterChange("unread")}
                  className={`px-3 py-2 text-sm font-medium ${
                    filter === "unread"
                      ? "text-[#9333EA] border-b-2 border-[#9333EA]"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Unread
                </button>
                <button
                  onClick={() => handleFilterChange("starred")}
                  className={`px-3 py-2 text-sm font-medium ${
                    filter === "starred"
                      ? "text-[#9333EA] border-b-2 border-[#9333EA]"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Starred
                </button>
              </div> */}
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                  <div className="bg-[#1e1e2d] p-4 rounded-full mb-4">
                    <MessageSquare size={24} className="text-gray-400" />
                  </div>
                  <p className="text-gray-400">No conversations found</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {filter === "all"
                      ? "Start a new conversation by messaging a freelancer"
                      : filter === "unread"
                      ? "You have no unread messages"
                      : "You have no starred conversations"}
                  </p>
                </div>
              ) : (
                filteredConversations?.map((conversation) => {
                  const otherParticipant = getOtherParticipant(conversation);
                  return (
                    <div
                      key={conversation._id}
                      onClick={() => handleSelectConversation(conversation)}
                      className={`flex items-center p-4 border-b border-[#2d2d3a] cursor-pointer hover:bg-[#1e1e2d] transition-colors ${
                        selectedConversation &&
                        selectedConversation._id === conversation._id
                          ? "bg-[#1e1e2d]"
                          : ""
                      }`}
                    >
                      <div className="relative mr-3">
                        <div className="h-12 w-12 rounded-full overflow-hidden">
                          <img
                            src={
                              otherParticipant?.profilePic ||
                              "/placeholder.svg?height=48&width=48"
                            }
                            alt={`${otherParticipant?.name || "User"}'s avatar`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        {otherParticipant?.isOnline && (
                          <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-[#0a0a0f]"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium truncate">
                            {otherParticipant
                              ? `${otherParticipant.name}`
                              : "Unknown User"}
                          </h3>
                          <div className="flex items-center">
                            {/* <button
                              onClick={(e) => toggleStar(conversation, e)}
                              className="p-1 text-gray-400 hover:text-[#9333EA]"
                            >
                              {conversation.isStarred ? (
                                <Star size={14} className="text-[#9333EA] fill-[#9333EA]" />
                              ) : (
                                <StarOff size={14} />
                              )}
                            </button> */}
                            <span className="text-xs text-gray-400 ml-1">
                              {formatConversationTime(conversation.updatedAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <p
                            className={`text-sm truncate ${
                              conversation.unreadCount > 0
                                ? "text-white font-medium"
                                : "text-gray-400"
                            }`}
                          >
                            {conversation.lastMessage?.sender === user._id &&
                              "You: "}
                            {conversation.lastMessage?.content ||
                              "No messages yet"}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <span className="bg-[#9333EA] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                        {conversation.job && (
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {conversation.job.title}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Area */}
          {selectedConversation ? (
            <div
              className={`flex-1 flex flex-col overflowX-auto maxW-[400px] h-[80vh] ${
                !selectedConversation && window.innerWidth < 768 ? "hidden" : ""
              }`}
            >
              {/* Chat Header */}
              <div className="p-4 border-b border-[#2d2d3a] flex items-center justify-between">
                <div className="flex items-center">
                  {window.innerWidth < 768 && (
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="mr-2 p-2 rounded-full hover:bg-[#1e1e2d] transition-colors"
                    >
                      <ChevronLeft size={20} />
                    </button>
                  )}
                  <div className="relative mr-3">
                    <div className="h-10 w-10 rounded-full overflow-hidden">
                      {getOtherParticipant(selectedConversation) ? (
                        <img
                          src={
                            getOtherParticipant(selectedConversation)
                              ?.profilePic ||
                            "/placeholder.svg?height=40&width=40"
                          }
                          alt={`${
                            getOtherParticipant(selectedConversation)?.name ||
                            "User"
                          }`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-[#2d2d3a] flex items-center justify-center">
                          <Users size={20} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    {getOtherParticipant(selectedConversation)?.isOnline && (
                      <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-[#0a0a0f]"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">
                      {getOtherParticipant(selectedConversation)
                        ? `${getOtherParticipant(selectedConversation).name}`
                        : "Unknown User"}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {/* {getOtherParticipant(selectedConversation)?.isOnline ? "Online" : "Offline"} */}
                      {selectedConversation.job && (
                        <>{selectedConversation.job.title}</>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowZoomPopup(true)}
                    className="p-2 rounded-full hover:bg-[#1e1e2d] transition-colors"
                  >
                    <Phone size={18} />
                  </button>

                  {showZoomPopup && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-[#1e1e2d] p-6 rounded-lg w-96">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold">
                            Create Zoom Meeting
                          </h3>
                          <button
                            onClick={() => {
                              setShowZoomPopup(false);
                              setZoomTopic("");
                            }}
                            className="text-gray-400 hover:text-white"
                          >
                            <X size={20} />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={zoomTopic}
                          onChange={(e) => setZoomTopic(e.target.value)}
                          placeholder="Enter meeting topic"
                          className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#2d2d3a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent mb-4"
                        />
                        {isCreatingMeeting ? (
                          <div className="flex items-center justify-center py-2">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Creating...
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={handleCreateZoomMeeting}
                              disabled={!zoomTopic.trim()}
                              className={`w-full py-2 rounded-md ${
                                !zoomTopic.trim()
                                  ? "bg-[#2d2d3a] text-gray-400 cursor-not-allowed"
                                  : "bg-[#9333EA] text-white hover:bg-[#7e22ce]"
                              }`}
                            >
                              Create Meeting
                            </button>
                            {meetingData && (
                              <div className="mt-4 p-3 bg-[#0a0a0f] rounded-md">
                                <p className="text-sm text-gray-300 mb-2">
                                  Meeting URL:
                                </p>
                                <a
                                  href={meetingData.start_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#9333EA] hover:underline break-all text-sm"
                                >
                                  {meetingData.start_url}
                                </a>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  {/* <button className="p-2 rounded-full hover:bg-[#1e1e2d] transition-colors">
                    <Video size={18} />
                  </button> */}
                  {/* <button
                    onClick={() => setShowUserInfo(!showUserInfo)}
                    className={`p-2 rounded-full transition-colors ${showUserInfo ? "bg-[#1e1e2d]" : "hover:bg-[#1e1e2d]"}`}
                  >
                    <Info size={18} />
                  </button> */}
                </div>
              </div>

              {/* Messages */}
              <div
                className="flex-1 overflow-y-auto p-4 space-y-4"
                ref={messagesContainerRef}
                onScroll={(e) => {
                  // Load more messages when scrolling to top
                  if (e.target.scrollTop === 0 && hasMoreMessages) {
                    handleLoadMoreMessages();
                  }
                }}
              >
                {messages?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="bg-[#1e1e2d] p-4 rounded-full mb-4">
                      <MessageSquare size={24} className="text-[#9333EA]" />
                    </div>
                    <p className="text-gray-400">No messages yet</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Start the conversation by sending a message
                    </p>
                  </div>
                ) : (
                  <>
                    {hasMoreMessages && (
                      <div className="flex justify-center">
                        <button
                          onClick={handleLoadMoreMessages}
                          className="px-4 py-2 bg-[#1e1e2d] text-gray-400 rounded-full text-sm hover:bg-[#2d2d3a]"
                        >
                          Load more messages
                        </button>
                      </div>
                    )}

                    {messages?.map((message, index) => {
                      // Check if we need to show date separator
                      const showDateSeparator =
                        index === 0 ||
                        new Date(message.createdAt).toDateString() !==
                          new Date(
                            messages[index - 1].createdAt
                          ).toDateString();

                      const isUserMessage = message.sender?._id === user._id;

                      return (
                        <div key={message._id || `temp-${index}`}>
                          {showDateSeparator && (
                            <div className="flex items-center justify-center my-4">
                              <div className="bg-[#1e1e2d] px-3 py-1 rounded-full text-xs text-gray-400">
                                {new Date(message.createdAt).toLocaleDateString(
                                  [],
                                  {
                                    weekday: "long",
                                    month: "long",
                                    day: "numeric",
                                  }
                                )}
                              </div>
                            </div>
                          )}

                          <div
                            className={`flex ${
                              isUserMessage ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`flex max-w-[75%] ${
                                isUserMessage ? "flex-row-reverse" : ""
                              }`}
                            >
                              {!isUserMessage && (
                                <div className="h-8 w-8 rounded-full overflow-hidden mr-2 flex-shrink-0">
                                  <img
                                    src={
                                      getOtherParticipant(selectedConversation)
                                        ?.profilePic ||
                                      "/placeholder.svg?height=32&width=32"
                                    }
                                    alt="Avatar"
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              )}
                              <div>
                                <div
                                  className={`rounded-lg p-3 ${
                                    isUserMessage
                                      ? "bg-[#9333EA] text-white"
                                      : "bg-[#1e1e2d] text-white"
                                  }`}
                                >
                                  {message.content}

                                  {/* Attachments */}
                                  {message.attachments &&
                                    message.attachments.length > 0 && (
                                      <div className="mt-2 space-y-2">
                                        {message?.attachments.map(
                                          (attachment, idx) => {
                                            const isImage =
                                              attachment.fileType?.startsWith(
                                                "image/"
                                              ) ||
                                              attachment.fileName?.match(
                                                /\.(jpg|jpeg|png|gif|webp)$/i
                                              );

                                            if (isImage) {
                                              return (
                                                <div
                                                  key={idx}
                                                  className="rounded-lg overflow-hidden"
                                                >
                                                  <img
                                                    src={
                                                      attachment.tempUrl ||
                                                      attachment.filePath
                                                    }
                                                    alt={
                                                      attachment.fileName ||
                                                      "Image"
                                                    }
                                                    className="max-w-full rounded"
                                                  />
                                                </div>
                                              );
                                            } else {
                                              return (
                                                <div
                                                  key={idx}
                                                  className="bg-[#0a0a0f]/50 rounded-lg p-3 flex items-center"
                                                >
                                                  <div className="bg-[#2d2d3a] p-2 rounded-md mr-3">
                                                    <File
                                                      size={24}
                                                      className="text-[#9333EA]"
                                                    />
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">
                                                      {attachment.fileName}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                      {attachment.fileSize
                                                        ? `${Math.round(
                                                            attachment.fileSize /
                                                              1024
                                                          )} KB`
                                                        : "Unknown size"}
                                                    </p>
                                                  </div>
                                                  <a
                                                    href={attachment.filePath}
                                                    download={
                                                      attachment.fileName
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 text-gray-400 hover:text-white"
                                                  >
                                                    <Download size={18} />
                                                  </a>
                                                </div>
                                              );
                                            }
                                          }
                                        )}
                                      </div>
                                    )}
                                </div>
                                <div
                                  className={`flex items-center mt-1 text-xs text-gray-400 ${
                                    isUserMessage ? "justify-end" : ""
                                  }`}
                                >
                                  <span>
                                    {message.timestamp
                                      ? formatMessageTime(message.timestamp)
                                      : message.createdAt
                                      ? formatMessageTime(message.createdAt)
                                      : "Unknown time"}
                                  </span>
                                  {isUserMessage && message.status && (
                                    <span className="ml-1">
                                      {getMessageStatusIcon(message.status)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-[#2d2d3a]">
                <div className="flex items-end gap-2">
                  <div className="relative">
                    {/* <button
                      onClick={() => setShowAttachmentOptions(!showAttachmentOptions)}
                      className="p-2 rounded-full hover:bg-[#1e1e2d] transition-colors"
                    >
                      <Paperclip size={20} />
                    </button> */}
                    {showAttachmentOptions && (
                      <div className="absolute bottom-full left-0 mb-2 bg-[#1e1e2d] rounded-lg border border-[#2d2d3a] shadow-lg p-2">
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => {
                              fileInputRef.current?.setAttribute(
                                "accept",
                                "*/*"
                              );
                              fileInputRef.current?.click();
                            }}
                            className="flex items-center gap-2 p-2 hover:bg-[#2d2d3a] rounded-md transition-colors"
                          >
                            <File size={16} />
                            <span>File</span>
                          </button>
                          <button
                            onClick={() => {
                              fileInputRef.current?.setAttribute(
                                "accept",
                                "image/*"
                              );
                              fileInputRef.current?.click();
                            }}
                            className="flex items-center gap-2 p-2 hover:bg-[#2d2d3a] rounded-md transition-colors"
                          >
                            <ImageIcon size={16} />
                            <span>Image</span>
                          </button>
                        </div>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileUpload}
                      multiple
                    />
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Type a message..."
                      ref={messageInputRef}
                      className="w-full px-4 py-3 bg-[#1e1e2d] border border-[#2d2d3a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent pr-10"
                    />
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <Smile size={20} />
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-full right-0 mb-2 bg-[#1e1e2d] rounded-lg border border-[#2d2d3a] shadow-lg p-2">
                        <div className="grid grid-cols-8 gap-2">
                          {[
                            "😊",
                            "😂",
                            "❤️",
                            "👍",
                            "🎉",
                            "🔥",
                            "👏",
                            "😎",
                            "🤔",
                            "😢",
                            "😍",
                            "🙏",
                            "👌",
                            "🤣",
                            "😁",
                            "😉",
                          ].map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => {
                                setNewMessage((prev) => prev + emoji);
                                setShowEmojiPicker(false);
                                messageInputRef.current?.focus();
                              }}
                              className="w-8 h-8 flex items-center justify-center hover:bg-[#2d2d3a] rounded-md transition-colors text-lg"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isSending}
                    className={`p-3 rounded-full ${
                      !newMessage.trim() || isSending
                        ? "bg-[#1e1e2d] text-gray-400 cursor-not-allowed"
                        : "bg-[#9333EA] text-white hover:bg-[#7e22ce]"
                    }`}
                  >
                    {isSending ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-[#0a0a0f] p-4">
              <div className="text-center">
                <div className="bg-[#1e1e2d] p-6 rounded-full inline-block mb-4">
                  <MessageSquare size={32} className="text-[#9333EA]" />
                </div>
                <h3 className="text-xl font-bold mb-2">Your Messages</h3>
                <p className="text-gray-400 max-w-md">
                  Select a conversation from the list to start messaging
                </p>
              </div>
            </div>
          )}

          {/* User Info Panel */}
          {selectedConversation && showUserInfo && (
            <div className="w-80 border-l border-[#2d2d3a] flex flex-col">
              <div className="p-4 border-b border-[#2d2d3a] flex justify-between items-center">
                <h3 className="font-medium">Contact Info</h3>
                <button
                  onClick={() => setShowUserInfo(false)}
                  className="p-2 rounded-full hover:bg-[#1e1e2d] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 flex flex-col items-center border-b border-[#2d2d3a]">
                <div className="h-24 w-24 rounded-full overflow-hidden mb-4">
                  <img
                    src={
                      getOtherParticipant(selectedConversation)?.profilePic ||
                      "/placeholder.svg?height=96&width=96"
                    }
                    alt={`${
                      getOtherParticipant(selectedConversation)?.name || "User"
                    }'s avatar`}
                    className="h-full w-full object-cover"
                  />
                </div>
                <h3 className="text-lg font-bold">
                  {getOtherParticipant(selectedConversation)
                    ? `${getOtherParticipant(selectedConversation).name} ${
                        getOtherParticipant(selectedConversation).lastName
                      }`
                    : "Unknown User"}
                </h3>
                <p className="text-sm text-gray-400 capitalize">
                  {getOtherParticipant(selectedConversation)?.role || "User"}
                </p>
                <div className="flex items-center mt-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      getOtherParticipant(selectedConversation)?.isOnline
                        ? "bg-green-500"
                        : "bg-gray-500"
                    } mr-2`}
                  ></div>
                  <span className="text-sm text-gray-400">
                    {getOtherParticipant(selectedConversation)?.isOnline
                      ? "Online"
                      : "Offline"}
                  </span>
                </div>
              </div>

              {selectedConversation.job && (
                <div className="p-4 border-b border-[#2d2d3a]">
                  <h4 className="text-sm font-medium mb-3">Project Details</h4>
                  <div className="bg-[#1e1e2d] p-3 rounded-lg">
                    <p className="text-sm font-medium">
                      {selectedConversation.job.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Project ID: #{selectedConversation.job._id}
                    </p>
                    <div className="flex items-center mt-2">
                      {/* <button
                        onClick={() => navigate(`/jobs/${selectedConversation.job._id}`)}
                        className="text-xs text-[#9333EA] hover:underline"
                      >
                        View Project
                      </button> */}
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 border-b border-[#2d2d3a]">
                <h4 className="text-sm font-medium mb-3">Actions</h4>
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-2 p-2 bg-[#1e1e2d] hover:bg-[#2d2d3a] rounded-md transition-colors">
                    <Search size={16} />
                    <span className="text-sm">Search in Conversation</span>
                  </button>
                  <button
                    onClick={() => deleteConversation(selectedConversation._id)}
                    className="w-full flex items-center gap-2 p-2 bg-red-900/20 hover:bg-red-900/30 text-red-400 rounded-md transition-colors"
                  >
                    <Trash2 size={16} />
                    <span className="text-sm">Delete Conversation</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messaging;
