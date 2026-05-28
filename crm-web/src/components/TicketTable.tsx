import React, { useState } from 'react';
import { Ticket } from '../types';
import { useEscalationController } from '../controllers/useEscalationController';
import { useTicketListController } from '../controllers/useTicketListController';
import { Clock, UserPlus, AlertCircle } from 'lucide-react';

interface TicketTableProps {
  tickets: Ticket[];
  onSelect: (ticket: Ticket) => void;
}

export const TicketTable: React.FC<TicketTableProps> = ({ tickets, onSelect }) => {
  const { getSLAStatus, escalate } = useEscalationController();
  const { assignOfficer } = useTicketListController();

  const [activeAssignId, setActiveAssignId] = useState<string | null>(null);
  const [selectedOfficer, setSelectedOfficer] = useState('');

  const mockOfficers = [
    { id: 'officer-je-sharma', name: 'JE Sharma (Junior Engineer)' },
    { id: 'officer-ae-verma', name: 'AE Verma (Assistant Engineer)' },
    { id: 'officer-ee-patel', name: 'EE Patel (Executive Engineer)' }
  ];

  const triggerAssign = async (ticketId: string) => {
    if (!selectedOfficer) return;
    await assignOfficer(ticketId, selectedOfficer);
    setActiveAssignId(null);
    setSelectedOfficer('');
  };

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-glassBorder bg-glassBg shadow-sm">
      <table className="w-full min-w-[800px] border-collapse text-left text-sm text-textSecondary">
        <thead className="bg-surface text-xs font-bold uppercase tracking-wider text-textSecondary border-b border-glassBorder">
          <tr>
            <th className="p-4">TICKET ID</th>
            <th className="p-4">TITLE</th>
            <th className="p-4">CATEGORY</th>
            <th className="p-4">STATUS</th>
            <th className="p-4">PRIORITY</th>
            <th className="p-4">SLA FORECAST</th>
            <th className="p-4">ASSIGNMENT</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-glassBorder">
          {tickets.length === 0 ? (
            <tr>
              <td colSpan={7} className="p-6 text-center text-textSecondary opacity-60">
                No tickets matching current filters and row scope constraints found.
              </td>
            </tr>
          ) : (
            tickets.map((ticket) => {
              const sla = getSLAStatus(ticket);
              const isEscalated = ticket.status === 'ESCALATED';

              return (
                <tr
                  key={ticket.id}
                  onClick={() => onSelect(ticket)}
                  className={`hover:bg-surface/50 transition-all cursor-pointer ${
                    sla.isBreached ? 'sla-alert-active' : ''
                  }`}
                >
                  <td className="p-4 font-bold text-accentNeon">{ticket.id}</td>
                  <td className="p-4 font-bold text-textPrimary max-w-[200px] truncate">
                    {ticket.title}
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded bg-textSecondary/10 border border-textSecondary/20 text-xs text-textSecondary font-semibold">
                      {ticket.category}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                        ticket.status === 'RESOLVED'
                          ? 'bg-successNeon/10 border border-successNeon/30 text-successNeon'
                          : ticket.status === 'OPEN'
                          ? 'bg-blue-500/10 border border-blue-500/30 text-blue-500 dark:text-blue-400'
                          : ticket.status === 'ESCALATED'
                          ? 'bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400'
                          : 'bg-warningNeon/10 border border-warningNeon/30 text-warningNeon'
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`font-bold text-xs ${
                        ticket.priority === 'BLACKSPOT'
                          ? 'text-red-500 dark:text-red-400 flex items-center'
                          : ticket.priority === 'HIGH'
                          ? 'text-warningNeon'
                          : 'text-textSecondary'
                      }`}
                    >
                      {ticket.priority === 'BLACKSPOT' && <AlertCircle className="mr-1" size={14} />}
                      {ticket.priority}
                    </span>
                  </td>
                  <td className={`p-4 flex items-center ${sla.color}`}>
                    <Clock className="mr-2" size={14} />
                    <span className="text-xs font-semibold">{sla.label}</span>
                  </td>
                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                    {activeAssignId === ticket.id ? (
                      <div className="flex items-center space-x-2">
                        <select
                          className="bg-background text-textPrimary border border-glassBorder rounded px-2 py-1 text-xs outline-none shadow-sm"
                          value={selectedOfficer}
                          onChange={(e) => setSelectedOfficer(e.target.value)}
                        >
                          <option value="">Select Officer...</option>
                          {mockOfficers.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => triggerAssign(ticket.id)}
                          className="px-2.5 py-1 bg-accentNeon text-white text-xs font-semibold rounded hover:opacity-90 shadow-sm"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-textSecondary truncate max-w-[100px] font-semibold">
                          {ticket.assignedTo || 'Unassigned'}
                        </span>
                        <button
                          onClick={() => setActiveAssignId(ticket.id)}
                          className="p-1 rounded bg-surface text-textSecondary hover:text-textPrimary border border-glassBorder shadow-sm"
                        >
                          <UserPlus size={14} />
                        </button>
                        {!isEscalated && (
                          <button
                            onClick={() => escalate(ticket.id, 'Officer SLA warning manual override trigger')}
                            className="px-2 py-0.5 border border-red-500/20 text-red-500 dark:text-red-400 text-[10px] font-bold rounded hover:bg-red-500/10 transition-all"
                          >
                            Escalate
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
export default TicketTable;
