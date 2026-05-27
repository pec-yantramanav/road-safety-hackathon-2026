import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ticketApi } from '../api/services/ticketApi';
import { useSyncQueueStore } from '../state/syncQueueStore';
import NetInfo from '@react-native-community/netinfo';
import { TicketCategory, LocationPoint } from '../api/types';

export const useComplaintController = () => {
  const queryClient = useQueryClient();
  const queueAction = useSyncQueueStore((state) => state.queueAction);

  // Fetch nearby tickets reactively based on location
  const useNearbyTickets = (coords: LocationPoint, radiusMeters: number = 1000) => {
    return useQuery({
      queryKey: ['tickets', 'nearby', coords.latitude, coords.longitude, radiusMeters],
      queryFn: () => ticketApi.fetchNearby(coords.latitude, coords.longitude, radiusMeters),
      enabled: !!coords.latitude && !!coords.longitude,
    });
  };

  // Submit Complaint with transparent offline queueing
  const submitComplaintMutation = useMutation({
    mutationFn: async (payload: {
      category: TicketCategory;
      description: string;
      location: LocationPoint;
      photoUrls: string[];
      isAnonymous: boolean;
    }) => {
      const netInfo = await NetInfo.fetch();
      
      if (!netInfo.isConnected) {
        // Offline -> transparently queue action inside Zustand store persistent queue
        await queueAction({
          id: Math.random().toString(36).substring(7),
          type: 'CREATE_TICKET',
          payload,
          timestamp: new Date().toISOString(),
          attempts: 0
        });
        throw new Error('OFFLINE_SAVED');
      }

      return ticketApi.createTicket(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    }
  });

  return {
    useNearbyTickets,
    submitComplaint: submitComplaintMutation.mutateAsync,
    isSubmitting: submitComplaintMutation.isPending,
    submitError: submitComplaintMutation.error,
    isSavedOffline: submitComplaintMutation.error?.message === 'OFFLINE_SAVED'
  };
};
