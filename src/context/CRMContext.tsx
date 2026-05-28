import React, { createContext, useContext, useState, useEffect } from 'react';
import { Lead, CRMTask, TimelineEvent, INITIAL_LEADS, INITIAL_TASKS } from '@/constants/DummyData';

interface CRMContextType {
  leads: Lead[];
  tasks: CRMTask[];
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'timeline'>) => Lead;
  updateLead: (id: string, updatedFields: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  addTask: (task: Omit<CRMTask, 'id' | 'completed'>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  addTimelineNote: (leadId: string, title: string, description: string, type?: TimelineEvent['type']) => void;
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
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [tasks, setTasks] = useState<CRMTask[]>(INITIAL_TASKS);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    activeDealsValue: 0,
    winRate: 0,
    totalLeadsCount: 0,
    activeLeadsCount: 0,
  });

  // Calculate metrics dynamically based on current leads state
  useEffect(() => {
    const totalLeads = leads.length;
    const wonLeads = leads.filter(l => l.status === 'Won');
    const closedLeads = leads.filter(l => l.status === 'Won' || l.status === 'Lost');
    
    const totalRevenue = wonLeads.reduce((sum, l) => sum + l.value, 0);
    const activeDealsValue = leads
      .filter(l => l.status !== 'Won' && l.status !== 'Lost')
      .reduce((sum, l) => sum + l.value, 0);
      
    const winRate = closedLeads.length > 0 
      ? Math.round((wonLeads.length / closedLeads.length) * 100) 
      : 0;
      
    const activeLeadsCount = leads.filter(l => l.status !== 'Won' && l.status !== 'Lost').length;

    setMetrics({
      totalRevenue,
      activeDealsValue,
      winRate,
      totalLeadsCount: totalLeads,
      activeLeadsCount,
    });
  }, [leads]);

  const addLead = (newLeadData: Omit<Lead, 'id' | 'createdAt' | 'timeline'>) => {
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
        }
      ]
    };
    
    setLeads(prev => [newLead, ...prev]);
    return newLead;
  };

  const updateLead = (id: string, updatedFields: Partial<Lead>) => {
    setLeads(prevLeads =>
      prevLeads.map(lead => {
        if (lead.id !== id) return lead;

        const updatedTimeline = [...lead.timeline];
        
        // Auto-log status transitions
        if (updatedFields.status && updatedFields.status !== lead.status) {
          updatedTimeline.push({
            id: `t-status-${Date.now()}`,
            date: new Date().toISOString(),
            title: 'Status Transition',
            type: 'status_change',
            description: `Stage updated from "${lead.status}" to "${updatedFields.status}".`,
          });
        }

        // Auto-log deal value corrections
        if (updatedFields.value !== undefined && updatedFields.value !== lead.value) {
          updatedTimeline.push({
            id: `t-val-${Date.now()}`,
            date: new Date().toISOString(),
            title: 'Value Restructured',
            type: 'note',
            description: `Deal value corrected from $${lead.value.toLocaleString()} to $${updatedFields.value.toLocaleString()}.`,
          });
        }

        // Auto-log next follow up date modifications
        if (updatedFields.nextFollowUp !== undefined && updatedFields.nextFollowUp !== lead.nextFollowUp) {
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

        return {
          ...lead,
          ...updatedFields,
          timeline: updatedTimeline,
        };
      })
    );

    // Sync task lists when lead name is updated
    if (updatedFields.name) {
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.leadId === id ? { ...task, leadName: updatedFields.name! } : task
        )
      );
    }
  };

  const deleteLead = (id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id));
    // Clean up tasks associated with this lead
    setTasks(prev => prev.filter(t => t.leadId !== id));
  };

  const addTask = (taskData: Omit<CRMTask, 'id' | 'completed'>) => {
    const newTask: CRMTask = {
      ...taskData,
      id: `task-${Date.now()}`,
      completed: false,
    };
    
    setTasks(prev => [newTask, ...prev]);

    // Log task assignment in Lead timeline
    addTimelineNote(
      taskData.leadId,
      'Task Scheduled',
      `Assigned: "${taskData.description}" (Priority: ${taskData.priority}, Due: ${taskData.dueDate})`,
      'note'
    );
  };

  const toggleTask = (id: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task => {
        if (task.id !== id) return task;
        
        const nextStatus = !task.completed;
        
        // Log task progress on lead timeline
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
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const addTimelineNote = (
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
            }
          ]
        };
      })
    );
  };

  return (
    <CRMContext.Provider
      value={{
        leads,
        tasks,
        addLead,
        updateLead,
        deleteLead,
        addTask,
        toggleTask,
        deleteTask,
        addTimelineNote,
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
