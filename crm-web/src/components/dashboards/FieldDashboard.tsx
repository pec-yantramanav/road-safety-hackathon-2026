import React from 'react';
import { Ticket } from '../../types';
import { GlassCard } from '../GlassCard';
import { Compass } from 'lucide-react';

interface FieldDashboardProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
}

export const FieldDashboard: React.FC<FieldDashboardProps> = ({ tickets, onSelectTicket }) => {
  return (
    <div className="space-y-8 animate-slide-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Task lists inspection card layout */}
        <GlassCard>
          <h3 className="text-lg font-bold text-textPrimary mb-4">Field Inspection Tasks</h3>
          <div className="space-y-4">
            {tickets.map((t, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-surface border border-glassBorder flex justify-between items-center shadow-sm">
                <div>
                  <span className="text-[10px] text-textSecondary font-bold block">{t.id}</span>
                  <span className="text-sm font-bold text-textPrimary block mt-0.5">{t.title}</span>
                  <span className="text-[10px] text-textSecondary block mt-1">SLA: {new Date(t.slaDeadline).toLocaleDateString()}</span>
                </div>
                <button 
                  onClick={() => onSelectTicket(t)}
                  className="px-3.5 py-1.5 bg-accentNeon hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  Verify Spot
                </button>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* GPS Verifications tool */}
        <GlassCard className="flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-textPrimary mb-4 flex items-center">
              <Compass className="mr-2 text-accentNeon" size={18} /> GPS Coordinate Proximity Check
            </h3>
            <p className="text-xs text-textSecondary leading-relaxed">
              Stand at the repair coordinate location, capture coordinate maps, and cross-reference device GPS logs against the ticket parameters.
            </p>
            <div className="p-4 rounded-xl bg-background border border-glassBorder mt-4 flex items-center justify-between text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-textSecondary font-bold block uppercase">Locked Device Location</span>
                <span className="text-textPrimary font-bold">Latitude: 12.9716, Longitude: 77.5946</span>
              </div>
              <span className="px-2.5 py-0.5 rounded bg-successNeon/10 border border-successNeon/30 text-successNeon font-bold text-[10px]">LOCKED</span>
            </div>
          </div>
          <button className="w-full py-3.5 mt-6 bg-accentNeon hover:opacity-90 text-white font-bold rounded-xl text-xs flex justify-center items-center shadow-md">
            Verify coordinate match within 50m
          </button>
        </GlassCard>
      </div>
    </div>
  );
};
export default FieldDashboard;
