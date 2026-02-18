import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = "", hoverEffect = true }) => {
  return (
    <div 
      className={`
        glass-card rounded-2xl md:rounded-3xl p-5 md:p-8 
        ${hoverEffect ? 'hover:bg-white/5 hover:scale-[1.01] hover:border-indigo-500/30' : ''} 
        transition-all duration-500 ease-out
        ${className}
      `}
    >
      {children}
    </div>
  );
};