import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, useColorScheme, Platform, TextInput, Alert, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useCRM } from '@/context/CRMContext';
import { Colors, Spacing, BottomTabInset, MaxContentWidth } from '@/constants/theme';
import GlassCard from '@/components/GlassCard';

// Outreach templates dictionary based on deal status
const salesScripts: Record<string, Array<{ title: string; body: string }>> = {
  New: [
    {
      title: 'Cold Call Hook',
      body: `Hi, this is [Name] calling. I noticed your team is scaling operations. We help companies increase close rates by 25% with automated workflows. Do you have 3 minutes to see if we're a fit?`,
    },
    {
      title: 'Intro Email Pitch',
      body: `Subject: Enhancing operations...\n\nHi,\n\nI was reviewing your company's profile. We help firms deploy secure, real-time analytics platforms with zero downtime.\n\nCould we set up a quick 10-minute call next Tuesday at 10 AM?\n\nBest,\n[Your Name]`,
    }
  ],
  Contacted: [
    {
      title: 'Discovery Follow-up',
      body: `Hi, great speaking with you earlier. Just to recap: your primary challenges are security scaling and integration overhead. I suggest a customized demo this week.`,
    },
    {
      title: 'Value Proposition Pitch',
      body: `Hi, I wanted to share a case study where we helped Wayne Enterprises cut database latency by 42% in under 3 weeks. Let me know when you're free for a short demo.`,
    }
  ],
  Proposal: [
    {
      title: 'Closing Proposal Pitch',
      body: `Hi, I hope you had a chance to review the contract proposal we sent over. Our platform pays for itself within the first 60 days by saving 18+ engineer hours per week. I'd love to help you lock in our Q2 promotional pricing today.`,
    },
    {
      title: 'Objection Handling: Pricing',
      body: `I completely understand that this is a significant investment. However, we are covering custom database integration and 24/7 security auditing which would otherwise require a full-time hire costing double. Let's start with a phased launch?`,
    }
  ],
  Won: [
    {
      title: 'Onboarding Greeting',
      body: `Hi, welcome to the family! We've set up your company base portal. Our customer success manager will reach out within 24 hours to schedule your team kickoff.`,
    },
    {
      title: 'Referral Request',
      body: `Hi, now that your team is up and running on the platform, I'd love to check if there are other operational leads in your network who could benefit from similar database optimization?`,
    }
  ],
  Lost: [
    {
      title: 'Lost Deal Graceful Exit',
      body: `Thank you for your time throughout this process. While the timing isn't right today, I'd love to keep in touch and check back next quarter as your team expands.`,
    }
  ]
};

export default function LeadDetailsScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'light' ? 'light' : 'dark'];
  const insets = useSafeAreaInsets();
  
  const { id } = useLocalSearchParams<{ id: string }>();
  const { leads, updateLead, deleteLead, addTimelineNote } = useCRM();

  const lead = leads.find(l => l.id === id);

  // Note creation states
  const [noteTitle, setNoteTitle] = useState('');
  const [noteDesc, setNoteDesc] = useState('');
  const [noteType, setNoteType] = useState<'call' | 'email' | 'meeting' | 'note'>('note');

  // Touchpoint logger overlay state
  const [activeAction, setActiveAction] = useState<'call' | 'email' | 'sms' | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState('');
  const [outcomeNotes, setOutcomeNotes] = useState('');

  // Script helper states
  const [showPitchHelper, setShowPitchHelper] = useState(false);

  if (!lead) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[styles.errorText, { color: theme.text }]}>Lead record not found.</Text>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={{ color: theme.primary, fontWeight: 'bold' }}>RETURN BACK</Text>
        </Pressable>
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return theme.statusNew;
      case 'Contacted': return theme.statusContacted;
      case 'Proposal': return theme.statusProposal;
      case 'Won': return theme.statusWon;
      case 'Lost': return theme.statusLost;
      default: return theme.primary;
    }
  };

  const getTimelineIconColor = (type: string) => {
    switch (type) {
      case 'call': return theme.statusNew;
      case 'email': return theme.statusProposal;
      case 'meeting': return theme.statusContacted;
      case 'status_change': return theme.secondary;
      default: return theme.textSecondary;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Activity Actions (open native communications & logger)
  const handleCall = () => {
    Linking.openURL(`tel:${lead.phone}`).catch(err => {
      console.log('Unable to open native dialer (e.g. simulator without dialer):', err);
    });
    setActiveAction('call');
    setSelectedOutcome('');
    setOutcomeNotes('');
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${lead.email}`).catch(err => {
      console.log('Unable to open native email client:', err);
    });
    setActiveAction('email');
    setSelectedOutcome('');
    setOutcomeNotes('');
  };

  const handleSMS = () => {
    Linking.openURL(`sms:${lead.phone}`).catch(err => {
      console.log('Unable to open native SMS client:', err);
    });
    setActiveAction('sms');
    setSelectedOutcome('');
    setOutcomeNotes('');
  };

  const handleDelete = () => {
    const performDelete = () => {
      deleteLead(lead.id);
      router.back();
    };

    if (Platform.OS === 'web') {
      if (confirm(`Are you sure you want to permanently delete lead ${lead.name}?`)) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Confirm Deletion',
        `Are you absolutely sure you want to permanently delete lead "${lead.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete Permanent', style: 'destructive', onPress: performDelete }
        ]
      );
    }
  };

  const handleStatusChange = (newStatus: typeof lead.status) => {
    updateLead(lead.id, { status: newStatus });
  };

  const handleAddCustomNote = () => {
    if (!noteTitle.trim() || !noteDesc.trim()) return;
    addTimelineNote(lead.id, noteTitle.trim(), noteDesc.trim(), noteType);
    setNoteTitle('');
    setNoteDesc('');
    setNoteType('note');
  };

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: Math.max(insets.top, 24), paddingBottom: insets.bottom + Spacing.six }
      ]}>
      <View style={styles.mainWrapper}>
        
        {/* Navigation back bar */}
        <Pressable onPress={() => router.back()} style={styles.backRow}>
          <Text style={[styles.backText, { color: theme.primary }]}>← BACK TO DIRECTORY</Text>
        </Pressable>

        {/* 1. Header Profile Box */}
        <GlassCard style={styles.profileCard} gradient>
          <View style={styles.profileHeader}>
            <View style={[styles.avatar, { backgroundColor: getStatusColor(lead.status) + '15', borderColor: getStatusColor(lead.status) }]}>
              <Text style={[styles.avatarText, { color: getStatusColor(lead.status) }]}>
                {getInitials(lead.name)}
              </Text>
            </View>
            <View style={styles.profileText}>
              <Text style={[styles.nameText, { color: theme.text }]}>{lead.name}</Text>
              <Text style={[styles.companyText, { color: theme.textSecondary }]}>{lead.company}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(lead.status) + '15', borderColor: getStatusColor(lead.status) }]}>
                <Text style={[styles.statusBadgeText, { color: getStatusColor(lead.status) }]}>{lead.status}</Text>
              </View>
            </View>
            <Pressable
              onPress={() => router.push({ pathname: '/lead/edit/[id]', params: { id: lead.id } })}
              style={({ pressed }) => [
                styles.editButton,
                { borderColor: theme.primary },
                pressed && { opacity: 0.7 }
              ]}>
              <Text style={[styles.editButtonText, { color: theme.primary }]}>EDIT</Text>
            </Pressable>
          </View>

          {/* Premium Quick Action Dial Bar */}
          <View style={[styles.actionRow, { borderTopColor: theme.border }]}>
            <Pressable onPress={handleCall} style={styles.actionItem}>
              <View style={[styles.actionIcon, { backgroundColor: theme.statusNew + '15', borderColor: theme.statusNew }]}>
                <Text style={[styles.actionIconText, { color: theme.statusNew }]}>☏</Text>
              </View>
              <Text style={[styles.actionLabel, { color: theme.textSecondary }]}>CALL</Text>
            </Pressable>

            <Pressable onPress={handleEmail} style={styles.actionItem}>
              <View style={[styles.actionIcon, { backgroundColor: theme.statusProposal + '15', borderColor: theme.statusProposal }]}>
                <Text style={[styles.actionIconText, { color: theme.statusProposal }]}>✉</Text>
              </View>
              <Text style={[styles.actionLabel, { color: theme.textSecondary }]}>EMAIL</Text>
            </Pressable>

            <Pressable onPress={handleSMS} style={styles.actionItem}>
              <View style={[styles.actionIcon, { backgroundColor: theme.statusContacted + '15', borderColor: theme.statusContacted }]}>
                <Text style={[styles.actionIconText, { color: theme.statusContacted }]}>💬</Text>
              </View>
              <Text style={[styles.actionLabel, { color: theme.textSecondary }]}>SMS</Text>
            </Pressable>

            <Pressable onPress={handleDelete} style={styles.actionItem}>
              <View style={[styles.actionIcon, { backgroundColor: theme.statusLost + '15', borderColor: theme.statusLost }]}>
                <Text style={[styles.actionIconText, { color: theme.statusLost }]}>✕</Text>
              </View>
              <Text style={[styles.actionLabel, { color: theme.textSecondary }]}>REMOVE</Text>
            </Pressable>
          </View>
        </GlassCard>

        {/* Touchpoint Outcome Logger Sheet */}
        {activeAction && (
          <GlassCard style={styles.outcomeCard} gradient>
            <View style={styles.outcomeHeader}>
              <Text style={[styles.outcomeTitle, { color: theme.text }]}>
                Log {activeAction.toUpperCase()} Outcome
              </Text>
              <Pressable onPress={() => { setActiveAction(null); setSelectedOutcome(''); setOutcomeNotes(''); }}>
                <Text style={{ color: theme.statusLost, fontWeight: 'bold', fontSize: 11 }}>✕ CANCEL</Text>
              </Pressable>
            </View>

            <Text style={[styles.outcomeSubLabel, { color: theme.textSecondary }]}>Select Outcome Status</Text>
            <View style={styles.outcomeChipsRow}>
              {(activeAction === 'call' 
                ? ['Connected', 'Voicemail', 'No Answer', 'Busy'] 
                : activeAction === 'email' 
                ? ['Delivered', 'Replied', 'Follow-up Sent', 'Bounced'] 
                : ['Sent', 'Delivered', 'Replied']
              ).map(outcome => {
                const isSel = selectedOutcome === outcome;
                return (
                  <Pressable
                    key={outcome}
                    onPress={() => setSelectedOutcome(outcome)}
                    style={[
                      styles.outcomeChip,
                      {
                        backgroundColor: isSel ? theme.backgroundSelected : theme.backgroundElement,
                        borderColor: isSel ? theme.primary : theme.border,
                      }
                    ]}
                  >
                    <Text style={[styles.outcomeChipText, { color: isSel ? theme.text : theme.textSecondary }]}>
                      {outcome}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <TextInput
              placeholder="Add details / notes for this touchpoint..."
              placeholderTextColor={theme.textSecondary}
              value={outcomeNotes}
              onChangeText={setOutcomeNotes}
              style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border, marginTop: 10 }]}
            />

            <Pressable
              onPress={() => {
                if (!selectedOutcome) {
                  Alert.alert('Outcome required', 'Please select an outcome status before saving.');
                  return;
                }
                const formattedTitle = `${activeAction.toUpperCase()}: ${selectedOutcome}`;
                const desc = outcomeNotes.trim() || `Recorded ${activeAction} outreach with outcome: "${selectedOutcome}".`;
                addTimelineNote(lead.id, formattedTitle, desc, activeAction === 'sms' ? 'call' : activeAction);
                
                // Clear state
                setActiveAction(null);
                setSelectedOutcome('');
                setOutcomeNotes('');
                if (Platform.OS === 'web') {
                  alert(`${activeAction.toUpperCase()} touchpoint logged!`);
                } else {
                  Alert.alert('Logged', 'Touchpoint recorded in audit timeline.');
                }
              }}
              style={({ pressed }) => [
                styles.saveNoteBtn,
                { backgroundColor: theme.primary, marginTop: 12 },
                pressed && { opacity: 0.8 }
              ]}
            >
              <Text style={styles.saveNoteBtnText}>SAVE TOUCHPOINT LOG</Text>
            </Pressable>
          </GlassCard>
        )}

        {/* 2. Core Profile Metadata */}
        <View style={styles.gridRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <GlassCard style={styles.metaCard}>
              <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Deal Valuation</Text>
              <Text style={[styles.metaValue, { color: theme.primary }]}>${lead.value.toLocaleString()}</Text>
            </GlassCard>
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <GlassCard style={styles.metaCard}>
              <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Acquisition Source</Text>
              <Text style={[styles.metaValue, { color: theme.text }]}>{lead.source}</Text>
            </GlassCard>
          </View>
        </View>

        <GlassCard style={styles.detailsCard}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Lead Information &amp; Notes</Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Email Address</Text>
            <Text style={[styles.infoVal, { color: theme.text }]}>{lead.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Phone Number</Text>
            <Text style={[styles.infoVal, { color: theme.text }]}>{lead.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Company Base</Text>
            <Text style={[styles.infoVal, { color: theme.text }]}>{lead.company}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Next Follow-Up Date</Text>
            <Text style={[styles.infoVal, { color: lead.nextFollowUp ? theme.primary : theme.textSecondary }]}>
              {lead.nextFollowUp ? lead.nextFollowUp : 'No follow-up scheduled'}
            </Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Strategic Context Notes</Text>
            <Text style={[styles.infoValBody, { color: theme.text }]}>{lead.notes || 'No custom notes provided.'}</Text>
          </View>
        </GlassCard>

        {/* 3. Pipeline Quick Transition Chip Row */}
        <GlassCard style={styles.detailsCard}>
          <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 12 }]}>Modify Pipeline Stage</Text>
          <View style={styles.stageChipsRow}>
            {(['New', 'Contacted', 'Proposal', 'Won', 'Lost'] as const).map(stage => {
              const isActive = lead.status === stage;
              const stageColor = getStatusColor(stage);
              return (
                <Pressable
                  key={stage}
                  onPress={() => handleStatusChange(stage)}
                  style={[
                    styles.stageChipBtn,
                    {
                      backgroundColor: isActive ? stageColor + '18' : theme.backgroundElement,
                      borderColor: isActive ? stageColor : theme.border,
                    }
                  ]}>
                  <Text style={[styles.stageChipText, { color: isActive ? stageColor : theme.textSecondary, fontWeight: isActive ? '800' : '600' }]}>
                    {stage}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </GlassCard>

        {/* 3b. Follow-Up Rescheduling Panel */}
        <GlassCard style={styles.detailsCard}>
          <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 12 }]}>Relationship Follow-Up Target</Text>
          <View style={styles.rescheduleRow}>
            <Pressable
              onPress={() => {
                const d = new Date();
                d.setDate(d.getDate() + 7);
                updateLead(lead.id, { nextFollowUp: d.toISOString().split('T')[0] });
              }}
              style={({ pressed }) => [styles.rescheduleBtn, { borderColor: theme.border }, pressed && { opacity: 0.7 }]}>
              <Text style={[styles.rescheduleText, { color: theme.text }]}>+7 Days</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                const d = new Date();
                d.setDate(d.getDate() + 14);
                updateLead(lead.id, { nextFollowUp: d.toISOString().split('T')[0] });
              }}
              style={({ pressed }) => [styles.rescheduleBtn, { borderColor: theme.border }, pressed && { opacity: 0.7 }]}>
              <Text style={[styles.rescheduleText, { color: theme.text }]}>+14 Days</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                const d = new Date();
                d.setDate(d.getDate() + 30);
                updateLead(lead.id, { nextFollowUp: d.toISOString().split('T')[0] });
              }}
              style={({ pressed }) => [styles.rescheduleBtn, { borderColor: theme.border }, pressed && { opacity: 0.7 }]}>
              <Text style={[styles.rescheduleText, { color: theme.text }]}>+30 Days</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                updateLead(lead.id, { nextFollowUp: undefined });
              }}
              style={({ pressed }) => [styles.rescheduleBtn, { borderColor: theme.statusLost, backgroundColor: theme.statusLost + '11' }, pressed && { opacity: 0.7 }]}>
              <Text style={[styles.rescheduleText, { color: theme.statusLost }]}>Clear Date</Text>
            </Pressable>
          </View>
        </GlassCard>

        {/* AI Outreach Scripts Helper */}
        <GlassCard style={styles.detailsCard}>
          <Pressable onPress={() => setShowPitchHelper(!showPitchHelper)} style={styles.pitchHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>
              🤖 AI Outreach Pitch Helper
            </Text>
            <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 11 }}>
              {showPitchHelper ? 'HIDE' : 'SHOW SCRIPTS'}
            </Text>
          </Pressable>

          {showPitchHelper && (
            <View style={{ marginTop: 12, gap: 10 }}>
              <Text style={{ fontSize: 11, color: theme.textSecondary }}>
                Stage-specific scripts based on stage: <Text style={{ color: theme.primary, fontWeight: 'bold' }}>{lead.status}</Text>
              </Text>
              {salesScripts[lead.status]?.map((script, idx) => (
                <View key={`script-${idx}`} style={[styles.scriptItemCard, { borderColor: theme.border, backgroundColor: theme.background }]}>
                  <Text style={[styles.scriptItemTitle, { color: theme.text }]}>{script.title}</Text>
                  <Text style={[styles.scriptItemBody, { color: theme.textSecondary }]}>{script.body}</Text>
                  
                  <View style={styles.scriptActionsRow}>
                    <Pressable
                      onPress={() => {
                        setNoteTitle(script.title);
                        setNoteDesc(script.body);
                        if (Platform.OS === 'web') {
                          alert('Script copied to the interaction logger below!');
                        } else {
                          Alert.alert('Injected', 'Script copied to the interaction logger below.');
                        }
                      }}
                      style={({ pressed }) => [
                        styles.scriptActionBtn,
                        { borderColor: theme.primary },
                        pressed && { opacity: 0.7 }
                      ]}
                    >
                      <Text style={[styles.scriptActionBtnText, { color: theme.primary }]}>Use Script</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </GlassCard>

        {/* 4. Logger Action Center */}
        <GlassCard style={styles.detailsCard}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Log Client Interaction</Text>
          
          <View style={styles.formGroup}>
            <TextInput
              placeholder="Event Title (e.g. Follow up Demo)"
              placeholderTextColor={theme.textSecondary}
              value={noteTitle}
              onChangeText={setNoteTitle}
              style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
            />
          </View>
          
          <View style={styles.formGroup}>
            <TextInput
              placeholder="Log detailed content description..."
              placeholderTextColor={theme.textSecondary}
              value={noteDesc}
              onChangeText={setNoteDesc}
              multiline
              numberOfLines={3}
              style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border, height: 70, textAlignVertical: 'top' }]}
            />
          </View>

          <View style={styles.interactionTypeRow}>
            {(['call', 'email', 'meeting', 'note'] as const).map(type => {
              const isSel = noteType === type;
              return (
                <Pressable
                  key={type}
                  onPress={() => setNoteType(type)}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: isSel ? theme.backgroundSelected : theme.backgroundElement,
                      borderColor: isSel ? theme.primary : theme.border
                    }
                  ]}>
                  <Text style={[styles.typeChipText, { color: isSel ? theme.text : theme.textSecondary }]}>
                    {type.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={handleAddCustomNote}
            style={({ pressed }) => [
              styles.saveNoteBtn,
              { backgroundColor: theme.primary },
              pressed && { opacity: 0.8 }
            ]}>
            <Text style={styles.saveNoteBtnText}>APPEND RECORD</Text>
          </Pressable>
        </GlassCard>

        {/* 5. Historical Audit Timeline */}
        <View style={styles.timelineSection}>
          <Text style={[styles.timelineSectionTitle, { color: theme.text }]}>Historical Audit Trail</Text>
          
          {lead.timeline.length > 0 ? (
            <View style={styles.timelineContainer}>
              {[...lead.timeline].reverse().map((event, idx) => (
                <View key={event.id} style={styles.timelineItem}>
                  {/* Vertical tracking line */}
                  {idx < lead.timeline.length - 1 && (
                    <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />
                  )}

                  {/* Bullet indicator */}
                  <View style={[styles.timelineBullet, { backgroundColor: getTimelineIconColor(event.type), shadowColor: getTimelineIconColor(event.type) }]} />
                  
                  <View style={styles.timelineContentWrapper}>
                    <GlassCard style={styles.timelineEventCard}>
                      <View style={styles.timelineEventHeader}>
                        <Text style={[styles.timelineEventTitle, { color: theme.text }]}>{event.title}</Text>
                        <Text style={[styles.timelineEventTime, { color: theme.textSecondary }]}>
                          {new Date(event.date).toLocaleDateString()} {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                      <Text style={[styles.timelineEventDesc, { color: theme.textSecondary }]}>{event.description}</Text>
                    </GlassCard>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No interaction timeline events recorded.</Text>
            </View>
          )}
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  mainWrapper: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
  },
  backRow: {
    marginVertical: 12,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  profileCard: {
    padding: 16,
    marginBottom: 12,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileText: {
    flex: 1,
  },
  nameText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  companyText: {
    fontSize: 13,
    marginTop: 2,
    marginBottom: 6,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 0.8,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  editButtonText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  actionItem: {
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionIconText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  actionLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  gridRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  metaCard: {
    marginVertical: 4,
    padding: 12,
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  detailsCard: {
    marginVertical: 6,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  infoRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  infoValBody: {
    fontSize: 12.5,
    fontWeight: '500',
    lineHeight: 18,
  },
  stageChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stageChipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  stageChipText: {
    fontSize: 10,
    textTransform: 'uppercase',
  },
  formGroup: {
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    fontSize: 12,
    fontWeight: '600',
  },
  interactionTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginVertical: 6,
  },
  typeChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  typeChipText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  saveNoteBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveNoteBtnText: {
    color: '#07090E',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  timelineSection: {
    marginTop: 16,
    paddingHorizontal: 4,
  },
  timelineSectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  timelineContainer: {
    paddingLeft: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    position: 'relative',
    paddingBottom: 16,
  },
  timelineLine: {
    position: 'absolute',
    left: 4,
    top: 14,
    bottom: 0,
    width: 2,
  },
  timelineBullet: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
    marginRight: 16,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 3,
  },
  timelineContentWrapper: {
    flex: 1,
  },
  timelineEventCard: {
    marginTop: 0,
    marginBottom: 0,
    padding: 10,
  },
  timelineEventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelineEventTitle: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  timelineEventTime: {
    fontSize: 9,
    fontWeight: '600',
  },
  timelineEventDesc: {
    fontSize: 10,
    lineHeight: 14,
  },
  emptyCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 11,
  },
  rescheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  rescheduleBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.2,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  rescheduleText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  outcomeCard: {
    marginVertical: 12,
    padding: 16,
    borderRadius: 16,
  },
  outcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  outcomeTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  outcomeSubLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  outcomeChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  outcomeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.2,
  },
  outcomeChipText: {
    fontSize: 10,
    fontWeight: '800',
  },
  pitchHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scriptItemCard: {
    borderRadius: 12,
    borderWidth: 1.2,
    padding: 12,
  },
  scriptItemTitle: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scriptItemBody: {
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 8,
  },
  scriptActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  scriptActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  scriptActionBtnText: {
    fontSize: 9.5,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});
