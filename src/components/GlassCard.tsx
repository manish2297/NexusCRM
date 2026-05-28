import React from 'react';
import { StyleSheet, View, ViewStyle, useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  gradient?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, gradient = false }) => {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'light' ? 'light' : 'dark'];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
        },
        gradient && {
          // Highlight card style when glowing
          shadowColor: theme.primary,
          shadowOpacity: 0.25,
          shadowRadius: 20,
        },
        style,
      ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginVertical: 8,
    // Premium shadow definitions
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
});
export default GlassCard;
