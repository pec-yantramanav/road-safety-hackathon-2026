import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { GATEWAY_URL, KEYCLOAK_URL } from './config';

// Set default URL to Kong Gateway endpoint for local development
export const BASE_URL = `${GATEWAY_URL}/api/v1/citizen`;

// Toggle to easily switch to mock mode in sandboxed testing environments
export const USE_MOCK = false;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject Keycloak JWT Bearer tokens
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      // Only inject the authorization header if we have a real (non-simulated) token
      if (token && token !== 'simulated-access-jwt-token' && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Failed to load access token from SecureStore', e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle Token Refreshing & Unauthorized errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        // Do not attempt Keycloak token refresh if the token is simulated
        if (refreshToken && refreshToken !== 'simulated-refresh-jwt-token') {
          // Trigger OIDC token refresh from Keycloak using application/x-www-form-urlencoded
          const params = new URLSearchParams();
          params.append('grant_type', 'refresh_token');
          params.append('client_id', 'citizen-app');
          params.append('refresh_token', refreshToken);

          const refreshRes = await axios.post(
            `${KEYCLOAK_URL}/realms/roadwatch/protocol/openid-connect/token`,
            params.toString(),
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
            }
          );
          const { access_token, refresh_token } = refreshRes.data;
          
          await SecureStore.setItemAsync('access_token', access_token);
          await SecureStore.setItemAsync('refresh_token', refresh_token);
          
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('Keycloak token refresh failed', refreshError);
        // Clear tokens to trigger logout logic
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
      }
    }
    return Promise.reject(error);
  }
);
