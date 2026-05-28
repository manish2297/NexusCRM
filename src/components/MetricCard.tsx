import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';
import GlassCard from './GlassCard';

interface MetricCardProps {
  label: string;
  value: string | number;
  subText: string;
  type?: 'primary' | 'success' | 'warning' | 'info';
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, subText, type = 'info' }) => {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'light' ? 'light' : 'dark'];

  // Resolve glowing visual highlights based on metric focus area
  const getHighlightColor = () => {
    switch (type) {
      case 'primary': return theme.primary;
      case 'success': return theme.statusWon;
      case 'warning': return theme.statusContacted;
      case 'info': return theme.statusNew;
      default: return theme.primary;
    }
  };

  return (
    <GlassCard style={styles.card} gradient={type === 'primary'}>
      {/* Top visual glow bar */}
      <View style={[styles.glowBar, { backgroundColor: getHighlightColor() }]} />

      <Text style={[styles.label, { color: theme.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
      
      <Text style={[styles.value, { color: theme.text }]} numberOfLines={1}>
        {value}
      </Text>
      
      <View style={styles.subtextRow}>
        <View style={[styles.indicatorDot, { backgroundColor: getHighlightColor() }]} />
        <Text style={[styles.subText, { color: theme.textSecondary }]} numberOfLines={1}>
          {subText}
        </Text>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    marginHorizontal: 6,
    marginVertical: 6,
    padding: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  glowBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    opacity: 0.8,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  subtextRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  subText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
});
export default MetricCard;
