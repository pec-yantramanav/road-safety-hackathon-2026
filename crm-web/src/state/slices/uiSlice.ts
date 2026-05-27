import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ToastAlert {
  id: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  message: string;
  timestamp: string;
}

interface UIState {
  sidebarOpen: boolean;
  toasts: ToastAlert[];
}

const initialState: UIState = {
  sidebarOpen: true,
  toasts: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    addToast: (state, action: PayloadAction<Omit<ToastAlert, 'id' | 'timestamp'>>) => {
      state.toasts.push({
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString(),
        ...action.payload,
      });
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    }
  }
});

export const { toggleSidebar, setSidebarOpen, addToast, removeToast } = uiSlice.actions;
export default uiSlice.reducer;
