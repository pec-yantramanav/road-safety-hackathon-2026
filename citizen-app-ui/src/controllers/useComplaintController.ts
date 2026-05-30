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

  // Fetch specific ticket details
  const useTicketDetails = (id: string) => {
    return useQuery({
      queryKey: ['tickets', id],
      queryFn: () => ticketApi.fetchDetails(id),
      enabled: !!id,
    });
  };

  // Fetch specific ticket event history logs
  // Fetch specific ticket event history logs
  const useTicketEvents = (id: string) => {
    return useQuery({
      queryKey: ['tickets', id, 'events'],
      queryFn: () => ticketApi.fetchEvents(id),
      enabled: !!id,
    });
  };

  // Fetch complaints registered by a specific citizen
  const useMyTickets = (citizenId: string | undefined) => {
    return useQuery({
      queryKey: ['tickets', 'my', citizenId],
      queryFn: () => ticketApi.fetchMyTickets(citizenId!),
      enabled: !!citizenId,
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
      citizenId?: string;
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

  // Contribute (Upvote / Support) to an existing complaint
  const contributeMutation = useMutation({
    mutationFn: async (payload: { id: string; description: string; photoUrls: string[] }) => {
      return ticketApi.contributeMeToo(payload.id, {
        description: payload.description,
        photoUrls: payload.photoUrls
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets', variables.id] });
    }
  });

  return {
    useNearbyTickets,
    useTicketDetails,
    useTicketEvents,
    useMyTickets,
    submitComplaint: submitComplaintMutation.mutateAsync,
    isSubmitting: submitComplaintMutation.isPending,
    submitError: submitComplaintMutation.error,
    isSavedOffline: submitComplaintMutation.error?.message === 'OFFLINE_SAVED',
    contributeComplaint: contributeMutation.mutateAsync,
    isContributing: contributeMutation.isPending,
  };
};
export default useComplaintController;
