import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { Lead } from '@/constants/DummyData';
import GlassCard from './GlassCard';

interface SalesFunnelProps {
  leads: Lead[];
  formatCurrency: (val: number) => string;
}

export const SalesFunnelChart: React.FC<SalesFunnelProps> = ({ leads, formatCurrency }) => {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'light' ? 'light' : 'dark'];

  // 1. Funnel Stages Breakdown
  const stages: { stage: Lead['status']; label: string; color: string }[] = [
    { stage: 'New', label: '1. New Lead Inbound', color: theme.statusNew },
    { stage: 'Contacted', label: '2. Qualified & Contacted', color: theme.statusContacted },
    { stage: 'Proposal', label: '3. Proposal In Negotiation', color: theme.statusProposal },
    { stage: 'Won', label: '4. Closed Won Revenue', color: theme.statusWon },
  ];

  const totalLeadsCount = leads.length || 1;

  // 2. Acquisition Source Attribution Breakdown
  const sources = ['Referral', 'LinkedIn', 'Website', 'Cold Call', 'Event'];
  const sourceStats = sources
    .map(src => {
      const srcLeads = leads.filter(l => l.source === src);
      const val = srcLeads.reduce((sum, l) => sum + l.value, 0);
      return {
        source: src,
        count: srcLeads.length,
        value: val,
        percentage: Math.round((srcLeads.length / totalLeadsCount) * 100),
      };
    })
    .sort((a, b) => b.value - a.value);

  return (
    <View style={styles.container}>
      {/* 1. Stage Conversion Drop-Off Funnel */}
      <GlassCard style={styles.card} gradient>
        <View style={styles.headerRow}>
          <Text style={[styles.preTitle, { color: theme.primary }]}>PIPELINE VELOCITY</Text>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Deal Progression Funnel</Text>
          <Text style={[styles.subText, { color: theme.textSecondary }]}>
            Conversion volumes and revenue value across primary deal milestones.
          </Text>
        </View>

        <View style={styles.funnelList}>
          {stages.map((st, idx) => {
            const stageLeads = leads.filter(l => l.status === st.stage);
            const stageCount = stageLeads.length;
            const stageVal = stageLeads.reduce((sum, l) => sum + l.value, 0);
            const ratio = Math.max(8, Math.round((stageCount / totalLeadsCount) * 100));

            return (
              <View key={st.stage} style={styles.funnelItem}>
                <View style={styles.funnelLabelRow}>
                  <Text style={[styles.funnelStageName, { color: theme.text }]}>{st.label}</Text>
                  <View style={styles.funnelStatRight}>
                    <Text style={[styles.funnelCount, { color: st.color }]}>
                      {stageCount} {stageCount === 1 ? 'deal' : 'deals'}
                    </Text>
                    <Text style={[styles.funnelVal, { color: theme.textSecondary }]}>
                      ({formatCurrency(stageVal)})
                    </Text>
                  </View>
                </View>

                {/* Progress Visual Bar */}
                <View style={[styles.barTrack, { backgroundColor: theme.background }]}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${ratio}%`,
                        backgroundColor: st.color,
                      },
                    ]}
                  />
                </View>

                {idx < stages.length - 1 && (
                  <View style={styles.arrowRow}>
                    <Text style={[styles.arrowText, { color: theme.textSecondary }]}>↓</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </GlassCard>

      {/* 2. Acquisition Attribution Source Breakdown */}
      <GlassCard style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={[styles.preTitle, { color: theme.primary }]}>MARKETING & ORIGINATION</Text>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Lead Source Attribution</Text>
          <Text style={[styles.subText, { color: theme.textSecondary }]}>
            Revenue generation by acquisition channels.
          </Text>
        </View>

        <View style={styles.sourceGrid}>
          {sourceStats.map(stat => (
            <View
              key={stat.source}
              style={[
                styles.sourceCard,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}>
              <View style={styles.sourceHeader}>
                <Text style={[styles.sourceName, { color: theme.text }]}>{stat.source}</Text>
                <View
                  style={[
                    styles.sourceBadge,
                    { backgroundColor: theme.primary + '20', borderColor: theme.primary },
                  ]}>
                  <Text style={[styles.sourceBadgeText, { color: theme.primary }]}>
                    {stat.percentage}%
                  </Text>
                </View>
              </View>
              <Text style={[styles.sourceVal, { color: theme.primary }]}>
                {formatCurrency(stat.value)}
              </Text>
              <Text style={[styles.sourceCount, { color: theme.textSecondary }]}>
                {stat.count} accounts registered
              </Text>
            </View>
          ))}
        </View>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.four,
    marginVertical: 4,
  },
  card: {
    padding: Spacing.four,
  },
  headerRow: {
    marginBottom: Spacing.three,
  },
  preTitle: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subText: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  funnelList: {
    gap: 8,
  },
  funnelItem: {
    gap: 4,
  },
  funnelLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  funnelStageName: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  funnelStatRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  funnelCount: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  funnelVal: {
    fontSize: 10.5,
  },
  barTrack: {
    height: 7,
    borderRadius: 3.5,
    overflow: 'hidden',
    marginTop: 2,
  },
  barFill: {
    height: '100%',
    borderRadius: 3.5,
  },
  arrowRow: {
    alignItems: 'center',
    marginVertical: -2,
  },
  arrowText: {
    fontSize: 11,
    opacity: 0.5,
  },
  sourceGrid: {
    gap: 8,
  },
  sourceCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 2,
  },
  sourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourceName: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  sourceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.8,
  },
  sourceBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  sourceVal: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  sourceCount: {
    fontSize: 10,
  },
});

export default SalesFunnelChart;
