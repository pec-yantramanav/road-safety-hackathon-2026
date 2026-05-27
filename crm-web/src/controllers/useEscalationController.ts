import { useEscalateTicketMutation } from '../api/ticketApi';
import { Ticket } from '../types';

export const useEscalationController = () => {
  const [escalateTicket, { isLoading: isEscalating }] = useEscalateTicketMutation();

  const handleManualEscalation = async (ticketId: string, reason: string) => {
    try {
      await escalateTicket({ id: ticketId, reason }).unwrap();
    } catch (err) {
      console.error('Manual escalation failed:', err);
    }
  };

  const getSLAStatus = (ticket: Ticket) => {
    const deadline = new Date(ticket.slaDeadline).getTime();
    const now = Date.now();
    const diffHours = (deadline - now) / (1000 * 60 * 60);

    if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
      return { label: 'ON TRACK', color: 'text-successNeon', isBreached: false };
    }
    if (diffHours < 0) {
      return { label: 'BREACHED', color: 'text-danger-neon font-extrabold', isBreached: true };
    }
    if (diffHours <= 48) {
      return { label: 'CRITICAL WARNING', color: 'text-warningNeon font-bold animate-pulse', isBreached: false };
    }
    return { label: 'ON TRACK', color: 'text-successNeon', isBreached: false };
  };

  return {
    escalate: handleManualEscalation,
    isEscalating,
    getSLAStatus
  };
};
