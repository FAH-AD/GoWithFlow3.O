import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";

const SOCKET_URL = "http://localhost:5000"; // Adjust to your server
const API_URL = `${SOCKET_URL}/api/messages/conversations`;

const useConversation = ({ user }) => {
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem("authToken");
    if (!token) return;

    const newSocket = io(SOCKET_URL, {
      query: { token },
      transports: ["websocket"],
    });

    setSocket(newSocket);
    socketRef.current = newSocket;

    newSocket.on("connect", () => {
      console.log("WebSocket connected:", newSocket.id);
    });

    newSocket.on("disconnect", () => {
      console.log("WebSocket disconnected");
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const startConversation = async ({ receiverId, jobId = null, onSuccess, onError }) => {
    try {
      const token = localStorage.getItem("authToken");

      const payload = { userId: receiverId };
      if (jobId) payload.jobId = jobId;

      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create conversation");

      const data = await res.json();
      const conversationId = data._id || data.conversationId;

      // Join socket room
      socketRef.current?.emit("join", conversationId);

      if (onSuccess) onSuccess(data);
      else navigate(`/client/messages/${conversationId}`);
    } catch (err) {
      console.error("Conversation start failed:", err);
      if (onError) onError(err);
    }
  };

  return { socket: socketRef.current, startConversation };
};

export default useConversation;
