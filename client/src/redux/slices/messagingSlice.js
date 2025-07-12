import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  conversations: [],
  selectedConversation: null,
  messages: [],
  newMessages: [],
};

const messagingSlice = createSlice({
  name: 'messaging',
  initialState,
  reducers: {
    setConversations: (state, action) => {
      state.conversations = action.payload;
    },
    setSelectedConversation: (state, action) => {
      state.selectedConversation = action.payload;
    },
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    addMessage: (state, action) => {
      console.log("state messages", action.payload)
      state.messages = [ ...(state.messages || []),action.payload];
    },
    addNewMessage: (state, action) => {
      const { conversationId, message } = action.payload;
      if (!state.newMessages[conversationId]) {
        state.newMessages[conversationId] = [];
      }
      state.newMessages[conversationId].push(message);
    },
    clearNewMessages: (state, action) => {
      const conversationId = action.payload;
      state.newMessages[conversationId] = [];
    },
    updateMessage: (state, action) => {
      const { conversationId, tempId, updatedMessage } = action.payload;
      if (state.messages[conversationId]) {
        const messageIndex = state.messages[conversationId].findIndex(
          (msg) => msg.isTempMessage && msg._id === tempId
        );
        if (messageIndex !== -1) {
          state.messages[conversationId][messageIndex] = {
            ...updatedMessage,
            status: "sent",
          };
        } else {
          state.messages[conversationId].push({ ...updatedMessage, status: "sent" });
        }
      }
    },
  },
});

export const {
  setConversations,
  setSelectedConversation,
  setMessages,
  addMessage,
  addNewMessage,
  clearNewMessages,
  updateMessage,
} = messagingSlice.actions;

export default messagingSlice.reducer;