import { useState, useMemo } from 'react';
import { useGetTicketsQuery, useAssignTicketMutation } from '../api/ticketApi';
import { useSelector } from 'react-redux';
import { RootState } from '../state/store';
import { TicketStatus } from '../types';

export const useTicketListController = () => {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Reactively trigger RTK Query fetching when status filters alter
  const { data: tickets = [], isLoading, error } = useGetTicketsQuery(
    selectedStatus === 'ALL' ? undefined : { status: selectedStatus as TicketStatus }
  );

  const [assignTicket, { isLoading: isAssigning }] = useAssignTicketMutation();

  const filteredTickets = useMemo(() => {
    return tickets
      .filter((ticket) => {
        const matchesSearch = 
          ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.id.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Row-Level Security: Only display tickets matching officer's jurisdiction scope
        // CE and COMMISSIONER have master admin view capabilities
        const matchesJurisdiction = 
          currentUser?.roles.includes('CE') || currentUser?.roles.includes('COMMISSIONER')
            ? true
            : ticket.jurisdictionId === currentUser?.jurisdiction_id;

        return matchesSearch && matchesJurisdiction;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [tickets, searchTerm, currentUser]);

  const handleAssignment = async (ticketId: string, officerId: string) => {
    try {
      await assignTicket({ id: ticketId, assignedTo: officerId }).unwrap();
    } catch (err) {
      console.error('Assignment mutation failed:', err);
    }
  };

  return {
    tickets: filteredTickets,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    selectedStatus,
    setSelectedStatus,
    assignOfficer: handleAssignment,
    isAssigning
  };
};
