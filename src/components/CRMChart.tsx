import React from 'react';
import { View, Text, StyleSheet, Dimensions, useColorScheme } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Rect, G } from 'react-native-svg';
import { Colors } from '@/constants/theme';
import { Lead } from '@/constants/DummyData';

const screenWidth = Dimensions.get('window').width - 32; // Responsive bounds

interface CRMChartProps {
  leads: Lead[];
}

export const CRMChart: React.FC<CRMChartProps> = ({ leads }) => {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'light' ? 'light' : 'dark'];

  // 1. Pipeline Segment Breakdown calculation
  const totalValue = leads.reduce((sum, l) => sum + l.value, 0);
  const statusValues = leads.reduce(
    (acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + lead.value;
      return acc;
    },
    {} as Record<string, number>
  );

  const stages: { label: string; key: Lead['status']; color: string }[] = [
    { label: 'New', key: 'New', color: theme.statusNew },
    { label: 'Contact', key: 'Contacted', color: theme.statusContacted },
    { label: 'Proposal', key: 'Proposal', color: theme.statusProposal },
    { label: 'Won', key: 'Won', color: theme.statusWon },
    { label: 'Lost', key: 'Lost', color: theme.statusLost },
  ];

  // Calculate percentage splits for the pipeline horizontal bar
  let cumulativeWidth = 0;
  const barSegments = stages.map(stage => {
    const val = statusValues[stage.key] || 0;
    const percentage = totalValue > 0 ? val / totalValue : 0;
    const segmentWidth = percentage * (screenWidth - 32); // Bar width inside padding
    const startX = cumulativeWidth;
    cumulativeWidth += segmentWidth;
    return {
      ...stage,
      value: val,
      percentage: Math.round(percentage * 100),
      startX,
      width: segmentWidth,
    };
  });

  // 2. Trend Data (Static simulation matching the dummy lead dates but reactive to modifications)
  // Sarah ($85k, Proposal), Bruce ($250k, Won), Tony ($175k, Contacted), Diana ($45k, New), Peter ($12k, Lost)
  // Let's create a beautiful bezier curve connecting five points on an SVG view:
  // Points representing monthly growth: (Jan: 50k, Feb: 90k, Mar: 120k, Apr: 180k, May: Current active + won value)
  const currentTotal = leads
    .filter(l => l.status === 'Won')
    .reduce((sum, l) => sum + l.value, 0) + 120000; // Offset base to look authentic
    
  const dataPoints = [40000, 75000, 110000, 165000, currentTotal];
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
  
  // Svg Drawing Config
  const chartHeight = 140;
  const chartWidth = screenWidth - 32;
  const maxVal = Math.max(...dataPoints, 200000) * 1.1; // Add 10% padding on top
  const paddingX = 20;
  const paddingY = 20;

  // Convert raw value array to X,Y coordinate objects
  const coords = dataPoints.map((val, index) => {
    const x = paddingX + (index / (dataPoints.length - 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - (val / maxVal) * (chartHeight - paddingY * 2);
    return { x, y };
  });

  // Generate smooth SVG Bezier curve command string
  const drawBezierPath = () => {
    if (coords.length === 0) return '';
    let path = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i];
      const p1 = coords[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  const bezierPath = drawBezierPath();
  const fillPath = bezierPath 
    ? `${bezierPath} L ${coords[coords.length - 1].x} ${chartHeight - paddingY} L ${coords[0].x} ${chartHeight - paddingY} Z` 
    : '';

  return (
    <View style={styles.container}>
      {/* 1. Curve Trend Chart */}
      <View style={styles.chartSection}>
        <View style={styles.chartHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Sales Pipeline Trend</Text>
          <Text style={[styles.subText, { color: theme.textSecondary }]}>Historical Revenue Growth</Text>
        </View>

        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            {/* Smooth visual curve stroke gradient */}
            <LinearGradient id="strokeGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor={theme.primary} stopOpacity="1" />
              <Stop offset="100%" stopColor={theme.secondary} stopOpacity="1" />
            </LinearGradient>
            {/* High-end glowing backdrop gradient */}
            <LinearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={theme.primary} stopOpacity="0.3" />
              <Stop offset="100%" stopColor={theme.primary} stopOpacity="0.0" />
            </LinearGradient>
          </Defs>

          {/* Under-path fill area */}
          {fillPath ? <Path d={fillPath} fill="url(#fillGrad)" /> : null}

          {/* Glowing spline stroke line */}
          {bezierPath ? (
            <Path
              d={bezierPath}
              fill="none"
              stroke="url(#strokeGrad)"
              strokeWidth="3.5"
            />
          ) : null}

          {/* Coordinates markers (glow circles) */}
          {coords.map((coord, index) => (
            <G key={`point-${index}`}>
              <Circle
                cx={coord.x}
                cy={coord.y}
                r="7"
                fill={theme.background}
                stroke={index === coords.length - 1 ? theme.secondary : theme.primary}
                strokeWidth="2.5"
              />
              <Circle
                cx={coord.x}
                cy={coord.y}
                r="3"
                fill={index === coords.length - 1 ? theme.secondary : theme.primary}
              />
            </G>
          ))}
        </Svg>

        {/* Labels bar */}
        <View style={styles.labelRow}>
          {labels.map((label, index) => (
            <Text key={`lbl-${index}`} style={[styles.chartLabel, { color: theme.textSecondary }]}>
              {label}
            </Text>
          ))}
        </View>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      {/* 2. Horizontal Segmented Pipeline Split */}
      <View style={styles.pipelineSection}>
        <View style={styles.chartHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Deal Stage Allocation</Text>
          <Text style={[styles.subText, { color: theme.textSecondary }]}>
            Portfolio Total: ${totalValue.toLocaleString()}
          </Text>
        </View>

        {/* The segmented SVG bar */}
        <View style={styles.progressBarWrapper}>
          <Svg width={chartWidth} height={14}>
            {barSegments.map((segment, index) => {
              if (segment.width <= 0) return null;
              return (
                <Rect
                  key={`seg-${index}`}
                  x={segment.startX}
                  y="0"
                  width={segment.width}
                  height="14"
                  fill={segment.color}
                  rx={index === 0 || index === barSegments.length - 1 ? 7 : 0}
                />
              );
            })}
          </Svg>
        </View>

        {/* Legend listing percentages */}
        <View style={styles.legendContainer}>
          {barSegments.map((seg, index) => (
            <View key={`leg-${index}`} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: seg.color }]} />
              <Text style={[styles.legendLabel, { color: theme.text }]}>
                {seg.label} <Text style={{ color: theme.textSecondary, fontWeight: 'bold' }}>{seg.percentage}%</Text>
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  chartSection: {
    marginBottom: 8,
  },
  pipelineSection: {
    marginTop: 8,
  },
  chartHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  subText: {
    fontSize: 12,
    marginTop: 2,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: 8,
  },
  chartLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  progressBarWrapper: {
    borderRadius: 7,
    overflow: 'hidden',
    marginBottom: 12,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 11,
  },
});
export default CRMChart;
