import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useThemeStore } from '../state/themeStore';
import { Colors } from '../styles/theme';

interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, ...props }) => {
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';

  return (
    <View
      style={[
        styles.card,
        isDark ? styles.cardDark : styles.cardLight,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    // shadow-lg equivalent
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  cardLight: {
    backgroundColor: Colors.light.cardBg,
    borderColor: Colors.light.borderBg,
  },
  cardDark: {
    backgroundColor: Colors.dark.cardBg,
    borderColor: Colors.dark.borderBg,
  },
});
