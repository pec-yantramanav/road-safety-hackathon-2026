import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../state/slices/authSlice';
import RoleGuard from '../components/RoleGuard';

// Helper function to render RoleGuard wrapped in mock Redux store
const renderWithStore = (ui: React.ReactElement, initialRole: 'JE' | 'EE') => {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        token: 'mock',
        isAuthenticated: true,
        user: {
          sub: 'uuid',
          name: 'Officer',
          roles: [initialRole],
          jurisdiction_id: 'ward-42-id',
          authority_type: 'PWD'
        }
      }
    }
  });

  return render(<Provider store={store}>{ui}</Provider>);
};

describe('RoleGuard Component Security Validation', () => {
  it('should structurally mask actions and display fallback text when user role is unauthorized', () => {
    renderWithStore(
      <RoleGuard
        allowed={['EE', 'SE']}
        fallback={<span data-testid="fallback">Access Denied</span>}
      >
        <button data-testid="action">Approve Release</button>
      </RoleGuard>,
      'JE' // junior engineer
    );

    // Button is hidden
    expect(screen.queryByTestId('action')).toBeNull();
    // Fallback is mounted
    expect(screen.getByTestId('fallback')).toHaveTextContent('Access Denied');
  });

  it('should display wrapped interactive children when officer holds authorized roles', () => {
    renderWithStore(
      <RoleGuard
        allowed={['EE', 'SE']}
        fallback={<span data-testid="fallback">Access Denied</span>}
      >
        <button data-testid="action">Approve Release</button>
      </RoleGuard>,
      'EE' // executive engineer
    );

    // Button is shown
    expect(screen.getByTestId('action')).toHaveTextContent('Approve Release');
    // Fallback is hidden
    expect(screen.queryByTestId('fallback')).toBeNull();
  });
});
