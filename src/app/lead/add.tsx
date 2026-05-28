import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, useColorScheme, Platform, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useCRM } from '@/context/CRMContext';
import { Colors, Spacing, MaxContentWidth } from '@/constants/theme';
import GlassCard from '@/components/GlassCard';

// Helper to get formatted date +N days from now
const getFutureDateString = (daysAhead: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
};

export default function AddLeadScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'light' ? 'light' : 'dark'];
  const insets = useSafeAreaInsets();
  
  const { addLead } = useCRM();

  // Wizard fields states
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'New' | 'Contacted' | 'Proposal' | 'Won' | 'Lost'>('New');
  const [value, setValue] = useState('');
  const [source, setSource] = useState('Website');
  const [notes, setNotes] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState(getFutureDateString(7));

  const sources = ['Website', 'LinkedIn', 'Referral', 'Cold Call', 'Event'];

  const getStatusColor = (st: string) => {
    switch (st) {
      case 'New': return theme.statusNew;
      case 'Contacted': return theme.statusContacted;
      case 'Proposal': return theme.statusProposal;
      case 'Won': return theme.statusWon;
      case 'Lost': return theme.statusLost;
      default: return theme.primary;
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      if (Platform.OS === 'web') {
        alert('Contact Name is required.');
      } else {
        Alert.alert('Validation Error', 'Contact Name is a required field.', [{ text: 'OK' }]);
      }
      return;
    }

    const numericValue = parseFloat(value) || 0;

    const newLead = addLead({
      name: name.trim(),
      company: company.trim() || 'Independent / Freelancer',
      email: email.trim() || 'no-email@company.com',
      phone: phone.trim() || 'No active voice line',
      status,
      value: numericValue,
      source,
      notes: notes.trim(),
      nextFollowUp: nextFollowUp.trim() || undefined,
    });

    // Notify & Back
    if (Platform.OS === 'web') {
      alert(`Lead ${newLead.name} successfully added!`);
      router.back();
    } else {
      Alert.alert(
        'Success', 
        `Lead "${newLead.name}" has been successfully added.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
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
          <Text style={[styles.backText, { color: theme.primary }]}>← CANCEL</Text>
        </Pressable>

        <Text style={[styles.pageTitle, { color: theme.text }]}>Add New Lead</Text>
        <Text style={[styles.pageSub, { color: theme.textSecondary }]}>Initialize contact records and define pipeline parameters.</Text>

        <GlassCard style={styles.formCard} gradient>
          
          {/* Section 1: Contact Identity */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>1. Contact Identity</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Contact Name *</Text>
            <TextInput
              placeholder="e.g. Clark Kent"
              placeholderTextColor={theme.textSecondary}
              value={name}
              onChangeText={setName}
              style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Company Name</Text>
            <TextInput
              placeholder="e.g. Daily Planet"
              placeholderTextColor={theme.textSecondary}
              value={company}
              onChangeText={setCompany}
              style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
            />
          </View>

          {/* Section 2: Contact Vectors */}
          <View style={[styles.sectionHeader, { marginTop: 12 }]}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>2. Communication Vectors</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Email Address</Text>
            <TextInput
              placeholder="e.g. clark@dailyplanet.com"
              placeholderTextColor={theme.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Phone Number</Text>
            <TextInput
              placeholder="e.g. +1 (555) 700-1938"
              placeholderTextColor={theme.textSecondary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
            />
          </View>

          {/* Section 3: Commercial Parameters */}
          <View style={[styles.sectionHeader, { marginTop: 12 }]}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>3. Commercial Parameters</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Pipeline Deal Value ($)</Text>
            <TextInput
              placeholder="e.g. 50000"
              placeholderTextColor={theme.textSecondary}
              value={value}
              onChangeText={setValue}
              keyboardType="numeric"
              style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Next Follow-Up Date (YYYY-MM-DD)</Text>
            <TextInput
              placeholder="e.g. 2026-06-04"
              placeholderTextColor={theme.textSecondary}
              value={nextFollowUp}
              onChangeText={setNextFollowUp}
              style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
            />
          </View>

          {/* Status Selection */}
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Initial Deal Stage</Text>
            <View style={styles.stageChipsRow}>
              {(['New', 'Contacted', 'Proposal', 'Won'] as const).map(stage => {
                const isActive = status === stage;
                const stageColor = getStatusColor(stage);
                return (
                  <Pressable
                    key={stage}
                    onPress={() => setStatus(stage)}
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
          </View>

          {/* Lead Source */}
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Acquisition Source</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.sourcesRow}>
                {sources.map(src => {
                  const isActive = source === src;
                  return (
                    <Pressable
                      key={src}
                      onPress={() => setSource(src)}
                      style={[
                        styles.sourceChip,
                        {
                          backgroundColor: isActive ? theme.backgroundSelected : theme.backgroundElement,
                          borderColor: isActive ? theme.primary : theme.border,
                        }
                      ]}>
                      <Text style={[styles.sourceChipText, { color: isActive ? theme.text : theme.textSecondary }]}>
                        {src}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Context Notes */}
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Strategic Context Notes</Text>
            <TextInput
              placeholder="Log critical deal backgrounds, client preferences, next targets..."
              placeholderTextColor={theme.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border, height: 90, textAlignVertical: 'top' }]}
            />
          </View>

          {/* CTA Create Button */}
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.ctaButton,
              { backgroundColor: theme.primary },
              pressed && { opacity: 0.85 }
            ]}>
            <Text style={styles.ctaButtonText}>CREATE LEAD</Text>
          </Pressable>

        </GlassCard>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  pageSub: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  formCard: {
    padding: 18,
    marginBottom: 20,
  },
  sectionHeader: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  formGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 7,
    fontSize: 12.5,
    fontWeight: '600',
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
  sourcesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sourceChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  sourceChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  ctaButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  ctaButtonText: {
    color: '#07090E',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
  },
});
