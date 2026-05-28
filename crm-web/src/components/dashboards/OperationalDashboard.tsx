import React from 'react';
import { Ticket, WorkOrder } from '../../types';
import { GlassCard } from '../GlassCard';
import { TicketTable } from '../TicketTable';
import { ShieldAlert, TrendingUp, CheckCircle, Users, HardHat, UploadCloud } from 'lucide-react';

interface OperationalDashboardProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  workOrder: WorkOrder | null;
  powStatus: 'IDLE' | 'UPLOADING' | 'AI_ANALYZING' | 'SUCCESS' | 'FAILED';
  aiVerdict: string | null;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const OperationalDashboard: React.FC<OperationalDashboardProps> = ({
  tickets,
  onSelectTicket,
  workOrder,
  powStatus,
  aiVerdict,
  handleFileUpload
}) => {
  return (
    <div className="space-y-8 animate-slide-in">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <GlassCard className="flex items-center space-x-4">
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <ShieldAlert className="text-red-500 dark:text-red-400" size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-textPrimary">{tickets.length}</div>
            <div className="text-[10px] text-textSecondary font-bold uppercase tracking-wider">Active Complaints</div>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center space-x-4">
          <div className="p-3 bg-accentNeon/10 border border-accentNeon/20 rounded-xl">
            <TrendingUp className="text-accentNeon" size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-textPrimary">96.4%</div>
            <div className="text-[10px] text-textSecondary font-bold uppercase tracking-wider">SLA compliance</div>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center space-x-4">
          <div className="p-3 bg-successNeon/10 border border-successNeon/20 rounded-xl">
            <CheckCircle className="text-successNeon" size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-textPrimary">412</div>
            <div className="text-[10px] text-textSecondary font-bold uppercase tracking-wider">Resolved Tickets</div>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center space-x-4">
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <Users className="text-yellow-600 dark:text-yellow-400" size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-textPrimary">12</div>
            <div className="text-[10px] text-textSecondary font-bold uppercase tracking-wider">Active Contractors</div>
          </div>
        </GlassCard>
      </div>

      {/* Grid Overview Panel layouts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <GlassCard>
            <h3 className="text-lg font-bold text-textPrimary mb-4">Grievance Backlog Queue</h3>
            <TicketTable tickets={tickets.slice(0, 3)} onSelect={onSelectTicket} />
          </GlassCard>
        </div>

        <GlassCard className="flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-textPrimary mb-4 flex items-center">
              <HardHat className="mr-2 text-accentNeon" /> AI PoW Validation
            </h3>
            {workOrder ? (
              <div className="space-y-4">
                <div className="text-sm font-semibold text-textPrimary">{workOrder.description}</div>
                <div className="text-xs text-textSecondary font-semibold">Order ID: {workOrder.id}</div>
                <div className="flex items-center justify-between text-xs py-2 border-t border-glassBorder mt-2">
                  <span className="text-textSecondary">Current Status:</span>
                  <span className="font-bold text-accentNeon">{workOrder.status}</span>
                </div>
              </div>
            ) : (
              <span className="text-xs text-textSecondary">No active work orders.</span>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-glassBorder">
            <span className="text-[10px] text-textSecondary uppercase font-bold block mb-2">Proof Upload (Simulation)</span>
            <input
              type="file"
              id="pow-upload-op"
              className="hidden"
              onChange={handleFileUpload}
            />
            <label
              htmlFor="pow-upload-op"
              className="flex justify-center items-center p-3 border border-dashed border-glassBorder rounded-xl hover:border-accentNeon cursor-pointer text-xs transition-all text-textSecondary hover:text-textPrimary bg-surface shadow-sm"
            >
              <UploadCloud className="mr-2" size={16} /> Upload Repair proof
            </label>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
export default OperationalDashboard;
