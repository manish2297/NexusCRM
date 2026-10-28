import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Lead,
  CRMTask,
  TimelineEvent,
  CRMSettings,
  INITIAL_LEADS,
  INITIAL_TASKS,
  DEFAULT_SETTINGS,
} from '@/constants/DummyData';
import { NotificationService } from '@/services/NotificationService';

const STORAGE_KEYS = {
  LEADS: '@nexuscrm_leads_v2',
  TASKS: '@nexuscrm_tasks_v2',
  SETTINGS: '@nexuscrm_settings_v2',
  INITIALIZED: '@nexuscrm_initialized_v2',
};

interface CRMContextType {
  leads: Lead[];
  tasks: CRMTask[];
  settings: CRMSettings;
  isLoaded: boolean;
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'timeline'>) => Lead;
  updateLead: (id: string, updatedFields: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  addTask: (task: Omit<CRMTask, 'id' | 'completed'>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  addTimelineNote: (leadId: string, title: string, description: string, type?: TimelineEvent['type']) => void;
  updateSettings: (partial: Partial<CRMSettings>) => void;
  resetToDemoData: () => Promise<void>;
  factoryReset: () => Promise<void>;
  formatCurrency: (amount: number) => string;
  metrics: {
    totalRevenue: number;
    activeDealsValue: number;
    winRate: number;
    totalLeadsCount: number;
    activeLeadsCount: number;
  };
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<CRMTask[]>([]);
  const [settings, setSettings] = useState<CRMSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Track initialization to avoid saving initial state before loading from AsyncStorage
  const hasMounted = useRef(false);

  // 1. Initial Load from Persistent Storage
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const [isInit, storedLeads, storedTasks, storedSettings] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.INITIALIZED),
          AsyncStorage.getItem(STORAGE_KEYS.LEADS),
          AsyncStorage.getItem(STORAGE_KEYS.TASKS),
          AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
        ]);

        const hasExistingData =
          isInit !== null ||
          storedLeads !== null ||
          storedTasks !== null ||
          storedSettings !== null;

        if (!hasExistingData) {
          // Brand new install: seed initial demo data
          setLeads(INITIAL_LEADS);
          setTasks(INITIAL_TASKS);
          setSettings(DEFAULT_SETTINGS);
          await Promise.all([
            AsyncStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true'),
            AsyncStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(INITIAL_LEADS)),
            AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(INITIAL_TASKS)),
            AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS)),
          ]);
        } else {
          // Existing install: load stored records directly (supports empty arrays [] after factory reset)
          if (storedLeads !== null) {
            const parsedLeads = JSON.parse(storedLeads);
            if (Array.isArray(parsedLeads)) {
              setLeads(parsedLeads);
            }
          }

          if (storedTasks !== null) {
            const parsedTasks = JSON.parse(storedTasks);
            if (Array.isArray(parsedTasks)) {
              setTasks(parsedTasks);
            }
          }

          if (storedSettings !== null) {
            const parsedSettings = JSON.parse(storedSettings);
            setSettings(prev => ({ ...prev, ...parsedSettings }));
          }
        }
      } catch (err) {
        console.warn('[CRMContext] Error loading data from AsyncStorage:', err);
      } finally {
        setIsLoaded(true);
        hasMounted.current = true;
      }
    };

    loadPersistedData();
  }, []);

  // 2. Persist leads to storage whenever updated
  useEffect(() => {
    if (!hasMounted.current || !isLoaded) return;
    AsyncStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads)).catch(err =>
      console.warn('[CRMContext] Failed to persist leads:', err)
    );
  }, [leads, isLoaded]);

  // 3. Persist tasks to storage whenever updated
  useEffect(() => {
    if (!hasMounted.current || !isLoaded) return;
    AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks)).catch(err =>
      console.warn('[CRMContext] Failed to persist tasks:', err)
    );
  }, [tasks, isLoaded]);

  // 4. Persist settings to storage whenever updated
  useEffect(() => {
    if (!hasMounted.current || !isLoaded) return;
    AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings)).catch(err =>
      console.warn('[CRMContext] Failed to persist settings:', err)
    );
  }, [settings, isLoaded]);

  // 5. Calculate metrics dynamically without triggering cascading re-renders
  const metrics = useMemo(() => {
    const totalLeads = leads.length;
    const wonLeads = leads.filter(l => l.status === 'Won');
    const closedLeads = leads.filter(l => l.status === 'Won' || l.status === 'Lost');

    const totalRevenue = wonLeads.reduce((sum, l) => sum + l.value, 0);
    const activeDealsValue = leads
      .filter(l => l.status !== 'Won' && l.status !== 'Lost')
      .reduce((sum, l) => sum + l.value, 0);

    const winRate =
      closedLeads.length > 0 ? Math.round((wonLeads.length / closedLeads.length) * 100) : 0;

    const activeLeadsCount = leads.filter(l => l.status !== 'Won' && l.status !== 'Lost').length;

    return {
      totalRevenue,
      activeDealsValue,
      winRate,
      totalLeadsCount: totalLeads,
      activeLeadsCount,
    };
  }, [leads]);

  const formatCurrency = useCallback((amount: number): string => {
    const symbol = settings.currency || '$';
    return `${symbol}${amount.toLocaleString()}`;
  }, [settings.currency]);

  const addTimelineNote = useCallback(
    (
      leadId: string,
      title: string,
      description: string,
      type: TimelineEvent['type'] = 'note'
    ) => {
      setLeads(prevLeads =>
        prevLeads.map(lead => {
          if (lead.id !== leadId) return lead;
          return {
            ...lead,
            timeline: [
              ...lead.timeline,
              {
                id: `t-custom-${Date.now()}`,
                date: new Date().toISOString(),
                title,
                type,
                description,
              },
            ],
          };
        })
      );
    },
    []
  );

  const addLead = useCallback((newLeadData: Omit<Lead, 'id' | 'createdAt' | 'timeline'>) => {
    const newId = `lead-${Date.now()}`;
    const newLead: Lead = {
      ...newLeadData,
      id: newId,
      createdAt: new Date().toISOString(),
      timeline: [
        {
          id: `t-${newId}-init`,
          date: new Date().toISOString(),
          title: 'Lead Created',
          type: 'status_change',
          description: `Lead added manually. Status set to ${newLeadData.status}.`,
        },
      ],
    };

    setLeads(prev => [newLead, ...prev]);

    if (newLead.nextFollowUp && settings.notificationsEnabled) {
      NotificationService.scheduleFollowUpReminder(newLead);
    }

    return newLead;
  }, [settings.notificationsEnabled]);

  const updateLead = useCallback((id: string, updatedFields: Partial<Lead>) => {
    setLeads(prevLeads =>
      prevLeads.map(lead => {
        if (lead.id !== id) return lead;

        const updatedTimeline = [...lead.timeline];

        if (updatedFields.status && updatedFields.status !== lead.status) {
          updatedTimeline.push({
            id: `t-status-${Date.now()}`,
            date: new Date().toISOString(),
            title: 'Status Transition',
            type: 'status_change',
            description: `Stage updated from "${lead.status}" to "${updatedFields.status}".`,
          });
        }

        if (updatedFields.value !== undefined && updatedFields.value !== lead.value) {
          updatedTimeline.push({
            id: `t-val-${Date.now()}`,
            date: new Date().toISOString(),
            title: 'Value Restructured',
            type: 'note',
            description: `Deal value corrected from $${lead.value.toLocaleString()} to $${updatedFields.value.toLocaleString()}.`,
          });
        }

        if (
          updatedFields.nextFollowUp !== undefined &&
          updatedFields.nextFollowUp !== lead.nextFollowUp
        ) {
          updatedTimeline.push({
            id: `t-follow-${Date.now()}`,
            date: new Date().toISOString(),
            title: 'Follow-up Rescheduled',
            type: 'meeting',
            description: updatedFields.nextFollowUp
              ? `Next relationship follow-up scheduled for ${updatedFields.nextFollowUp}.`
              : 'Active relationship follow-up cleared.',
          });
        }

        const mergedLead: Lead = {
          ...lead,
          ...updatedFields,
          timeline: updatedTimeline,
        };

        if (updatedFields.nextFollowUp && settings.notificationsEnabled) {
          NotificationService.scheduleFollowUpReminder(mergedLead);
        }

        return mergedLead;
      })
    );

    if (updatedFields.name) {
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.leadId === id ? { ...task, leadName: updatedFields.name! } : task
        )
      );
    }
  }, [settings.notificationsEnabled]);

  const deleteLead = useCallback((id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id));
    setTasks(prev => prev.filter(t => t.leadId !== id));
  }, []);

  const addTask = useCallback((taskData: Omit<CRMTask, 'id' | 'completed'>) => {
    const newTask: CRMTask = {
      ...taskData,
      id: `task-${Date.now()}`,
      completed: false,
    };

    setTasks(prev => [newTask, ...prev]);

    if (settings.notificationsEnabled) {
      NotificationService.scheduleTaskReminder(newTask);
    }

    addTimelineNote(
      taskData.leadId,
      'Task Scheduled',
      `Assigned: "${taskData.description}" (Priority: ${taskData.priority}, Due: ${taskData.dueDate})`,
      'note'
    );
  }, [settings.notificationsEnabled, addTimelineNote]);

  const toggleTask = useCallback((id: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task => {
        if (task.id !== id) return task;

        const nextStatus = !task.completed;

        addTimelineNote(
          task.leadId,
          nextStatus ? 'Task Completed' : 'Task Re-opened',
          `Task "${task.description}" was marked as ${nextStatus ? 'done' : 'pending'}.`,
          nextStatus ? 'email' : 'note'
        );

        return {
          ...task,
          completed: nextStatus,
        };
      })
    );
  }, [addTimelineNote]);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const updateSettings = useCallback((partial: Partial<CRMSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  }, []);

  const factoryReset = useCallback(async () => {
    try {
      // 1. Cancel all scheduled reminders and local notifications
      await NotificationService.cancelAll();

      // 2. Set memory state to completely empty records and default settings
      setLeads([]);
      setTasks([]);
      setSettings(DEFAULT_SETTINGS);

      // 3. Immediately persist empty state to storage
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true'),
        AsyncStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify([])),
        AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([])),
        AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS)),
      ]);
    } catch (err) {
      console.warn('[CRMContext] Error performing factory reset:', err);
    }
  }, []);

  const resetToDemoData = useCallback(async () => {
    try {
      await NotificationService.cancelAll();
      setLeads(INITIAL_LEADS);
      setTasks(INITIAL_TASKS);
      setSettings(DEFAULT_SETTINGS);
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true'),
        AsyncStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(INITIAL_LEADS)),
        AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(INITIAL_TASKS)),
        AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS)),
      ]);
    } catch (err) {
      console.warn('[CRMContext] Error resetting demo data:', err);
    }
  }, []);

  return (
    <CRMContext.Provider
      value={{
        leads,
        tasks,
        settings,
        isLoaded,
        addLead,
        updateLead,
        deleteLead,
        addTask,
        toggleTask,
        deleteTask,
        addTimelineNote,
        updateSettings,
        resetToDemoData,
        factoryReset,
        formatCurrency,
        metrics,
      }}>
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
};
