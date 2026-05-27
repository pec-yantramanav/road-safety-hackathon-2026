import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { RootState } from '../state/store';
import { setCredentials, logout } from '../state/slices/authSlice';

// All requests route through Kong API Gateway at /api
export const rawBaseQuery = fetchBaseQuery({
  baseUrl: '/api/v1/crm',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);
  
  if (result.error && result.error.status === 401) {
    console.warn('Unauthorized core request, attempting OIDC refresh');
    // In actual prod dashboard, Keycloak refresh endpoint is called
    // If refresh fails, dispatch logout
    api.dispatch(logout());
  }
  return result;
};
