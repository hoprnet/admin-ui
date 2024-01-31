import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { actionsAsync, createAsyncReducer } from './actionsAsync';
import { createFetchingReducer } from './actionsFetching';
import { initialState } from './initialState';

const safeSlice = createSlice({
  name: 'safe',
  initialState,
  reducers: {
    resetState: () => initialState,
    resetStateWithoutSelectedSafe: (state) => {
      const selectedSafeAddress = state.selectedSafeAddress;
      const initialStateCopy = JSON.parse(JSON.stringify(initialState));
      if (selectedSafeAddress) initialStateCopy.selectedSafeAddress = selectedSafeAddress;
      return initialStateCopy;
    },
    setSelectedSafe(state, action: PayloadAction<string>) {
      state.selectedSafeAddress.data = action.payload;
    },
    setSafeBalance_xDai(state, action) {
      state.balance.data.xDai.value = action.payload ? action.payload.value : null;
      state.balance.data.xDai.formatted = action.payload ? action.payload.formatted : null;
    },
    setSafeBalance_xHopr(state, action) {
      state.balance.data.xHopr.value = action.payload ? action.payload.value : null;
      state.balance.data.xHopr.formatted = action.payload ? action.payload.formatted : null;
    },
    setSafeBalance_wxHopr(state, action) {
      state.balance.data.wxHopr.value = action.payload ? action.payload.value : null;
      state.balance.data.wxHopr.formatted = action.payload ? action.payload.formatted : null;
    },
    setCommunityNftId(state, action: PayloadAction<number>) {
      state.communityNftIds.data = [{ id: String(action.payload) }];
    },
    removeCommunityNftsOwnedBySafe(state, action: PayloadAction<string>) {
      const NftId = action.payload;
      let communityNftIds = state.communityNftIds.data;
      communityNftIds = communityNftIds.filter(elem => { elem.id !== NftId});
      state.communityNftIds.data = communityNftIds;
    },
    addOwnerToSafe: (state, action) => {
      state.info.data?.owners.push(action.payload);
    },
    removeOwnerFromSafe: (state, action) => {
      if(state.info.data?.owners){
        state.info.data.owners = state.info.data.owners.filter(owner => owner !== action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    createAsyncReducer(builder), createFetchingReducer(builder);
  },
});

export const safeActions = safeSlice.actions;
export const safeActionsAsync = actionsAsync;
export default safeSlice.reducer;
