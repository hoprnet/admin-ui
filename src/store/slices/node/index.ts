import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { actionsAsync, createAsyncReducer } from './actionsAsync';
import { createFetchingReducer } from './actionsFetching';
import { initialState } from './initialState';
import { isAddress, getAddress } from 'viem';
import { loadStateFromLocalStorage, saveStateToLocalStorage } from '../../../utils/localStorage';

const nodeSlice = createSlice({
  name: 'node',
  initialState,
  reducers: {
    resetState: () => initialState,
    setInitiating(state) {
      state.status.initiating = true;
    },
    setInitiated(state) {
      state.status.initiating = false;
      state.status.initiated = true;
    },
    setApiEndpoint(state, action) {
      state.apiEndpoint = action.payload.apiEndpoint;
    },
    setInfo(state, action) {
      state.info = action.payload;
    },
    messageReceived(state, action: PayloadAction<(typeof initialState.messages.data)[0]>) {
      state.messages.data.push(action.payload);
      if (state.messages.data.length > 100)
        state.messages.data = state.messages.data.slice(state.messages.data.length - 100, state.messages.data.length);
    },
    // handle checkboxes
    toggleMessageSeen(state, action: PayloadAction<(typeof initialState.messages.data)[0]>) {
      state.messages.data = state.messages.data.map((message) => {
        if (message.id === action.payload.id) {
          return {
            ...message,
            seen: !message.seen,
          };
        }
        return message;
      });
    },
    toggleCheckbox(
      state,
      action: PayloadAction<{
        category: 'peers' | 'channelsIn' | 'channelsOut' | 'sessions';
        id: string;
        checked: boolean;
      }>,
    ) {
      const category = action.payload.category;
      const id = action.payload.id;
      const checked = action.payload.checked;
      if (checked) {
        state.checks[category][id] = true;
      } else {
        delete state.checks[category][id];
      }
    },
    removeAllCheckboxes(
      state,
      action: PayloadAction<{ category: 'peers' | 'channelsIn' | 'channelsOut' | 'sessions' }>,
    ) {
      const category = action.payload.category;
      state.checks[category] = {};
    },
    // handle aliases
    loadAliasesFromLocalStorage(state, action) {
      const nodeAddress = action.payload;
      if (!isAddress(nodeAddress)) return;
      const nodeAddressValidated = getAddress(nodeAddress);
      const aliases = loadStateFromLocalStorage(`node/aliases/${nodeAddressValidated}`) as {
          [key: string]: string;
      } | null;
      if (aliases) {
        state.aliases = aliases;
        Object.keys(aliases).forEach((nodeAddress) => {
          const alias = aliases[nodeAddress];
          state.links.aliasToNodeAddress[alias] = nodeAddress;
        });
      }
    },
    setAlias(state, action: PayloadAction<{ nodeAddress: string; alias: string }>) {
      const nodeAddress = action.payload.nodeAddress;
      const alias = action.payload.alias;
      if (!nodeAddress || !alias || !isAddress(nodeAddress)) return;
      const nodeAddressValidated = getAddress(nodeAddress);
      delete state.links.aliasToNodeAddress[state.aliases[nodeAddressValidated]];
      state.aliases[nodeAddressValidated] = alias;
      state.links.aliasToNodeAddress[alias] = nodeAddressValidated;
      saveStateToLocalStorage(`node/aliases/${state.addresses.data.native}`, state.aliases);
    },
    removeAlias(state, action: PayloadAction<string>) {
      const nodeAddress = action.payload;
      if (state.aliases[nodeAddress]) {
        delete state.links.aliasToNodeAddress[state.aliases[nodeAddress]];
        delete state.aliases[nodeAddress];
      }
      saveStateToLocalStorage(`node/aliases/${state.addresses.data.native}`, state.aliases);
    },
    // handle ws state
    updateMessagesWebsocketStatus(state, action: PayloadAction<typeof initialState.messagesWebsocketStatus>) {
      state.messagesWebsocketStatus = action.payload;
    },
    // user actions to open and close ws
    initializeMessagesWebsocket() {
      // state changes in node middleware
    },
    closeMessagesWebsocket() {
      // state changes in node middleware
    },
    setMessageNotified(state, action: PayloadAction<number>) {
      const index = action.payload;
      if (state.messages && state.messages.data[index]) {
        state.messages.data[index].notified = true;
      }
    },
  },
  extraReducers: (builder) => {
    createAsyncReducer(builder), createFetchingReducer(builder);
  },
});

export const nodeActions = nodeSlice.actions;
export const nodeActionsAsync = actionsAsync;
export default nodeSlice.reducer;
