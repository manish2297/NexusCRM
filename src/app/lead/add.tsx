import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  useColorScheme,
  Platform,
  TextInput,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useCRM } from '@/context/CRMContext';
import { Colors, Spacing, MaxContentWidth } from '@/constants/theme';
import GlassCard from '@/components/GlassCard';
import { ContactService, DeviceContactItem } from '@/services/ContactService';

const PRESET_TAGS = ['Enterprise', 'VIP', 'High Intent', 'In Review', 'Fast-Track', 'Security', 'Tech', 'Public Sector'];

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
  const [selectedTags, setSelectedTags] = useState<string[]>(['Enterprise']);
  const [customTagInput, setCustomTagInput] = useState('');

  // Device Contact Importer states
  const [showContactModal, setShowContactModal] = useState(false);
  const [deviceContacts, setDeviceContacts] = useState<DeviceContactItem[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

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

  const handleOpenContactImporter = async () => {
    setIsLoadingContacts(true);
    setShowContactModal(true);
    const result = await ContactService.getDeviceContacts();
    setIsLoadingContacts(false);

    if (result.success) {
      setDeviceContacts(result.contacts);
    } else {
      if (Platform.OS === 'web') {
        alert(result.error || 'Contacts not accessible on web.');
      } else {
        Alert.alert('Contacts Notice', result.error || 'Unable to retrieve phone contacts.');
      }
    }
  };

  const handleSelectContact = (contact: DeviceContactItem) => {
    if (contact.name) setName(contact.name);
    if (contact.company) setCompany(contact.company);
    if (contact.email) setEmail(contact.email);
    if (contact.phone) setPhone(contact.phone);
    setShowContactModal(false);
  };

  const handleToggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags(prev => [...prev, trimmed]);
      setCustomTagInput('');
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
      tags: selectedTags,
    });

    if (Platform.OS === 'web') {
      alert(`Lead ${newLead.name} successfully added!`);
      router.back();
    } else {
      Alert.alert(
        'Success',
        `Lead "${newLead.name}" has been successfully added to your pipeline.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  };

  const filteredContacts = deviceContacts.filter(c =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    (c.company && c.company.toLowerCase().includes(contactSearch.toLowerCase()))
  );

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: Math.max(insets.top, 24), paddingBottom: insets.bottom + Spacing.six },
      ]}>
      <View style={styles.mainWrapper}>
        {/* Navigation back bar */}
        <Pressable onPress={() => router.back()} style={styles.backRow}>
          <Text style={[styles.backText, { color: theme.primary }]}>← CANCEL</Text>
        </Pressable>

        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.pageTitle, { color: theme.text }]}>Add New Lead</Text>
            <Text style={[styles.pageSub, { color: theme.textSecondary }]}>
              Initialize contact records and define pipeline parameters.
            </Text>
          </View>

          {/* Quick Import Button */}
          <Pressable
            onPress={handleOpenContactImporter}
            style={({ pressed }) => [
              styles.importBtn,
              { borderColor: theme.primary, backgroundColor: theme.backgroundElement },
              pressed && { opacity: 0.8 },
            ]}>
            <Text style={[styles.importBtnText, { color: theme.primary }]}>
              👥 IMPORT CONTACT
            </Text>
          </Pressable>
        </View>

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
              style={[
                styles.input,
                { color: theme.text, backgroundColor: theme.background, borderColor: theme.border },
              ]}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Company Name</Text>
            <TextInput
              placeholder="e.g. Daily Planet"
              placeholderTextColor={theme.textSecondary}
              value={company}
              onChangeText={setCompany}
              style={[
                styles.input,
                { color: theme.text, backgroundColor: theme.background, borderColor: theme.border },
              ]}
            />
          </View>

          {/* Section 2: Contact Vectors */}
          <View style={[styles.sectionHeader, { marginTop: 12 }]}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>
              2. Communication Vectors
            </Text>
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
              style={[
                styles.input,
                { color: theme.text, backgroundColor: theme.background, borderColor: theme.border },
              ]}
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
              style={[
                styles.input,
                { color: theme.text, backgroundColor: theme.background, borderColor: theme.border },
              ]}
            />
          </View>

          {/* Section 3: Commercial Parameters */}
          <View style={[styles.sectionHeader, { marginTop: 12 }]}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>
              3. Commercial Parameters
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Pipeline Deal Value ($)
            </Text>
            <TextInput
              placeholder="e.g. 50000"
              placeholderTextColor={theme.textSecondary}
              value={value}
              onChangeText={setValue}
              keyboardType="numeric"
              style={[
                styles.input,
                { color: theme.text, backgroundColor: theme.background, borderColor: theme.border },
              ]}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Next Follow-Up Date (YYYY-MM-DD)
            </Text>
            <TextInput
              placeholder="e.g. 2026-06-04"
              placeholderTextColor={theme.textSecondary}
              value={nextFollowUp}
              onChangeText={setNextFollowUp}
              style={[
                styles.input,
                { color: theme.text, backgroundColor: theme.background, borderColor: theme.border },
              ]}
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
                      },
                    ]}>
                    <Text
                      style={[
                        styles.stageChipText,
                        {
                          color: isActive ? stageColor : theme.textSecondary,
                          fontWeight: isActive ? '800' : '600',
                        },
                      ]}>
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
                        },
                      ]}>
                      <Text
                        style={[
                          styles.sourceChipText,
                          { color: isActive ? theme.text : theme.textSecondary },
                        ]}>
                        {src}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Section 4: Tags & Classification */}
          <View style={[styles.sectionHeader, { marginTop: 12 }]}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>
              4. Classification & Priority Tags
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Select Tags</Text>
            <View style={styles.tagsContainer}>
              {PRESET_TAGS.map(tag => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <Pressable
                    key={tag}
                    onPress={() => handleToggleTag(tag)}
                    style={[
                      styles.tagChip,
                      {
                        backgroundColor: isSelected ? theme.primary + '20' : theme.backgroundElement,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.tagChipText,
                        { color: isSelected ? theme.primary : theme.textSecondary },
                      ]}>
                      {isSelected ? `✓ ${tag}` : `+ ${tag}`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Custom Tag Input */}
            <View style={styles.customTagRow}>
              <TextInput
                placeholder="Add custom tag (e.g. Q3 Fast Track)"
                placeholderTextColor={theme.textSecondary}
                value={customTagInput}
                onChangeText={setCustomTagInput}
                style={[
                  styles.customTagInput,
                  { color: theme.text, backgroundColor: theme.background, borderColor: theme.border },
                ]}
              />
              <Pressable
                onPress={handleAddCustomTag}
                style={[styles.addTagBtn, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}>
                <Text style={[styles.addTagBtnText, { color: theme.primary }]}>ADD</Text>
              </Pressable>
            </View>
          </View>

          {/* Context Notes */}
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Strategic Context Notes
            </Text>
            <TextInput
              placeholder="Log critical deal backgrounds, client preferences, next targets..."
              placeholderTextColor={theme.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              style={[
                styles.input,
                {
                  color: theme.text,
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                  height: 90,
                  textAlignVertical: 'top',
                },
              ]}
            />
          </View>

          {/* CTA Create Button */}
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.ctaButton,
              { backgroundColor: theme.primary },
              pressed && { opacity: 0.85 },
            ]}>
            <Text style={styles.ctaButtonText}>CREATE LEAD</Text>
          </Pressable>
        </GlassCard>
      </View>

      {/* Contact Importer Modal */}
      <Modal visible={showContactModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: theme.background,
                borderColor: theme.border,
                paddingBottom: insets.bottom + 16,
              },
            ]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Device Contacts</Text>
                <Text style={[styles.modalSub, { color: theme.textSecondary }]}>
                  Select a contact to auto-fill identity & communication details.
                </Text>
              </View>
              <Pressable onPress={() => setShowContactModal(false)} style={styles.closeBtn}>
                <Text style={[styles.closeBtnText, { color: theme.textSecondary }]}>✕</Text>
              </Pressable>
            </View>

            <TextInput
              placeholder="Search phone contacts..."
              placeholderTextColor={theme.textSecondary}
              value={contactSearch}
              onChangeText={setContactSearch}
              style={[
                styles.modalSearchInput,
                { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}
            />

            {isLoadingContacts ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={theme.primary} size="large" />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                  Accessing address book...
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredContacts}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => handleSelectContact(item)}
                    style={({ pressed }) => [
                      styles.contactItem,
                      { borderColor: theme.border, backgroundColor: theme.backgroundElement },
                      pressed && { opacity: 0.7 },
                    ]}>
                    <View style={[styles.contactAvatar, { backgroundColor: theme.primary + '20' }]}>
                      <Text style={[styles.contactAvatarText, { color: theme.primary }]}>
                        {item.name ? item.name[0].toUpperCase() : '?'}
                      </Text>
                    </View>
                    <View style={styles.contactDetails}>
                      <Text style={[styles.contactName, { color: theme.text }]}>{item.name}</Text>
                      {item.company ? (
                        <Text style={[styles.contactCompany, { color: theme.primary }]}>
                          {item.company}
                        </Text>
                      ) : null}
                      {item.email ? (
                        <Text style={[styles.contactSub, { color: theme.textSecondary }]}>
                          ✉ {item.email}
                        </Text>
                      ) : null}
                      {item.phone ? (
                        <Text style={[styles.contactSub, { color: theme.textSecondary }]}>
                          ☏ {item.phone}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={[styles.contactSelectBadge, { color: theme.primary }]}>USE ➔</Text>
                  </Pressable>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                      No contacts found matching search query.
                    </Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  pageSub: {
    fontSize: 12,
    marginTop: 4,
  },
  importBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  importBtnText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
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
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 13,
    fontWeight: '600',
  },
  stageChipsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  stageChipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  stageChipText: {
    fontSize: 11,
  },
  sourcesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sourceChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  sourceChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  tagChipText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  customTagRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  customTagInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 11.5,
  },
  addTagBtn: {
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTagBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  ctaButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  ctaButtonText: {
    color: '#07090E',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalSearchInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: 12,
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactAvatarText: {
    fontSize: 16,
    fontWeight: '800',
  },
  contactDetails: {
    flex: 1,
    gap: 2,
  },
  contactName: {
    fontSize: 13,
    fontWeight: '700',
  },
  contactCompany: {
    fontSize: 11,
    fontWeight: '600',
  },
  contactSub: {
    fontSize: 10,
  },
  contactSelectBadge: {
    fontSize: 10,
    fontWeight: '800',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
  },
});
