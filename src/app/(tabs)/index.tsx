import React from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, useColorScheme, Platform, Alert, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useCRM } from '@/context/CRMContext';
import { useAuth } from '@/context/AuthContext';
import { Colors, Spacing, BottomTabInset, MaxContentWidth } from '@/constants/theme';
import MetricCard from '@/components/MetricCard';
import CRMChart from '@/components/CRMChart';
import LeadCard from '@/components/LeadCard';
import GlassCard from '@/components/GlassCard';

export default function DashboardScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'light' ? 'light' : 'dark'];
  const insets = useSafeAreaInsets();
  
  const { leads, metrics, updateLead, addTimelineNote } = useCRM();
  const { logout } = useAuth();

  const todayStr = new Date().toISOString().split('T')[0];

  // AI Co-Pilot Recommendation Engine
  const copilotRecommendations = React.useMemo(() => {
    const list: {
      id: string;
      leadId: string;
      leadName: string;
      type: 'no_followup' | 'stale' | 'overdue';
      title: string;
      description: string;
      actionText: string;
      onAction: () => void;
    }[] = [];

    const activeLeads = leads.filter(l => l.status !== 'Won' && l.status !== 'Lost');
    
    // 1. Overdue outreach
    activeLeads.forEach(l => {
      if (l.nextFollowUp && l.nextFollowUp < todayStr) {
        list.push({
          id: `rec-overdue-${l.id}`,
          leadId: l.id,
          leadName: l.name,
          type: 'overdue',
          title: `Overdue outreach for ${l.name}`,
          description: `Follow-up was scheduled on ${l.nextFollowUp}. Reach out and log it now.`,
          actionText: '☏ Call Now',
          onAction: () => {
            router.push({ pathname: '/lead/[id]', params: { id: l.id } });
          }
        });
      }
    });

    // 2. High-value lead without follow-up date
    activeLeads.forEach(l => {
      if (l.value >= 50000 && !l.nextFollowUp) {
        list.push({
          id: `rec-followup-${l.id}`,
          leadId: l.id,
          leadName: l.name,
          type: 'no_followup',
          title: `Set Follow-up for ${l.name}`,
          description: `High-value deal ($${l.value.toLocaleString()}) has no future follow-up scheduled.`,
          actionText: '📅 Schedule (+7d)',
          onAction: () => {
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            const nextWeekStr = nextWeek.toISOString().split('T')[0];
            updateLead(l.id, { nextFollowUp: nextWeekStr });
            if (Platform.OS === 'web') {
              alert(`Follow-up scheduled for ${l.name} on ${nextWeekStr}!`);
            } else {
              Alert.alert('Scheduled', `Follow-up scheduled for ${l.name} on ${nextWeekStr}.`);
            }
          }
        });
      }
    });

    // 3. Stale lead (no updates in 5 days)
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const fiveDaysAgoStr = fiveDaysAgo.toISOString();

    activeLeads.forEach(l => {
      const lastEvent = l.timeline.length > 0 ? l.timeline[l.timeline.length - 1] : null;
      const refDate = lastEvent ? lastEvent.date : l.createdAt;
      if (refDate < fiveDaysAgoStr) {
        list.push({
          id: `rec-stale-${l.id}`,
          leadId: l.id,
          leadName: l.name,
          type: 'stale',
          title: `Re-engage ${l.name}`,
          description: `No activity recorded for 5 days. Keep the conversation going!`,
          actionText: '⚡ Pitch Helper',
          onAction: () => {
            router.push({ pathname: '/lead/[id]', params: { id: l.id } });
          }
        });
      }
    });

    return list;
  }, [leads, todayStr, updateLead]);

  // Radar for active prospects requiring manual outreach today or in the past
  const followUpRadarLeads = leads.filter(l => {
    if (!l.nextFollowUp || l.status === 'Won' || l.status === 'Lost') return false;
    return l.nextFollowUp <= todayStr;
  });

  // Highlight high-value deals in progress (value >= $50k and active status)
  const highValueDeals = leads.filter(
    l => l.value >= 50000 && l.status !== 'Won' && l.status !== 'Lost'
  );

  const paddingBottomStyle = Platform.select({
    ios: insets.bottom + BottomTabInset + Spacing.three,
    android: insets.bottom + BottomTabInset + Spacing.three,
    default: Spacing.four,
  });

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: Math.max(insets.top, 24), paddingBottom: paddingBottomStyle }
      ]}>
      <View style={styles.mainWrapper}>
        
        {/* Header Section */}
        <View style={styles.headerRow}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.brandTitle, { color: theme.primary }]}>NEXUS CRM</Text>
              <Pressable
                onPress={() => {
                  const performLogout = () => {
                    logout();
                  };
                  if (Platform.OS === 'web') {
                    if (confirm('Are you sure you want to log out?')) {
                      performLogout();
                    }
                  } else {
                    Alert.alert(
                      'Logout Confirmation',
                      'Are you sure you want to log out of Nexus CRM?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Logout', style: 'destructive', onPress: performLogout }
                      ]
                    );
                  }
                }}
                style={({ pressed }) => [styles.logoutHeaderBtn, pressed && { opacity: 0.7 }]}
              >
                <Text style={[styles.logoutHeaderText, { color: theme.statusLost }]}>[LOGOUT]</Text>
              </Pressable>
            </View>
            <Text style={[styles.greetingText, { color: theme.text }]}>Command Dashboard</Text>
          </View>
          <Pressable
            onPress={() => {
              console.log('[DEBUG] Navigating to /lead/add from Dashboard');
              router.push({ pathname: '/lead/add' });
            }}
            style={({ pressed }) => [
              styles.addButton,
              { backgroundColor: theme.primary },
              pressed && styles.buttonPressed
            ]}>
            <Text style={styles.addButtonText}>+ ADD LEAD</Text>
          </Pressable>
        </View>

        {/* AI Co-Pilot Recommendation Center */}
        <View style={styles.copilotSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.copilotTitleWrapper}>
              <View style={styles.pulseDot} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>AI Sales Co-Pilot</Text>
            </View>
            <Text style={[styles.copilotBadge, { backgroundColor: theme.primary + '15', color: theme.primary }]}>
              {copilotRecommendations.length} ACTIONS
            </Text>
          </View>
          
          {copilotRecommendations.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.copilotScrollContent}
              style={styles.copilotScrollView}
            >
              {copilotRecommendations.map(rec => (
                <GlassCard key={rec.id} style={styles.copilotCard} gradient>
                  <View style={styles.copilotCardHeader}>
                    <Text style={[styles.copilotTypeTag, { 
                      color: rec.type === 'overdue' ? theme.statusLost : rec.type === 'no_followup' ? theme.statusNew : theme.statusContacted,
                      backgroundColor: (rec.type === 'overdue' ? theme.statusLost : rec.type === 'no_followup' ? theme.statusNew : theme.statusContacted) + '15'
                    }]}>
                      {rec.type === 'overdue' ? '⚠️ OVERDUE' : rec.type === 'no_followup' ? '📅 PIPELINE WARM' : '⚡ STALE DEAL'}
                    </Text>
                  </View>
                  <Text style={[styles.copilotCardTitle, { color: theme.text }]} numberOfLines={1}>
                    {rec.title}
                  </Text>
                  <Text style={[styles.copilotCardDesc, { color: theme.textSecondary }]} numberOfLines={2}>
                    {rec.description}
                  </Text>
                  <Pressable
                    onPress={rec.onAction}
                    style={({ pressed }) => [
                      styles.copilotActionBtn,
                      { backgroundColor: theme.primary },
                      pressed && styles.buttonPressed
                    ]}
                  >
                    <Text style={styles.copilotActionText}>{rec.actionText}</Text>
                  </Pressable>
                </GlassCard>
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderStyle: 'dashed', paddingVertical: 18 }]}>
              <Text style={[styles.emptyText, { color: theme.textSecondary, fontSize: 12 }]}>
                🤖 All quiet. The pipeline is fully updated and optimized!
              </Text>
            </View>
          )}
        </View>

        {/* Dynamic Metric Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricsRow}>
            <MetricCard
              label="Closed Won Sales"
              value={`$${metrics.totalRevenue.toLocaleString()}`}
              subText="Revenue realized"
              type="success"
            />
            <MetricCard
              label="Pipeline Deals"
              value={`$${metrics.activeDealsValue.toLocaleString()}`}
              subText="Active negotiations"
              type="primary"
            />
          </View>
          <View style={styles.metricsRow}>
            <MetricCard
              label="Conversion Win Rate"
              value={`${metrics.winRate}%`}
              subText="Closed won ratio"
              type="warning"
            />
            <MetricCard
              label="Active Accounts"
              value={metrics.activeLeadsCount}
              subText="Ongoing clients"
              type="info"
            />
          </View>
        </View>

        {/* Dynamic Visual SVG Charts */}
        <View style={[styles.cardWrapper, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <CRMChart leads={leads} />
        </View>

        {/* Pipeline Follow-Up Radar */}
        <View style={styles.leadsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Pipeline Follow-Up Radar</Text>
            <Text style={[styles.sectionSub, { color: theme.textSecondary }]}>High priority accounts requiring immediate contact</Text>
          </View>

          {followUpRadarLeads.length > 0 ? (
            followUpRadarLeads.map(lead => {
              const isOverdue = lead.nextFollowUp! < todayStr;
              const dateColor = isOverdue ? theme.statusLost : theme.statusProposal;
              const statusLabel = isOverdue ? '⚠️ Overdue' : '📅 Due Today';

              const handleQuickFollowUp = (method: 'call' | 'email' | 'check') => {
                const nextDate = new Date();
                nextDate.setDate(nextDate.getDate() + 7);
                const nextDateStr = nextDate.toISOString().split('T')[0];

                let title = 'Direct Contact Logged';
                let description = '';
                let type: 'call' | 'email' | 'note' = 'note';

                if (method === 'call') {
                  title = 'Follow-up Call Completed';
                  description = 'Outbound call executed via radar. Connection established.';
                  type = 'call';
                  Linking.openURL(`tel:${lead.phone}`).catch(err => {
                    console.log('Unable to open native dialer:', err);
                  });
                } else if (method === 'email') {
                  title = 'Follow-up Email Dispatched';
                  description = 'Relationship email dispatched via radar. Tracking enabled.';
                  type = 'email';
                  Linking.openURL(`mailto:${lead.email}`).catch(err => {
                    console.log('Unable to open native email client:', err);
                  });
                } else {
                  title = 'Standard Check-in Completed';
                  description = 'Standard client check-in registered via Pipeline Radar.';
                }

                // Update next follow-up and append timeline log
                updateLead(lead.id, {
                  nextFollowUp: nextDateStr,
                });
                addTimelineNote(lead.id, title, description, type);

                if (Platform.OS === 'web') {
                  alert(`Successfully followed up with ${lead.name}! Next follow-up scheduled for ${nextDateStr}.`);
                } else {
                  Alert.alert(
                    'Follow-up Logged',
                    `Client contact recorded. Next follow-up is scheduled for ${nextDateStr}.`,
                    [{ text: 'OK' }]
                  );
                }
              };

              return (
                <View key={`radar-${lead.id}`} style={[styles.radarCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                  <View style={styles.radarInfoRow}>
                    <View style={[styles.radarAvatar, { backgroundColor: dateColor + '18', borderColor: dateColor }]}>
                      <Text style={[styles.radarAvatarText, { color: dateColor }]}>
                        {lead.name.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.radarName, { color: theme.text }]}>{lead.name}</Text>
                      <Text style={[styles.radarCompany, { color: theme.textSecondary }]}>{lead.company}</Text>
                      <Text style={[styles.radarAlertText, { color: dateColor }]}>
                        {statusLabel}: {lead.nextFollowUp}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                      <Text style={[styles.radarValue, { color: theme.text }]}>${lead.value.toLocaleString()}</Text>
                    </View>
                  </View>

                  {/* Actions Row */}
                  <View style={[styles.radarActionsBar, { borderTopColor: theme.border + '15' }]}>
                    <Pressable
                      onPress={() => handleQuickFollowUp('call')}
                      style={({ pressed }) => [styles.radarActionBtn, { borderColor: theme.statusNew }, pressed && { opacity: 0.7 }]}>
                      <Text style={[styles.radarActionText, { color: theme.statusNew }]}>☏ Call</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleQuickFollowUp('email')}
                      style={({ pressed }) => [styles.radarActionBtn, { borderColor: theme.statusProposal }, pressed && { opacity: 0.7 }]}>
                      <Text style={[styles.radarActionText, { color: theme.statusProposal }]}>✉ Email</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleQuickFollowUp('check')}
                      style={({ pressed }) => [styles.radarCtaBtn, { backgroundColor: theme.primary }, pressed && { opacity: 0.8 }]}>
                      <Text style={styles.radarCtaText}>✓ Done</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border, paddingVertical: 18, borderStyle: 'dashed' }]}>
              <Text style={[styles.emptyText, { color: theme.textSecondary, fontSize: 11 }]}>
                ✨ Perfect! No active accounts require immediate follow-up.
              </Text>
            </View>
          )}
        </View>

        {/* High Value Pipeline Panel */}
        <View style={styles.leadsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>VVIP Deal Room</Text>
            <Text style={[styles.sectionSub, { color: theme.textSecondary }]}>Active accounts &gt; $50K</Text>
          </View>

          {highValueDeals.length > 0 ? (
            highValueDeals.map(lead => (
              <LeadCard key={lead.id} lead={lead} />
            ))
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No high-value active prospects. Use &quot;+ ADD LEAD&quot; to populate your pipeline.
              </Text>
            </View>
          )}
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  mainWrapper: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  brandTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: -0.4,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  addButtonText: {
    color: '#07090E',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.8,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  metricsGrid: {
    marginVertical: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardWrapper: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  leadsSection: {
    marginVertical: 10,
  },
  sectionHeader: {
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionSub: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  radarCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  radarInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  radarAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radarAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  radarName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  radarCompany: {
    fontSize: 11,
    marginTop: 1,
  },
  radarAlertText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 3,
    textTransform: 'uppercase',
  },
  radarValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  radarActionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 8,
  },
  radarActionBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flex: 1,
    alignItems: 'center',
  },
  radarActionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  radarCtaBtn: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flex: 1.2,
    alignItems: 'center',
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  radarCtaText: {
    color: '#07090E',
    fontSize: 11,
    fontWeight: '900',
  },
  copilotSection: {
    marginVertical: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  copilotTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  copilotBadge: {
    fontSize: 9,
    fontWeight: '900',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    letterSpacing: 0.5,
  },
  copilotScrollView: {
    marginHorizontal: -Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  copilotScrollContent: {
    gap: 12,
    paddingRight: 32,
    paddingBottom: 8,
    flexDirection: 'row',
  },
  copilotCard: {
    width: 260,
    marginVertical: 4,
    padding: 12,
    borderRadius: 14,
  },
  copilotCardHeader: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  copilotTypeTag: {
    fontSize: 8,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    letterSpacing: 0.5,
  },
  copilotCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  copilotCardDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 10,
    height: 30,
  },
  copilotActionBtn: {
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  copilotActionText: {
    color: '#07090E',
    fontSize: 11,
    fontWeight: '900',
  },
  logoutHeaderBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  logoutHeaderText: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
