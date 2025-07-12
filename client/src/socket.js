import { io } from "socket.io-client";
import {store} from "./redux/Store"
import { addMessage, addNewMessage, setConversations } from './redux/slices/messagingSlice';
import { setMessages } from './redux/slices/messagingSlice';


class WebSocketSingleton {
    socket = null;
    conversations = []; // ⭐ Track joined conversations

    constructor() {
        this.socket = null;
    }

    init(token) {
        this.socket = io("http://localhost:5000", {
            query: { token },
            reconnection: true,
        });

        this.socket.on('connect', () => {
            console.log("Socket connected");

            // After reconnecting, rejoin all conversations
            this.conversations.forEach((conversationId) => {
                this.socket.emit('join', conversationId);
            });
        });

        this.socket.on('disconnect', () => {
            console.log("Socket disconnected");
        });

        this.socket.on("new_message", this.handleNewMessage);
        this.socket.on("message_read", this.handleMessageRead);
        this.socket.on("receive-message", this.handleReceivedMessage);

        this.socket.on('error', this.handleError);
    }

    close() {
        if (this.socket) {
            console.log('Closing Connection');
            this.socket.close();
            this.socket = null;
        }
    }

    getSocket() {
        return this.socket;
    }

    joinConversation(conversationId) {
        if (!this.conversations.includes(conversationId)) {
            this.conversations.push(conversationId);
        }
        this.socket?.emit('join', conversationId);
    }

    leaveConversation(conversationId) {
        this.conversations = this.conversations.filter(id => id !== conversationId);
        this.socket?.emit('leave', conversationId);
    }

    sendMessage({ conversationId, message, receiverId }) {
        console.log("📤 Sending message:", message);
        console.log("Sending message:", conversationId);
        this.socket?.emit("send-message", { conversationId: conversationId, message: message, receiverId });
    }


    listenForOnlineUsers(callback) {
        this.socket?.on("update-online-users", callback);
    }

    handleNewMessage = (data) => {
        console.log("📩 Received new message:", data);

        if (data.conversationId) {
            setMessages((prevMessages) => {
                const existingMessage = prevMessages.find((msg) => msg._id === data.message._id);

                if (existingMessage) return prevMessages;

                const tempIndex = prevMessages.findIndex(
                    (msg) => msg.isTempMessage && msg.content === data.message.content
                );

                if (tempIndex !== -1) {
                    const updatedMessages = [...prevMessages];
                    updatedMessages[tempIndex] = { ...data.message, status: "sent" };
                    return updatedMessages;
                } else {
                    return [...prevMessages, { ...data.message, status: "sent" }];
                }
            });

            updateConversationWithNewMessage(data.conversationId, data.message);
            scrollToBottom();
        }
    };

    handleMessageRead = (data) => {
        setMessages((prevMessages) =>
            prevMessages.map((msg) =>
                msg._id === data.messageId ? { ...msg, isRead: true } : msg
            )
        );
    };

    handleReceivedMessage = (data) => {
      
        console.log("📩 Received message:", data);
        console.log(store.getState().messaging.selectedConversation?._id)
        if (data.conversation === store.getState().messaging.selectedConversation?._id) {
            // store.dispatch(setMessages(data));
            store.dispatch(addMessage(data))
          }
      
          console.log(store.getState().messaging.conversations, "conversations")
          const upadtedConvo = store
            .getState()
            .messaging.conversations?.map(item => {
              if (item._id === data.conversation._id) {
                return {
                  ...item,
                  lastMessage: data,
                  lastMessageTimestamp: data.conversation.lastMessageTimestamp,
                };
              }
              return item;
            })
            .sort((a, b) =>
      a._id === data.conversation
                ? -1
                : new Date(b.lastMessageTimestamp).getTime() -
                  new Date(a.lastMessageTimestamp).getTime(),
            );
      
          upadtedConvo && store.dispatch(setConversations(upadtedConvo));
        console.log("📥 Received message (separate handler):", data);
    };

    handleError = (error) => {
        console.error("⚠️ Socket error:", error);
    };
}

const webSocketSingleton = new WebSocketSingleton();
export default webSocketSingleton;
