import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { OfficerRole, AuthorityType } from '../../types';

export interface KeycloakTokenPayload {
  sub: string;
  name: string;
  email?: string;
  roles: OfficerRole[];
  jurisdiction_id: string;
  authority_type: AuthorityType;
}

interface AuthState {
  token: string | null;
  user: KeycloakTokenPayload | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  token: null,
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ token: string }>) => {
      // Decode JWT token structure directly
      try {
        const parts = action.payload.token.split('.');
        if (parts.length === 3) {
          const payload: KeycloakTokenPayload = JSON.parse(atob(parts[1]));
          state.token = action.payload.token;
          state.user = payload;
          state.isAuthenticated = true;
          return;
        }
      } catch (e) {
        console.error('Error parsing simulated OIDC JWT payload', e);
      }
      
      // Fallback for sandboxed developer mock mode credentials injection
      state.token = action.payload.token;
      state.user = {
        sub: 'mock-officer-sub-uuid',
        name: 'Executive Engineer Sharma',
        roles: ['EE'],
        jurisdiction_id: 'ward-42-id',
        authority_type: 'PWD'
      };
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
    }
  }
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
