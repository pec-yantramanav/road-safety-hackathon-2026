import React from 'react';
import { Ticket } from '../../types';
import { GlassCard } from '../GlassCard';
import { TicketTable } from '../TicketTable';
import { Map, Compass, FileSpreadsheet, AlertCircle } from 'lucide-react';

interface ExecutiveDashboardProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ tickets, onSelectTicket }) => {
  return (
    <div className="space-y-8 animate-slide-in">
      {/* Heatmap Map & Scheme Utilizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2">
          <h3 className="text-sm font-bold tracking-wider text-textSecondary flex items-center mb-4 uppercase">
            <Map className="mr-2 text-accentNeon" size={18} /> Regional Division SLA Heatmap
          </h3>
          <div className="w-full h-64 rounded-xl border border-glassBorder bg-surface flex flex-col justify-center items-center p-6">
            <Compass size={40} className="text-accentNeon mb-3 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="text-xs text-textPrimary font-bold">State Division Compliance Heatmap (Active Mock)</span>
            <div className="grid grid-cols-3 gap-4 w-full mt-6 text-center text-xs">
              <div className="p-3 bg-successNeon/10 border border-successNeon/20 rounded-xl">
                <span className="font-black text-successNeon block">98.2%</span>
                <span className="text-[9px] text-textSecondary font-bold uppercase mt-1 block">Chennai Circle</span>
              </div>
              <div className="p-3 bg-warningNeon/10 border border-warningNeon/20 rounded-xl">
                <span className="font-black text-warningNeon block">89.4%</span>
                <span className="text-[9px] text-textSecondary font-bold uppercase mt-1 block">Salem Circle</span>
              </div>
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <span className="font-black text-red-500 block">74.1%</span>
                <span className="text-[9px] text-textSecondary font-bold uppercase mt-1 block">Madurai Circle</span>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold tracking-wider text-textSecondary flex items-center mb-4 uppercase">
              <FileSpreadsheet className="mr-2 text-successNeon" size={18} /> Scheme utilization burn-down
            </h3>
            <div className="space-y-4 py-2">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-textSecondary">State Highway Scheme</span>
                  <span className="text-accentNeon">82% spent</span>
                </div>
                <div className="w-full h-2.5 bg-background dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-accentNeon rounded-full" style={{ width: '82%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-textSecondary">Smart City Corridor</span>
                  <span className="text-successNeon">91% spent</span>
                </div>
                <div className="w-full h-2.5 bg-background dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-successNeon rounded-full" style={{ width: '91%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-textSecondary">PMGSY Rural Connect</span>
                  <span className="text-warningNeon">64% spent</span>
                </div>
                <div className="w-full h-2.5 bg-background dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-warningNeon rounded-full" style={{ width: '64%' }} />
                </div>
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-glassBorder text-center">
            <span className="text-[10px] text-textSecondary font-bold block uppercase">Central Budget Balance Buffer</span>
            <span className="text-2xl font-black text-textPrimary block mt-1">₹13.4 Cr remaining</span>
          </div>
        </GlassCard>
      </div>

      {/* Escalated grievances backlog feed */}
      <GlassCard>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-textPrimary">Escalated Grievances (Central Oversight)</h3>
          <span className="px-2.5 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-xs text-red-500 font-bold uppercase flex items-center">
            <AlertCircle className="mr-1.5" size={14} /> Immediate Action Requested
          </span>
        </div>
        <TicketTable tickets={tickets.filter(t => t.priority === 'HIGH')} onSelect={onSelectTicket} />
      </GlassCard>
    </div>
  );
};
export default ExecutiveDashboard;
