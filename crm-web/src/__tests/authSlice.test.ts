import authReducer, { setCredentials, logout } from '../state/slices/authSlice';

describe('Redux authSlice', () => {
  const initialState = {
    token: null,
    user: null,
    isAuthenticated: false,
  };

  it('should successfully store access token and parse simulated credentials', () => {
    const payload = { token: 'mock-jwt-token-string' };
    const nextState = authReducer(initialState, setCredentials(payload));

    expect(nextState.token).toBe('mock-jwt-token-string');
    expect(nextState.isAuthenticated).toBe(true);
    expect(nextState.user).toBeDefined();
    expect(nextState.user?.name).toBe('Executive Engineer Sharma');
    expect(nextState.user?.roles).toContain('EE');
  });

  it('should successfully clear all credentials on logout', () => {
    const populatedState = {
      token: 'jwt',
      user: { sub: '1', name: 'EE', roles: ['EE'] as any, jurisdiction_id: '42', authority_type: 'PWD' as any },
      isAuthenticated: true,
    };

    const nextState = authReducer(populatedState, logout());

    expect(nextState.token).toBeNull();
    expect(nextState.user).toBeNull();
    expect(nextState.isAuthenticated).toBe(false);
  });
});
