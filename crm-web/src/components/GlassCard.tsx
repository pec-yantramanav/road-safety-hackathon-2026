import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`glass-panel shadow-2xl relative overflow-hidden ${className}`}
      {...props}
    >
      {/* Decorative ambient background blur gradients to create premium wow factor */}
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-accentNeon/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-successNeon/5 rounded-full blur-2xl pointer-events-none" />
      
      <div className="relative z-10">{children}</div>
    </div>
  );
};
export default GlassCard;
