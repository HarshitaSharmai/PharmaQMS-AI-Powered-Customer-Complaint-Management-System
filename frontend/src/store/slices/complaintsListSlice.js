import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
  isLoading: false,
  error: null,
};

const complaintsListSlice = createSlice({
  name: "complaintsList",
  initialState,
  reducers: {
    fetchStart(state) {
      state.isLoading = true;
      state.error = null;
    },
    fetchSucceeded(state, action) {
      state.isLoading = false;
      state.items = action.payload;
    },
    fetchFailed(state, action) {
      state.isLoading = false;
      state.error = action.payload;
    },
  },
});

export const { fetchStart, fetchSucceeded, fetchFailed } = complaintsListSlice.actions;
export default complaintsListSlice.reducer;
