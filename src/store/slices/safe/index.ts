import { createSlice } from '@reduxjs/toolkit';
import { initialState } from './initialState';
import { actionsAsync, createExtraReducers } from './actionsAsync';

const safeSlice = createSlice({
  name: 'safe',
  initialState,
  reducers: {resetState: (state) => {
    state.recentlyCreatedSafe = null;
    state.selectedSafeAddress = null;
    state.safeInfos = [];
    state.safeTransactions = null;
    state.safesByOwner = [];
  }},
  extraReducers: (builder) => createExtraReducers(builder),
});

export const safeActions = safeSlice.actions;
export const safeActionsAsync = actionsAsync;
export default safeSlice.reducer;
