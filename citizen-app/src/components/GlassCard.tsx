import React from 'react';
import { View, ViewProps } from 'react-native';

interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className, ...props }) => {
  return (
    <View
      className={`bg-cardBg border border-borderBg rounded-2xl p-4 shadow-lg ${className}`}
      {...props}
    >
      {children}
    </View>
  );
};
