export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'status_change';
  description: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: 'New' | 'Contacted' | 'Proposal' | 'Won' | 'Lost';
  value: number;
  source: string;
  notes: string;
  timeline: TimelineEvent[];
  createdAt: string;
  nextFollowUp?: string; // YYYY-MM-DD
  tags?: string[];
}

export interface CRMSettings {
  currency: '$' | '€' | '£' | '₹';
  userName: string;
  userEmail: string;
  userRole: string;
  salesQuota: number;
  notificationsEnabled: boolean;
  biometricsEnabled: boolean;
}

export const DEFAULT_SETTINGS: CRMSettings = {
  currency: '$',
  userName: 'User Profile',
  userEmail: '',
  userRole: 'Account Executive',
  salesQuota: 100000,
  notificationsEnabled: true,
  biometricsEnabled: false,
};

export interface CRMTask {
  id: string;
  leadId: string;
  leadName: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  completed: boolean;
}

export const INITIAL_LEADS: Lead[] = [];

export const INITIAL_TASKS: CRMTask[] = [];
