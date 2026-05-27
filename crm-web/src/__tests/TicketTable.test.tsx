import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../state/slices/authSlice';
import uiReducer from '../state/slices/uiSlice';
import { ticketApi } from '../api/ticketApi';
import { TicketTable } from '../components/TicketTable';
import { Ticket } from '../types';

const mockTickets: Ticket[] = [
  {
    id: 'RW-4217',
    title: 'Pothole Main Road',
    description: 'Crater pothole.',
    status: 'OPEN',
    priority: 'HIGH',
    category: 'POTHOLE',
    location: { latitude: 12.97, longitude: 77.59 },
    photoUrls: [],
    contributorCount: 1,
    jurisdictionId: 'ward-42-id',
    authorityType: 'MUNICIPAL',
    slaDeadline: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // Expired/Breached
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const renderWithStore = (ui: React.ReactElement) => {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      ui: uiReducer,
      [ticketApi.reducerPath]: ticketApi.reducer,
    },
    middleware: (getDefault) => getDefault().concat(ticketApi.middleware),
    preloadedState: {
      auth: {
        token: 'mock',
        isAuthenticated: true,
        user: { sub: 'EE', name: 'EE', roles: ['EE'], jurisdiction_id: 'ward-42-id', authority_type: 'PWD' }
      }
    }
  });

  return render(<Provider store={store}>{ui}</Provider>);
};

describe('TicketTable Component Integration', () => {
  it('should render active ticket rows and flag SLA breach status visually', () => {
    const handleSelect = jest.fn();
    renderWithStore(<TicketTable tickets={mockTickets} onSelect={handleSelect} />);

    // Row id is rendered
    expect(screen.getByText('RW-4217')).toBeInTheDocument();
    
    // SLA status matches deadline breach calculations
    expect(screen.getByText('BREACHED')).toBeInTheDocument();
  });
});
