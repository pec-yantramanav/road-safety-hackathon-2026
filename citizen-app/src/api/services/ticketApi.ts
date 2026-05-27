import { apiClient, USE_MOCK } from '../client/apiClient';
import { Ticket, TicketCategory, TicketStatus, TicketEvent, SyncAction } from '../types';

// Concrete simulated mock database in memory to support high-fidelity sandboxed testing
let mockTickets: Ticket[] = [
  {
    id: 'RW-4217',
    title: 'Severe Pothole on Ward 42 Main Rd',
    description: 'A deeply cratered pothole spanning about 1 meter wide, causing vehicles to swerve dangerously.',
    status: 'ASSIGNED',
    priority: 'HIGH',
    category: 'POTHOLE',
    location: { latitude: 12.9716, longitude: 77.5946 },
    photoUrls: ['https://picsum.photos/400/300'],
    contributorCount: 3,
    jurisdictionId: 'ward-42-id',
    authorityType: 'MUNICIPAL',
    slaDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'RW-1094',
    title: 'Faulty Streetlights on 5th Cross Division Ave',
    description: 'Entire row of streetlights out of commission for three straight nights. Unsafe for pedestrians.',
    status: 'OPEN',
    priority: 'NORMAL',
    category: 'LIGHTING',
    location: { latitude: 12.9801, longitude: 77.6012 },
    photoUrls: ['https://picsum.photos/400/301'],
    contributorCount: 1,
    jurisdictionId: 'div-5-id',
    authorityType: 'PWD',
    slaDeadline: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  }
];

export const ticketApi = {
  fetchNearby: async (lat: number, lng: number, radiusMeters: number): Promise<Ticket[]> => {
    if (USE_MOCK) {
      // Simulate network latency
      await new Promise((resolve) => setTimeout(resolve, 600));
      return mockTickets;
    }
    const response = await apiClient.get<Ticket[]>('/tickets/nearby', {
      params: { lat, lng, radius: radiusMeters },
    });
    return response.data;
  },

  createTicket: async (payload: {
    category: TicketCategory;
    description: string;
    location: { latitude: number; longitude: number };
    photoUrls: string[];
    isAnonymous: boolean;
  }): Promise<Ticket> => {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const newTicket: Ticket = {
        id: `RW-${Math.floor(1000 + Math.random() * 9000)}`,
        title: `${payload.category.charAt(0) + payload.category.slice(1).toLowerCase()} reported by Citizen`,
        description: payload.description,
        status: 'OPEN',
        priority: 'NORMAL',
        category: payload.category,
        location: payload.location,
        photoUrls: payload.photoUrls,
        contributorCount: 1,
        jurisdictionId: 'ward-42-id',
        authorityType: 'MUNICIPAL',
        slaDeadline: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockTickets.unshift(newTicket);
      return newTicket;
    }
    const response = await apiClient.post<Ticket>('/tickets', payload);
    return response.data;
  },

  fetchDetails: async (id: string): Promise<Ticket> => {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const found = mockTickets.find((t) => t.id === id);
      if (!found) throw new Error('Ticket not found');
      return found;
    }
    const response = await apiClient.get<Ticket>(`/tickets/${id}`);
    return response.data;
  },

  fetchEvents: async (id: string): Promise<TicketEvent[]> => {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return [
        {
          id: 'evt-1',
          ticketId: id,
          actorId: 'system',
          eventType: 'CREATED',
          payload: {},
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'evt-2',
          ticketId: id,
          actorId: 'officer-je-id',
          eventType: 'ASSIGNED',
          payload: { assignedTo: 'Junior Engineer Sharma' },
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        }
      ];
    }
    const response = await apiClient.get<TicketEvent[]>(`/tickets/${id}/events`);
    return response.data;
  },

  contributeMeToo: async (id: string, payload: { description: string; photoUrls: string[] }): Promise<Ticket> => {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const ticket = mockTickets.find((t) => t.id === id);
      if (!ticket) throw new Error('Ticket not found');
      ticket.contributorCount += 1;
      if (ticket.contributorCount >= 5 && ticket.priority === 'NORMAL') {
        ticket.priority = 'HIGH';
      }
      return { ...ticket };
    }
    const response = await apiClient.post<Ticket>(`/tickets/${id}/contribute`, payload);
    return response.data;
  },

  syncQueue: async (queue: SyncAction[]): Promise<{ actionId: string; success: boolean; error?: string }[]> => {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return queue.map((action) => ({
        actionId: action.id,
        success: true,
      }));
    }
    const response = await apiClient.post<any>('/sync/queue', queue);
    return response.data;
  }
};
