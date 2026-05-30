import { useAuthStore } from '../state/authStore';
import { useState } from 'react';
import axios from 'axios';
import { apiClient } from '../api/client/apiClient';

export const useAuthController = () => {
  const { accessToken, isAuthenticated, user, setTokens, clearAuth } = useAuthStore();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const loginWithPhone = async (phone: string) => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const res = await apiClient.post('/auth/login', { phone });
      const { accessToken: access, refreshToken: refresh, user: userPayload } = res.data;
      await setTokens(access, refresh, userPayload);
    } catch (e) {
      const errorMsg = axios.isAxiosError(e) && e.response?.data
        ? (typeof e.response.data === 'string' ? e.response.data : JSON.stringify(e.response.data))
        : (e instanceof Error ? e.message : 'Login failed. Please check credentials.');
      setLoginError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const signupUser = async (name: string, phone: string, email: string, aadharNumber: string) => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const res = await apiClient.post('/auth/signup', { name, phone, email, aadharNumber });
      const { accessToken: access, refreshToken: refresh, user: userPayload } = res.data;
      await setTokens(access, refresh, userPayload);
    } catch (e) {
      const errorMsg = axios.isAxiosError(e) && e.response?.data
        ? (typeof e.response.data === 'string' ? e.response.data : JSON.stringify(e.response.data))
        : (e instanceof Error ? e.message : 'Registration failed.');
      setLoginError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logoutUser = async () => {
    await clearAuth();
  };

  return {
    accessToken,
    isAuthenticated,
    user,
    isLoggingIn,
    loginError,
    login: loginWithPhone,
    signup: signupUser,
    logout: logoutUser
  };
};
