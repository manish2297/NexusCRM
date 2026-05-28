import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TextInput, Pressable, useColorScheme, Platform, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useCRM } from '@/context/CRMContext';
import { Colors, Spacing, BottomTabInset, MaxContentWidth } from '@/constants/theme';
import LeadCard from '@/components/LeadCard';

export default function LeadsScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'light' ? 'light' : 'dark'];
  const insets = useSafeAreaInsets();
  
  const { leads } = useCRM();

  // Search and Filter status states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'New' | 'Contacted' | 'Proposal' | 'Won' | 'Lost'>('All');

  // Filter lists based on selected rules
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesFilter = activeFilter === 'All' || lead.status === activeFilter;
    
    return matchesSearch && matchesFilter;
  });

  const filters: ('All' | 'New' | 'Contacted' | 'Proposal' | 'Won' | 'Lost')[] = [
    'All', 'New', 'Contacted', 'Proposal', 'Won', 'Lost'
  ];

  // Helper to resolve status colors dynamically
  const getFilterColor = (status: string) => {
    switch (status) {
      case 'New': return theme.statusNew;
      case 'Contacted': return theme.statusContacted;
      case 'Proposal': return theme.statusProposal;
      case 'Won': return theme.statusWon;
      case 'Lost': return theme.statusLost;
      default: return theme.primary;
    }
  };

  const paddingBottomStyle = Platform.select({
    ios: insets.bottom + BottomTabInset + Spacing.three,
    android: insets.bottom + BottomTabInset + Spacing.three,
    default: Spacing.four,
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* Search and Filters Header is sticky on top */}
      <View style={[styles.stickyHeader, { paddingTop: Math.max(insets.top, 24), borderBottomColor: theme.border }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>Accounts Directory</Text>
            <Text style={[styles.subText, { color: theme.textSecondary }]}>
              Portfolio total: {leads.length} contacts ({filteredLeads.length} showing)
            </Text>
          </View>
          <Pressable
            onPress={() => {
              console.log('[DEBUG] Navigating to /lead/add from Leads Directory');
              router.push({ pathname: '/lead/add' });
            }}
            style={({ pressed }) => [
              styles.addButton,
              { backgroundColor: theme.primary },
              pressed && styles.buttonPressed
            ]}>
            <Text style={styles.addButtonText}>+</Text>
          </Pressable>
        </View>

        {/* Beautiful glowing Search Box */}
        <View style={[styles.searchWrapper, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <TextInput
            placeholder="Search name, company, email..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: theme.text }]}
          />
        </View>

        {/* Scrolling Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersContent}>
          {filters.map(filter => {
            const isSelected = activeFilter === filter;
            const chipColor = getFilterColor(filter);
            
            return (
              <Pressable
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? chipColor + '20' : theme.backgroundElement,
                    borderColor: isSelected ? chipColor : theme.border,
                  }
                ]}>
                {isSelected && <View style={[styles.chipDot, { backgroundColor: chipColor }]} />}
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: isSelected ? chipColor : theme.textSecondary,
                      fontWeight: isSelected ? '800' : '600',
                    }
                  ]}>
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Main leads directory scroll list */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: paddingBottomStyle }
        ]}>
        <View style={styles.listWrapper}>
          {filteredLeads.length > 0 ? (
            filteredLeads.map(lead => (
              <LeadCard key={lead.id} lead={lead} />
            ))
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No contacts located</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No entries match your search criteria. Try modifying your filters or add a new record.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stickyHeader: {
    paddingHorizontal: Spacing.three,
    paddingBottom: 10,
    borderBottomWidth: 1.5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subText: {
    fontSize: 12,
    marginTop: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: '#07090E',
    fontWeight: '800',
    fontSize: 20,
    lineHeight: 22,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.94 }],
  },
  searchWrapper: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    marginVertical: 8,
  },
  searchInput: {
    fontSize: 13,
    fontWeight: '600',
  },
  filtersScroll: {
    marginTop: 6,
    marginBottom: 4,
  },
  filtersContent: {
    paddingRight: 16,
    gap: 8,
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  chipText: {
    fontSize: 11,
    textTransform: 'uppercase',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 10,
  },
  listWrapper: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
