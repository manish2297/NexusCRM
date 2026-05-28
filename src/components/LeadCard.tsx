import React from 'react';
import { View, Text, StyleSheet, Pressable, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/theme';
import { Lead } from '@/constants/DummyData';
import GlassCard from './GlassCard';

interface LeadCardProps {
  lead: Lead;
}

export const LeadCard: React.FC<LeadCardProps> = ({ lead }) => {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'light' ? 'light' : 'dark'];

  // Helper to resolve status colors dynamically
  const getStatusColor = (status: Lead['status']) => {
    switch (status) {
      case 'New': return theme.statusNew;
      case 'Contacted': return theme.statusContacted;
      case 'Proposal': return theme.statusProposal;
      case 'Won': return theme.statusWon;
      case 'Lost': return theme.statusLost;
      default: return theme.textSecondary;
    }
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const handlePress = () => {
    router.push({
      pathname: '/lead/[id]',
      params: { id: lead.id }
    });
  };

  const renderFollowUpBadge = () => {
    if (!lead.nextFollowUp || lead.status === 'Won' || lead.status === 'Lost') return null;

    const todayStr = new Date().toISOString().split('T')[0];

    let badgeBg = 'rgba(0, 242, 254, 0.08)'; 
    let badgeBorder = 'rgba(0, 242, 254, 0.3)';
    let badgeText = '#00F2FE';
    let label = `Follow-up: ${lead.nextFollowUp.substring(5)}`; 

    if (lead.nextFollowUp < todayStr) {
      badgeBg = 'rgba(255, 74, 74, 0.08)';
      badgeBorder = 'rgba(255, 74, 74, 0.3)';
      badgeText = '#FF4A4A';
      label = `⚠️ Overdue (${lead.nextFollowUp.substring(5)})`;
    } else if (lead.nextFollowUp === todayStr) {
      badgeBg = 'rgba(255, 179, 0, 0.08)';
      badgeBorder = 'rgba(255, 179, 0, 0.3)';
      badgeText = '#FFB300';
      label = `📅 Due Today`;
    } else {
      badgeBg = 'rgba(0, 230, 118, 0.08)';
      badgeBorder = 'rgba(0, 230, 118, 0.3)';
      badgeText = '#00E676';
      label = `🕒 Scheduled: ${lead.nextFollowUp.substring(5)}`;
    }

    return (
      <View style={[styles.followUpBadge, { backgroundColor: badgeBg, borderColor: badgeBorder }]}>
        <Text style={[styles.followUpText, { color: badgeText }]}>{label}</Text>
      </View>
    );
  };

  return (
    <Pressable onPress={handlePress} style={({ pressed }) => pressed && styles.pressed}>
      <GlassCard style={styles.cardContainer}>
        <View style={styles.row}>
          {/* Avatar with dynamic initials */}
          <View style={[styles.avatar, { backgroundColor: getStatusColor(lead.status) + '22', borderColor: getStatusColor(lead.status) }]}>
            <Text style={[styles.avatarText, { color: getStatusColor(lead.status) }]}>
              {getInitials(lead.name)}
            </Text>
          </View>

          {/* Core contact details */}
          <View style={styles.detailsCol}>
            <Text style={[styles.leadName, { color: theme.text }]} numberOfLines={1}>
              {lead.name}
            </Text>
            <Text style={[styles.company, { color: theme.textSecondary }]} numberOfLines={1}>
              {lead.company}
            </Text>
            <View style={styles.pillsRow}>
              <View style={styles.sourcePill}>
                <Text style={[styles.sourceText, { color: theme.textSecondary }]}>
                  {lead.source}
                </Text>
              </View>
              {renderFollowUpBadge()}
            </View>
          </View>

          {/* Deal Value & Status Badge */}
          <View style={styles.valueCol}>
            <Text style={[styles.dealValue, { color: theme.text }]}>
              ${lead.value.toLocaleString()}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(lead.status) + '15', borderColor: getStatusColor(lead.status) + '44' }]}>
              <View style={[styles.badgeDot, { backgroundColor: getStatusColor(lead.status) }]} />
              <Text style={[styles.statusText, { color: getStatusColor(lead.status) }]}>
                {lead.status}
              </Text>
            </View>
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginVertical: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  detailsCol: {
    flex: 1,
    justifyContent: 'center',
  },
  leadName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  company: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 4,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
  },
  sourcePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sourceText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  followUpBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
  },
  followUpText: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  valueCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  dealValue: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});
export default LeadCard;
