import React from 'react';
import { GlassCard } from './GlassCard';
import { Eye, ShieldAlert, Cpu } from 'lucide-react';

interface ProofViewerProps {
  proofPhotoUrl: string;
  status: 'IDLE' | 'UPLOADING' | 'AI_ANALYZING' | 'SUCCESS' | 'FAILED';
  aiVerdict: string | null;
}

export const ProofViewer: React.FC<ProofViewerProps> = ({
  proofPhotoUrl,
  status,
  aiVerdict
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {/* Pane 1: Contractor Proof */}
      <GlassCard className="flex flex-col">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-glassBorder">
          <h3 className="text-sm font-bold tracking-wider text-gray-300 flex items-center">
            <Eye className="mr-2 text-accentNeon" size={18} />
            CONTRACTOR SUBMITTED PROOF
          </h3>
        </div>
        <div className="w-full h-64 rounded-xl overflow-hidden bg-black/40 border border-glassBorder flex items-center justify-center relative">
          {proofPhotoUrl ? (
            <img
              src={proofPhotoUrl}
              alt="Contractor proof of work"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs text-gray-500">No proof-of-work photo uploaded yet</span>
          )}
        </div>
      </GlassCard>

      {/* Pane 2: AI Density Computer Vision Analysis */}
      <GlassCard className="flex flex-col">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-glassBorder">
          <h3 className="text-sm font-bold tracking-wider text-gray-300 flex items-center">
            <Cpu className="mr-2 text-successNeon" size={18} />
            AI COMPUTER VISION VERIFICATION
          </h3>
        </div>

        <div className="w-full h-64 rounded-xl overflow-hidden bg-black/40 border border-glassBorder flex flex-col justify-center items-center p-6 relative">
          {/* Overlay scanning effect simulation when analyzing */}
          {status === 'AI_ANALYZING' && (
            <div className="absolute inset-0 bg-accentNeon/5 flex flex-col justify-center items-center">
              <div className="w-12 h-12 border-4 border-accentNeon/20 border-t-accentNeon rounded-full animate-spin" />
              <span className="text-xs text-accentNeon font-bold mt-4 animate-pulse">
                SCANNING IMAGE DATA CLUSTERS...
              </span>
            </div>
          )}

          {status === 'SUCCESS' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-successNeon/20 border border-successNeon flex items-center justify-center mx-auto shadow-lg shadow-successNeon/35">
                <Cpu size={32} className="text-successNeon" />
              </div>
              <div className="text-lg font-bold text-successNeon">VERDICT: PASS</div>
              <p className="text-xs text-gray-300 px-4 leading-relaxed">{aiVerdict}</p>
            </div>
          )}

          {status === 'FAILED' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center mx-auto shadow-lg shadow-red-500/35">
                <ShieldAlert size={32} className="text-red-400" />
              </div>
              <div className="text-lg font-bold text-red-400">VERDICT: ACTION REQUIRED</div>
              <p className="text-xs text-gray-300 px-4 leading-relaxed">
                {aiVerdict || 'Image analysis detected non-conforming surface roughness or patch gaps.'}
              </p>
            </div>
          )}

          {status === 'IDLE' && (
            <div className="text-center text-gray-500">
              <Cpu size={40} className="mx-auto text-gray-600 mb-2" />
              <span className="text-xs">Awaiting contractor proof upload to initiate computer vision scan</span>
            </div>
          )}

          {status === 'UPLOADING' && (
            <div className="text-center text-accentNeon">
              <div className="w-10 h-10 border-4 border-accentNeon/20 border-t-accentNeon rounded-full animate-spin mx-auto" />
              <span className="text-xs mt-4 block">RECEIVING BINARY STREAM...</span>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};
export default ProofViewer;
