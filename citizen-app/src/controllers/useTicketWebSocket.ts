import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socketClient } from '../api/websocket/socketClient';
import { TicketEvent } from '../api/types';

export const useTicketWebSocket = (ticketId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!ticketId) return;

    const destination = `/topic/tickets/${ticketId}`;
    
    const subscription = socketClient.subscribe(destination, (message) => {
      try {
        const event: TicketEvent = JSON.parse(message.body);
        console.log('Received WebSocket event:', event);

        // Mutate TanStack Query cache values dynamically
        queryClient.setQueryData(['tickets', ticketId], (oldTicket: any) => {
          if (!oldTicket) return oldTicket;
          
          const updated = { ...oldTicket };
          if (event.eventType === 'ASSIGNED') {
            updated.status = 'ASSIGNED';
            updated.assignedTo = event.payload.assignedTo;
          } else if (event.eventType === 'ESCALATED') {
            updated.status = 'ESCALATED';
            updated.priority = 'HIGH';
          } else if (event.eventType === 'RESOLVED') {
            updated.status = 'RESOLVED';
          } else if (event.eventType === 'CLOSED') {
            updated.status = 'CLOSED';
          }
          return updated;
        });

        // Trigger refetching of events list
        queryClient.invalidateQueries({ queryKey: ['tickets', ticketId, 'events'] });
      } catch (err) {
        console.error('Error parsing WebSocket STOMP message payload', err);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [ticketId, queryClient]);
};
