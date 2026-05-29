import { useComplaintController } from '../controllers/useComplaintController';
import { useSyncQueueStore } from '../state/syncQueueStore';
import NetInfo from '@react-native-community/netinfo';
import { renderHook, act } from '@testing-library/react-hooks';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Wrapper setup to satisfy TanStack Query Client Context
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useComplaintController Hook Integration', () => {
  beforeEach(() => {
    useSyncQueueStore.setState({ queue: [] });
    jest.clearAllMocks();
  });

  it('should transparently save ticket to offline queue store when network is disconnected', async () => {
    // 1. Mock NetInfo to return offline status
    NetInfo.fetch.mockResolvedValueOnce({ isConnected: false, isInternetReachable: false });

    const { result } = renderHook(() => useComplaintController(), {
      wrapper: createWrapper()
    });

    // 2. Call complaint submission
    let errorOccurred = null;
    await act(async () => {
      try {
        await result.current.submitComplaint({
          category: 'POTHOLE',
          description: 'Deep road crater',
          location: { latitude: 12.97, longitude: 77.59 },
          photoUrls: [],
          isAnonymous: false
        });
      } catch (err) {
        errorOccurred = err;
      }
    });

    // 3. Assert transparent fallback captures action and throws OFFLINE_SAVED
    expect(errorOccurred).toBeDefined();
    expect((errorOccurred as any).message).toBe('OFFLINE_SAVED');
    
    const queuedActions = useSyncQueueStore.getState().queue;
    expect(queuedActions).toHaveLength(1);
    expect(queuedActions[0].type).toBe('CREATE_TICKET');
    expect(queuedActions[0].payload.category).toBe('POTHOLE');
  });
});
