import React, { useState } from 'react';
import { GlassCard } from './GlassCard';
import { Eye, ShieldAlert, Cpu, Check, AlertTriangle, HelpCircle, HardHat } from 'lucide-react';

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
  const [sliderPosition, setSliderPosition] = useState(50); // Percentage comparison slider state
  const [showMetadata, setShowMetadata] = useState(true);

  // Fallback before image mock (RW-4217 severe pothole)
  const beforePhotoUrl = 'https://picsum.photos/400/300';
  const resolvedPhotoUrl = proofPhotoUrl || 'https://picsum.photos/400/301';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      
      {/* PANE 1: Contractor Proof & Before/After Image Slider */}
      <GlassCard className="flex flex-col justify-between">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-glassBorder">
          <h3 className="text-sm font-bold tracking-wider text-textSecondary flex items-center">
            <Eye className="mr-2 text-accentNeon" size={18} />
            CONTRACTOR SUBMITTED PROOF (BEFORE / AFTER COMPARISON)
          </h3>
          <button 
            onClick={() => setShowMetadata(!showMetadata)}
            className="px-2 py-1 bg-surface border border-glassBorder rounded text-[10px] text-textSecondary hover:text-textPrimary font-bold"
          >
            {showMetadata ? 'Hide EXIF' : 'Show EXIF'}
          </button>
        </div>

        {/* Before/After Split comparison slider container */}
        <div className="w-full h-72 rounded-xl overflow-hidden bg-background border border-glassBorder flex items-center justify-center relative select-none">
          <div className="absolute inset-0 flex items-center justify-center">
            
            {/* Before Photo (Lower Layer) */}
            <img
              src={beforePhotoUrl}
              alt="Before road damage"
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* After Photo (Upper Layer - clipped by slider percentage) */}
            <div 
              className="absolute inset-y-0 left-0 right-0 overflow-hidden"
              style={{ width: `${sliderPosition}%` }}
            >
              <img
                src={resolvedPhotoUrl}
                alt="After repaired pavement"
                className="absolute inset-y-0 left-0 w-full h-72 object-cover"
                style={{ width: '100%', maxWidth: 'none' }}
              />
              <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded bg-successNeon text-white text-[9px] font-bold uppercase z-20">AFTER</span>
            </div>

            {/* Before indicator */}
            <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-red-500 text-white text-[9px] font-bold uppercase z-20">BEFORE</span>

            {/* Slider Divider bar and dragging knob */}
            <div 
              className="absolute inset-y-0 w-1 bg-accentNeon cursor-ew-resize z-30"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 -left-3.5 -translate-y-1/2 w-8 h-8 rounded-full bg-white border-2 border-accentNeon shadow-md flex items-center justify-center font-black text-xs text-accentNeon z-40 select-none">
                ↔
              </div>
            </div>

            {/* Interactive invisible slider input overlapping container */}
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={sliderPosition} 
              onChange={(e) => setSliderPosition(Number(e.target.value))}
              className="absolute inset-0 opacity-0 cursor-ew-resize z-40 w-full h-full"
            />
          </div>

          {/* Floating EXIF Metadata Inspector Overlay */}
          {showMetadata && (
            <div className="absolute top-3 left-3 bg-background/90 border border-glassBorder p-3 rounded-lg z-20 max-w-[200px] shadow-lg animate-slide-in">
              <span className="text-[9px] text-accentNeon font-black block uppercase tracking-widest border-b border-glassBorder pb-1 mb-1.5">📡 GPS EXIF METADATA</span>
              <div className="space-y-1 text-[9px] text-textSecondary font-semibold">
                <div>Coords: <span className="text-textPrimary font-bold">12.9716, 77.5946</span></div>
                <div>Camera: <span className="text-textPrimary font-bold">Sony IMX686 (JE Dev)</span></div>
                <div>Timestamp: <span className="text-textPrimary font-bold">2026-05-28 21:12</span></div>
                <div>Precision: <span className="text-textPrimary font-bold">± 4.2 meters</span></div>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* PANE 2: AI Density Computer Vision Analysis */}
      <GlassCard className="flex flex-col justify-between">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-glassBorder">
          <h3 className="text-sm font-bold tracking-wider text-textSecondary flex items-center">
            <Cpu className="mr-2 text-successNeon" size={18} />
            AI COMPUTER VISION VERIFICATION PIPELINE
          </h3>
        </div>

        <div className="w-full h-72 rounded-xl overflow-hidden bg-background border border-glassBorder flex flex-col justify-center items-center p-6 relative">
          
          {/* AI Analyzing Scanner effect */}
          {status === 'AI_ANALYZING' && (
            <div className="absolute inset-0 bg-accentNeon/5 flex flex-col justify-center items-center">
              <div className="w-12 h-12 border-4 border-accentNeon/20 border-t-accentNeon rounded-full animate-spin" />
              <span className="text-xs text-accentNeon font-bold mt-4 animate-pulse uppercase tracking-wider">
                Scanning asphalt aggregate & GPS proximity...
              </span>
            </div>
          )}

          {/* Success Verdict Pane with checklist details */}
          {status === 'SUCCESS' && (
            <div className="w-full h-full flex flex-col justify-between space-y-4 py-2 animate-slide-in">
              
              {/* Verdict Banner */}
              <div className="p-3 bg-successNeon/10 border border-successNeon/30 rounded-xl flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 bg-successNeon/20 rounded-lg">
                    <Cpu size={16} className="text-successNeon" />
                  </div>
                  <div>
                    <span className="text-lg font-black text-successNeon block tracking-tight">VERDICT: PASS</span>
                    <span className="text-[9px] text-textSecondary font-bold uppercase tracking-wider block">Computer Vision Cleared</span>
                  </div>
                </div>
                <span className="text-xs font-black text-successNeon bg-successNeon/25 px-2.5 py-0.5 rounded-full">94.6% Match</span>
              </div>

              {/* Object Detection Checklist tags */}
              <div className="space-y-2 border-y border-glassBorder/60 py-3">
                <span className="text-[10px] text-textSecondary font-bold block uppercase tracking-wider">Detectable repair markers</span>
                <div className="grid grid-cols-2 gap-2 text-xs text-textPrimary">
                  <div className="flex items-center space-x-2">
                    <div className="p-0.5 bg-successNeon/20 rounded-full"><Check size={12} className="text-successNeon" /></div>
                    <span className="font-semibold text-xs">Fresh Asphalt Patch</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="p-0.5 bg-successNeon/20 rounded-full"><Check size={12} className="text-successNeon" /></div>
                    <span className="font-semibold text-xs">Paint lines aligned</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="p-0.5 bg-successNeon/20 rounded-full"><Check size={12} className="text-successNeon" /></div>
                    <span className="font-semibold text-xs">EXIF GPS Validated</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="p-0.5 bg-glassBorder rounded-full"><Check size={12} className="text-textSecondary opacity-30" /></div>
                    <span className="font-semibold text-xs text-textSecondary opacity-60">Leftover debris (None)</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-textSecondary leading-relaxed px-1 font-semibold">{aiVerdict}</p>
            </div>
          )}

          {/* Failed Verdict Pane */}
          {status === 'FAILED' && (
            <div className="text-center space-y-4 animate-slide-in">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500 flex items-center justify-center mx-auto shadow-md shadow-red-500/15">
                <ShieldAlert size={32} className="text-red-500 dark:text-red-400" />
              </div>
              <div className="text-lg font-bold text-red-500 dark:text-red-400">VERDICT: ACTION REQUIRED</div>
              <p className="text-xs text-textSecondary px-4 leading-relaxed font-semibold">
                {aiVerdict || 'Image analysis detected non-conforming surface roughness or patch gaps.'}
              </p>
            </div>
          )}

          {/* Idle State */}
          {status === 'IDLE' && (
            <div className="text-center text-textSecondary opacity-70">
              <Cpu size={40} className="mx-auto text-textSecondary opacity-50 mb-3" />
              <span className="text-xs font-semibold block mb-1">Computer Vision Pipeline Idle</span>
              <span className="text-[10px] text-textSecondary block px-6">Upload completed repair proof photos in the left pane to initialize automated density validation checks.</span>
            </div>
          )}

          {/* Uploading State */}
          {status === 'UPLOADING' && (
            <div className="text-center text-accentNeon">
              <div className="w-10 h-10 border-4 border-accentNeon/20 border-t-accentNeon rounded-full animate-spin mx-auto" />
              <span className="text-xs mt-4 block font-bold tracking-wider">RECEIVING BINARY IMAGE DATA STREAM...</span>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};
export default ProofViewer;
