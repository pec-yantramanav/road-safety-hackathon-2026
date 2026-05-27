import { useAuthStore } from '../state/authStore';
import { useState } from 'react';
import axios from 'axios';

export const useAuthController = () => {
  const { accessToken, isAuthenticated, user, setTokens, clearAuth } = useAuthStore();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const loginWithPhone = async (phone: string, otp: string) => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      // High fidelity OIDC standard simulation for phone/OTP credentials
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      const simulatedAccessToken = 'simulated-access-jwt-token';
      const simulatedRefreshToken = 'simulated-refresh-jwt-token';
      const userPayload = {
        id: 'user-citizen-99',
        phone,
        name: 'Citizen Jane Doe'
      };

      await setTokens(simulatedAccessToken, simulatedRefreshToken, userPayload);
    } catch (e) {
      setLoginError(e instanceof Error ? e.message : 'Login failed. Please check credentials.');
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
    logout: logoutUser
  };
};
