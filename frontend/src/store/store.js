import { configureStore } from "@reduxjs/toolkit";
import complaintReducer from "./slices/complaintSlice";
import chatReducer from "./slices/chatSlice";
import complaintsListReducer from "./slices/complaintsListSlice";

export const store = configureStore({
  reducer: {
    complaint: complaintReducer,
    chat: chatReducer,
    complaintsList: complaintsListReducer,
  },
});
