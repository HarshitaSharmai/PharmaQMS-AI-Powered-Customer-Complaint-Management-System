import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  messages: [
    {
      role: "assistant",
      content:
        "Upload a complaint document or paste text above. I will automatically extract the details and populate the form for you.",
    },
  ],
  isSending: false,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addMessage(state, action) {
      state.messages.push(action.payload);
    },
    setSending(state, action) {
      state.isSending = action.payload;
    },
    clearChat(state) {
      state.messages = initialState.messages;
    },
  },
});

export const { addMessage, setSending, clearChat } = chatSlice.actions;
export default chatSlice.reducer;
