import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';
import { Ticket, TicketStatus, TicketEvent } from '../types';

export const ticketApi = createApi({
  reducerPath: 'ticketApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Tickets', 'TicketEvents'],
  endpoints: (builder) => ({
    getTickets: builder.query<Ticket[], { status?: TicketStatus } | void>({
      query: (params) => ({
        url: '/tickets',
        method: 'GET',
        params: params || {},
      }),
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Tickets' as const, id })), { type: 'Tickets', id: 'LIST' }]
          : [{ type: 'Tickets', id: 'LIST' }],
    }),
    assignTicket: builder.mutation<Ticket, { id: string; assignedTo: string }>({
      query: ({ id, assignedTo }) => ({
        url: `/tickets/${id}/assign`,
        method: 'PATCH',
        body: { assignedTo },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Tickets', id },
        { type: 'Tickets', id: 'LIST' }
      ],
    }),
    updateTicketStatus: builder.mutation<Ticket, { id: string; status: TicketStatus }>({
      query: ({ id, status }) => ({
        url: `/tickets/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Tickets', id },
        { type: 'Tickets', id: 'LIST' }
      ],
    }),
    escalateTicket: builder.mutation<TicketEvent, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/tickets/${id}/escalate`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Tickets', id },
        { type: 'Tickets', id: 'LIST' },
        { type: 'TicketEvents', id: `LIST_${id}` }
      ],
    }),
    getTicketEvents: builder.query<TicketEvent[], string>({
      query: (ticketId) => `/tickets/${ticketId}/events`,
      providesTags: (result, error, ticketId) => [{ type: 'TicketEvents', id: `LIST_${ticketId}` }],
    })
  }),
});

export const {
  useGetTicketsQuery,
  useAssignTicketMutation,
  useUpdateTicketStatusMutation,
  useEscalateTicketMutation,
  useGetTicketEventsQuery
} = ticketApi;
