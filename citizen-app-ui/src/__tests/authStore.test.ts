import { useAuthStore } from '../state/authStore';
import * as SecureStore from 'expo-secure-store';

describe('Zustand authStore', () => {
  beforeEach(() => {
    // Reset Zustand store state before each run
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      user: null,
    });
    jest.clearAllMocks();
  });

  it('should successfully store access and refresh tokens, and update isAuthenticated state', async () => {
    const userPayload = { id: 'user-1', name: 'Citizen Jane', phone: '+919999999999' };
    
    await useAuthStore.getState().setTokens('access-token-jwt', 'refresh-token-jwt', userPayload);

    expect(useAuthStore.getState().accessToken).toBe('access-token-jwt');
    expect(useAuthStore.getState().refreshToken).toBe('refresh-token-jwt');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user).toEqual(userPayload);
    
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('access_token', 'access-token-jwt');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('refresh_token', 'refresh-token-jwt');
  });

  it('should clear all credentials and set isAuthenticated to false on logout', async () => {
    // Initialize first
    useAuthStore.setState({
      accessToken: 'token',
      refreshToken: 'refresh',
      isAuthenticated: true,
      user: { id: '1', name: 'Test', phone: '123' },
    });

    await useAuthStore.getState().clearAuth();

    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().refreshToken).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('access_token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('refresh_token');
  });
});
