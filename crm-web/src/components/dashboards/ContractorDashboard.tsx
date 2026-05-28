import React from 'react';
import { WorkOrder } from '../../types';
import { GlassCard } from '../GlassCard';
import { UploadCloud } from 'lucide-react';

interface ContractorDashboardProps {
  workOrder: WorkOrder | null;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ContractorDashboard: React.FC<ContractorDashboardProps> = ({ workOrder, handleFileUpload }) => {
  return (
    <div className="space-y-8 animate-slide-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Work order milestones tracker */}
        <GlassCard className="md:col-span-2">
          <h3 className="text-lg font-bold text-textPrimary mb-4">Assigned Work Order milestones</h3>
          {workOrder ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-surface border border-glassBorder shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-sm font-bold text-textPrimary">{workOrder.description}</span>
                    <span className="text-[10px] text-textSecondary block mt-0.5">Assigned to: {workOrder.contractorId}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-accentNeon/10 border border-accentNeon/30 text-accentNeon text-[10px] font-bold uppercase">{workOrder.status}</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-accentNeon rounded-full" style={{ width: workOrder.status === 'APPROVED' ? '100%' : '50%' }} />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-textSecondary">
                  <span>Stage 1: Prep Work</span>
                  <span>Stage 2: Completed Verification</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-textSecondary text-xs">No active projects assigned.</div>
          )}
        </GlassCard>

        {/* Upload Proof Zones */}
        <GlassCard className="flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-textPrimary mb-4">Submit Repair Proof</h3>
            <p className="text-xs text-textSecondary leading-relaxed mb-4">
              Upload high-resolution completed road work photos. The crm-ai-service will dynamically evaluate densities and GPS parameters.
            </p>
          </div>
          <div>
            <input
              type="file"
              id="pow-upload-cont"
              className="hidden"
              onChange={handleFileUpload}
            />
            <label
              htmlFor="pow-upload-cont"
              className="flex justify-center items-center p-4 border border-dashed border-glassBorder rounded-xl hover:border-accentNeon cursor-pointer text-xs transition-all text-textSecondary hover:text-textPrimary bg-surface shadow-sm"
            >
              <UploadCloud className="mr-2" size={16} /> Choose & Upload Repair Photo
            </label>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
export default ContractorDashboard;
