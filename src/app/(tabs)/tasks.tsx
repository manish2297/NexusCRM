import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, useColorScheme, Platform, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useCRM } from '@/context/CRMContext';
import { Colors, Spacing, BottomTabInset, MaxContentWidth } from '@/constants/theme';
import GlassCard from '@/components/GlassCard';

export default function TasksScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'light' ? 'light' : 'dark'];
  const insets = useSafeAreaInsets();
  
  const { tasks, leads, addTask, toggleTask, deleteTask } = useCRM();

  // Focus category tabs: 'today' | 'overdue' | 'upcoming' | 'completed'
  const [activeTab, setActiveTab] = useState<'today' | 'overdue' | 'upcoming' | 'completed'>('today');

  // Inline Quick Task Creator Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [selectedLeadId, setSelectedLeadId] = useState(leads[0]?.id || '');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);

  const todayStr = new Date().toISOString().split('T')[0];

  const overdueTasks = tasks.filter(t => !t.completed && t.dueDate < todayStr);
  const todayTasks = tasks.filter(t => !t.completed && t.dueDate === todayStr);
  const upcomingTasks = tasks.filter(t => !t.completed && t.dueDate > todayStr);
  const completedTasks = tasks.filter(t => t.completed);

  const overdueCount = overdueTasks.length;
  const todayCount = todayTasks.length;
  const upcomingCount = upcomingTasks.length;
  const completedCount = completedTasks.length;

  const filteredTasks = React.useMemo(() => {
    switch (activeTab) {
      case 'overdue': return overdueTasks;
      case 'today': return todayTasks;
      case 'upcoming': return upcomingTasks;
      case 'completed': return completedTasks;
    }
  }, [activeTab, tasks, todayStr]);

  const completionRate = tasks.length > 0 
    ? Math.round((completedCount / tasks.length) * 100) 
    : 0;

  const handleCreateTask = () => {
    if (!description.trim()) return;
    
    const selectedLead = leads.find(l => l.id === selectedLeadId);
    if (!selectedLead) return;

    addTask({
      leadId: selectedLeadId,
      leadName: selectedLead.name,
      description: description.trim(),
      priority,
      dueDate,
    });

    // Reset Form
    setDescription('');
    setPriority('Medium');
    setShowAddForm(false);
  };

  const getPriorityColor = (lvl: 'High' | 'Medium' | 'Low') => {
    switch (lvl) {
      case 'High': return theme.statusLost;
      case 'Medium': return theme.statusContacted;
      case 'Low': return theme.statusNew;
    }
  };

  const paddingBottomStyle = Platform.select({
    ios: insets.bottom + BottomTabInset + Spacing.three,
    android: insets.bottom + BottomTabInset + Spacing.three,
    default: Spacing.four,
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* Sticky Header */}
      <View style={[styles.stickyHeader, { paddingTop: Math.max(insets.top, 24), borderBottomColor: theme.border }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>Actions &amp; Planner</Text>
            <Text style={[styles.subText, { color: theme.textSecondary }]}>
              {todayCount + overdueCount} focus tasks for today
            </Text>
          </View>
          <Pressable
            onPress={() => setShowAddForm(!showAddForm)}
            style={({ pressed }) => [
              styles.addButton,
              { backgroundColor: theme.primary },
              pressed && styles.buttonPressed
            ]}>
            <Text style={styles.addButtonText}>{showAddForm ? '✕' : '+ PLAN'}</Text>
          </Pressable>
        </View>

        {/* Tab Selection */}
        <View style={[styles.tabsWrapper, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <Pressable
            onPress={() => setActiveTab('overdue')}
            style={[
              styles.tabBtn,
              activeTab === 'overdue' && { backgroundColor: theme.backgroundSelected }
            ]}>
            <Text style={[styles.tabText, { color: activeTab === 'overdue' ? theme.statusLost : theme.textSecondary, fontSize: 10 }]}>
              Overdue ({overdueCount})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('today')}
            style={[
              styles.tabBtn,
              activeTab === 'today' && { backgroundColor: theme.backgroundSelected }
            ]}>
            <Text style={[styles.tabText, { color: activeTab === 'today' ? theme.text : theme.textSecondary, fontSize: 10 }]}>
              Today ({todayCount})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('upcoming')}
            style={[
              styles.tabBtn,
              activeTab === 'upcoming' && { backgroundColor: theme.backgroundSelected }
            ]}>
            <Text style={[styles.tabText, { color: activeTab === 'upcoming' ? theme.text : theme.textSecondary, fontSize: 10 }]}>
              Upcoming ({upcomingCount})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('completed')}
            style={[
              styles.tabBtn,
              activeTab === 'completed' && { backgroundColor: theme.backgroundSelected }
            ]}>
            <Text style={[styles.tabText, { color: activeTab === 'completed' ? theme.text : theme.textSecondary, fontSize: 10 }]}>
              Done ({completedCount})
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Main task scroll list */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: paddingBottomStyle }
        ]}>
        
        <View style={styles.listWrapper}>

          {/* Sales Agent Productivity Progress Card */}
          <GlassCard style={styles.agendaCard} gradient>
            <View style={styles.agendaHeader}>
              <Text style={[styles.agendaTitle, { color: theme.text }]}>Today&apos;s Close Agenda</Text>
              <Text style={[styles.agendaRatio, { color: theme.primary }]}>{completedCount}/{tasks.length} Completed</Text>
            </View>
            <View style={[styles.progressBack, { backgroundColor: theme.border }]}>
              <View style={[styles.progressFront, { backgroundColor: theme.primary, width: `${completionRate}%` }]} />
            </View>
            <Text style={[styles.agendaSub, { color: theme.textSecondary }]}>
              {overdueCount > 0 
                ? `⚠️ Critical outreach delay: ${overdueCount} accounts are overdue. Clear these now!` 
                : todayCount > 0 
                ? `You have ${todayCount} follow-ups scheduled for today. Let's close them!` 
                : `Great job! Your schedule is clear. Let's focus on prospect exploration.`}
            </Text>
          </GlassCard>

          {/* 1. Inline Glassmorphic Task Creator */}
          {showAddForm && (
            <GlassCard style={styles.formCard} gradient>
              <Text style={[styles.formTitle, { color: theme.text }]}>Schedule Operational Task</Text>
              
              <View style={styles.formGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Task Definition</Text>
                <TextInput
                  placeholder="e.g. Deliver customized deployment proposal"
                  placeholderTextColor={theme.textSecondary}
                  value={description}
                  onChangeText={setDescription}
                  style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
                />
              </View>

              <View style={styles.formRow}>
                {/* Associated Lead Selector */}
                <View style={[styles.formGroup, { flex: 1.3, marginRight: 10 }]}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Associated Lead</Text>
                  <View style={[styles.pickerMock, { borderColor: theme.border, backgroundColor: theme.background }]}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        {leads.map(lead => (
                          <Pressable
                            key={lead.id}
                            onPress={() => setSelectedLeadId(lead.id)}
                            style={[
                              styles.pickerOption,
                              {
                                backgroundColor: selectedLeadId === lead.id ? theme.backgroundSelected : 'transparent',
                                borderColor: selectedLeadId === lead.id ? theme.primary : theme.border,
                              }
                            ]}>
                            <Text style={[styles.pickerOptText, { color: selectedLeadId === lead.id ? theme.text : theme.textSecondary }]}>
                              {lead.name}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                </View>

                {/* Priority Toggle Selection */}
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Priority Level</Text>
                  <View style={styles.priorityGroup}>
                    {(['Low', 'Medium', 'High'] as const).map(lvl => (
                      <Pressable
                        key={lvl}
                        onPress={() => setPriority(lvl)}
                        style={[
                          styles.priorityChip,
                          priority === lvl && {
                            backgroundColor: getPriorityColor(lvl) + '22',
                            borderColor: getPriorityColor(lvl)
                          }
                        ]}>
                        <Text style={[styles.priorityChipText, { color: priority === lvl ? getPriorityColor(lvl) : theme.textSecondary }]}>
                          {lvl}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>SLA Due Date (YYYY-MM-DD)</Text>
                <TextInput
                  value={dueDate}
                  onChangeText={setDueDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
                />
              </View>

              <Pressable
                onPress={handleCreateTask}
                style={({ pressed }) => [
                  styles.saveButton,
                  { backgroundColor: theme.primary },
                  pressed && styles.buttonPressed
                ]}>
                <Text style={styles.saveButtonText}>SAVE TASK</Text>
              </Pressable>
            </GlassCard>
          )}

          {/* 2. Tasks List */}
          {filteredTasks.length > 0 ? (
            filteredTasks.map(task => (
              <GlassCard key={task.id} style={styles.taskCard}>
                <View style={styles.taskRow}>
                  
                  {/* Task checkbox selection */}
                  <Pressable
                    onPress={() => toggleTask(task.id)}
                    style={({ pressed }) => [
                      styles.checkbox,
                      { borderColor: task.completed ? theme.statusWon : theme.border },
                      task.completed && { backgroundColor: theme.statusWon + '15' },
                      pressed && { opacity: 0.7 }
                    ]}>
                    {task.completed && <View style={[styles.checkboxInner, { backgroundColor: theme.statusWon }]} />}
                  </Pressable>

                  {/* Task detail description */}
                  <View style={styles.taskTextCol}>
                    <Text style={[
                      styles.taskDesc,
                      { color: theme.text },
                      task.completed && { textDecorationLine: 'line-through', color: theme.textSecondary }
                    ]}>
                      {task.description}
                    </Text>

                    <View style={styles.taskBadgesRow}>
                      {/* Priority indicator */}
                      <View style={[styles.taskPriorityBadge, { backgroundColor: getPriorityColor(task.priority) + '15', borderColor: getPriorityColor(task.priority) + '44' }]}>
                        <Text style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}>
                          {task.priority}
                        </Text>
                      </View>

                      {/* SLA Due date */}
                      <Text style={[styles.dueDateText, { color: theme.textSecondary }]}>
                        Due: {task.dueDate}
                      </Text>

                      {/* Associated Lead Pill - Press to view detail! */}
                      <Pressable
                        onPress={() => router.push({ pathname: '/lead/[id]', params: { id: task.leadId } })}
                        style={({ pressed }) => [
                          styles.leadPill,
                          { backgroundColor: theme.backgroundSelected },
                          pressed && { opacity: 0.7 }
                        ]}>
                        <Text style={[styles.leadPillText, { color: theme.primary }]}>
                          @{task.leadName}
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  {/* Task Actions (e.g. Delete) */}
                  <Pressable
                    onPress={() => deleteTask(task.id)}
                    style={({ pressed }) => [
                      styles.trashIcon,
                      pressed && { opacity: 0.7 }
                    ]}>
                    <Text style={{ color: theme.statusLost, fontSize: 13, fontWeight: 'bold' }}>✕</Text>
                  </Pressable>

                </View>
              </GlassCard>
            ))
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>All set!</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {activeTab === 'completed' 
                  ? 'Completed tasks will be recorded here for historical auditing.'
                  : `No tasks are currently pending in the ${activeTab} agenda.`}
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
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    fontSize: 11,
    letterSpacing: 0.6,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.94 }],
  },
  tabsWrapper: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
    marginVertical: 6,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabText: {
    fontSize: 12,
    fontWeight: 'bold',
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
  formCard: {
    marginBottom: 16,
    padding: 16,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  formGroup: {
    marginBottom: 12,
  },
  formRow: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    fontSize: 12,
    fontWeight: '600',
  },
  pickerMock: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 6,
    height: 42,
    justifyContent: 'center',
  },
  pickerOption: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  pickerOptText: {
    fontSize: 11,
    fontWeight: '600',
  },
  priorityGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  priorityChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  priorityChipText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  saveButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#07090E',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  taskCard: {
    marginVertical: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  taskTextCol: {
    flex: 1,
  },
  taskDesc: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  taskBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 6,
    gap: 8,
  },
  taskPriorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
  },
  priorityText: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  dueDateText: {
    fontSize: 10,
    fontWeight: '600',
  },
  leadPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  leadPillText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  trashIcon: {
    paddingHorizontal: 8,
    paddingVertical: 6,
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
  agendaCard: {
    marginVertical: 10,
    padding: 16,
    borderRadius: 16,
  },
  agendaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  agendaTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  agendaRatio: {
    fontSize: 11,
    fontWeight: '800',
  },
  progressBack: {
    height: 8,
    borderRadius: 4,
    width: '100%',
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFront: {
    height: '100%',
    borderRadius: 4,
  },
  agendaSub: {
    fontSize: 11,
    lineHeight: 15,
  },
});
