export type TicketCategory = 'POTHOLE' | 'LIGHTING' | 'SIGNAGE' | 'ROAD_QUALITY' | 'OTHER';
export type TicketStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED' | 'CLOSED';
export type TicketPriority = 'NORMAL' | 'HIGH' | 'BLACKSPOT';
export type AuthorityType = 'MUNICIPAL' | 'PWD' | 'NHAI' | 'BRO' | 'PMGSY' | 'FOREST';
export type OfficerRole = 'JE' | 'AE' | 'EE' | 'SE' | 'CE' | 'CONTRACTOR' | 'COMMISSIONER';

export interface LocationPoint {
  latitude: number;
  longitude: number;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  location: LocationPoint;
  photoUrls: string[];
  contributorCount: number;
  jurisdictionId: string;
  authorityType: AuthorityType;
  slaDeadline: string; // ISO DateTime
  createdAt: string;
  updatedAt: string;
  assignedTo?: string; // Officer ID
}

export interface TicketEvent {
  id: string;
  ticketId: string;
  actorId: string;
  eventType: 'CREATED' | 'ASSIGNED' | 'COMMENTED' | 'ESCALATED' | 'RESOLVED' | 'CLOSED';
  payload: Record<string, any>;
  timestamp: string;
}

export interface WorkOrder {
  id: string;
  ticketId: string;
  contractorId: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  description: string;
  proofPhotoUrls: string[];
  estimatedCost: number;
  actualCost?: number;
  assignedBy: string;
  approvedBy?: string;
  assignedAt: string;
  submittedAt?: string;
  approvedAt?: string;
}

export interface BudgetSchemeDetails {
  id: string;
  schemeName: string;
  jurisdictionId: string;
  authorityType: AuthorityType;
  sanctionedAmount: number;
  releasedAmount: number;
  utilizedAmount: number;
  financialYear: string;
}
