import { http, HttpResponse } from 'msw';
import { Ticket, WorkOrder, BudgetSchemeDetails } from '../types';

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
    assignedTo: 'Junior Engineer Sharma'
  },
  {
    id: 'RW-1094',
    title: 'Faulty Streetlights on 5th Cross Division Ave',
    description: 'Streetlights out of commission for three straight nights. Unsafe for pedestrians.',
    status: 'OPEN',
    priority: 'NORMAL',
    category: 'LIGHTING',
    location: { latitude: 12.9801, longitude: 77.6012 },
    photoUrls: ['https://picsum.photos/400/301'],
    contributorCount: 1,
    jurisdictionId: 'ward-42-id',
    authorityType: 'PWD',
    slaDeadline: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // Breached!
    createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
  }
];

let mockWorkOrders: WorkOrder[] = [
  {
    id: 'WO-8801',
    ticketId: 'RW-4217',
    contractorId: 'contr-99-id',
    status: 'IN_PROGRESS',
    description: 'Fill crater pothole using high-density concrete bonding and level smooth.',
    proofPhotoUrls: [],
    estimatedCost: 15000,
    assignedBy: 'officer-ee-patel',
    assignedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

let mockBudgets: BudgetSchemeDetails[] = [
  {
    id: 'bg-1',
    schemeName: 'Pradhan Mantri Gram Sadak Yojana (PMGSY)',
    jurisdictionId: 'ward-42-id',
    authorityType: 'PMGSY',
    sanctionedAmount: 50000000,
    releasedAmount: 40000000,
    utilizedAmount: 32000000,
    financialYear: '2025-2026'
  },
  {
    id: 'bg-2',
    schemeName: 'Smart Cities Extension Allocation',
    jurisdictionId: 'ward-42-id',
    authorityType: 'MUNICIPAL',
    sanctionedAmount: 75000000,
    releasedAmount: 60000000,
    utilizedAmount: 55000000,
    financialYear: '2025-2026'
  }
];

export const handlers = [
  // Fetch Tickets
  http.get('/api/v1/crm/tickets', () => {
    return HttpResponse.json(mockTickets);
  }),

  // Assign Ticket
  http.patch<{ id: string }, { assignedTo: string }>('/api/v1/crm/tickets/:id/assign', async ({ params, request }) => {
    const { id } = params;
    const body = await request.json();
    const ticket = mockTickets.find((t) => t.id === id);
    if (ticket) {
      ticket.assignedTo = body.assignedTo;
      ticket.status = 'ASSIGNED';
    }
    return HttpResponse.json(ticket);
  }),

  // Escalate Ticket
  http.post<{ id: string }, { reason: string }>('/api/v1/crm/tickets/:id/escalate', async ({ params, request }) => {
    const { id } = params;
    const ticket = mockTickets.find((t) => t.id === id);
    if (ticket) {
      ticket.status = 'ESCALATED';
      ticket.priority = 'HIGH';
    }
    return HttpResponse.json({
      id: `evt-${Math.random()}`,
      ticketId: id,
      actorId: 'system',
      eventType: 'ESCALATED',
      payload: { reason: 'SLA deadline breach warning override' },
      timestamp: new Date().toISOString()
    });
  }),

  // Fetch Work Orders
  http.get('/api/v1/crm/workorders', () => {
    return HttpResponse.json(mockWorkOrders);
  }),

  // Fetch single Work Order
  http.get<{ id: string }>('/api/v1/crm/workorders/:id', ({ params }) => {
    const found = mockWorkOrders.find((w) => w.id === params.id);
    return HttpResponse.json(found || {});
  }),

  // Submit Proof of Work file upload
  http.post<{ id: string }>('/api/v1/crm/workorders/:id/submit', async ({ params }) => {
    const found = mockWorkOrders.find((w) => w.id === params.id);
    if (found) {
      found.status = 'SUBMITTED';
      found.proofPhotoUrls = ['https://picsum.photos/400/300'];
      found.submittedAt = new Date().toISOString();
    }
    return HttpResponse.json(found);
  }),

  // Approve Work Order
  http.post<{ id: string }>('/api/v1/crm/workorders/:id/approve', ({ params }) => {
    const found = mockWorkOrders.find((w) => w.id === params.id);
    if (found) {
      found.status = 'APPROVED';
      found.approvedAt = new Date().toISOString();
    }
    return HttpResponse.json(found);
  }),

  // Fetch Budgets for Jurisdiction
  http.get<{ jurisdictionId: string }>('/api/v1/crm/budget/:jurisdictionId', () => {
    return HttpResponse.json(mockBudgets);
  })
];
export default handlers;
