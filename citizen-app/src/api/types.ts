export type TicketCategory = 'POTHOLE' | 'LIGHTING' | 'SIGNAGE' | 'ROAD_QUALITY' | 'OTHER';
export type TicketStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED' | 'CLOSED';
export type TicketPriority = 'NORMAL' | 'HIGH' | 'BLACKSPOT';
export type AuthorityType = 'MUNICIPAL' | 'PWD' | 'NHAI' | 'BRO' | 'PMGSY' | 'FOREST';

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
}

export interface TicketEvent {
  id: string;
  ticketId: string;
  actorId: string;
  eventType: 'CREATED' | 'ASSIGNED' | 'COMMENTED' | 'ESCALATED' | 'RESOLVED' | 'CLOSED';
  payload: Record<string, any>;
  timestamp: string;
}

export interface SyncAction {
  id: string; // UUID
  type: 'CREATE_TICKET' | 'CONTRIBUTE';
  payload: any;
  timestamp: string;
  attempts: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
