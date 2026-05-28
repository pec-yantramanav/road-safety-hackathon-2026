import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ToastAlert {
  id: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  message: string;
  timestamp: string;
}

export type ThemeType = 'light' | 'dark';

interface UIState {
  sidebarOpen: boolean;
  toasts: ToastAlert[];
  theme: ThemeType;
}

// Default to light theme as the main focus, reading preference from localStorage if it exists
const savedTheme = localStorage.getItem('roadwatch_crm_theme') as ThemeType;
const initialTheme: ThemeType = savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : 'light';

const initialState: UIState = {
  sidebarOpen: true,
  toasts: [],
  theme: initialTheme,
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
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('roadwatch_crm_theme', state.theme);
    },
    setTheme: (state, action: PayloadAction<ThemeType>) => {
      state.theme = action.payload;
      localStorage.setItem('roadwatch_crm_theme', action.payload);
    }
  }
});

export const { toggleSidebar, setSidebarOpen, addToast, removeToast, toggleTheme, setTheme } = uiSlice.actions;
export default uiSlice.reducer;
