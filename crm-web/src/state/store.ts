import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import uiReducer from './uiSlice';
import { ticketApi } from '../api/ticketApi';
import { workorderApi } from '../api/workorderApi';
import { budgetApi } from '../api/budgetApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    [ticketApi.reducerPath]: ticketApi.reducer,
    [workorderApi.reducerPath]: workorderApi.reducer,
    [budgetApi.reducerPath]: budgetApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(
      ticketApi.middleware,
      workorderApi.middleware,
      budgetApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
