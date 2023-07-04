import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { initialState } from './initialState';

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    resetState: () => initialState,
    addNotification: (
      state,
      action: PayloadAction<{
        id: string;
        name: string;
        source: string;
        timeout: number | null;
        url: string | null;
      }>,
    ) => {
      const now = Date.now();
      const defaultTimeout = 5000;
      state.notifications.push({
        ...action.payload,
        seen: false,
        interacted: false,
        timeout: action.payload.timeout ?? now + defaultTimeout,
      });
      if (state.notifications.length > 100)
        state.notifications = state.notifications.slice(state.notifications.length - 100, state.notifications.length);
    },
    seenNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.map((notification) =>
        notification.id === action.payload
          ? {
            ...notification,
            seen: true,
          }
          : notification,
      );
    },
    interactedWithNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.map((notification) =>
        notification.id === action.payload
          ? {
            ...notification,
            seen: true,
            interacted: true,
          }
          : notification,
      );
    },
    clearExpiredNotifications: (state) => {
      const now = Date.now();
      state.notifications = state.notifications.map((notification) =>
        notification.timeout < now
          ? {
            ...notification,
            seen: true,
            read: true,
          }
          : notification,
      );
    },
    markSeenAllNotifications: (state) => {
      state.notifications = state.notifications.map((notification) => ({
        ...notification,
        seen: true,
      }));
    },
  },
});

export const appActions = appSlice.actions;
export default appSlice.reducer;
