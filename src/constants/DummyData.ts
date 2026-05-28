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
}

export interface CRMTask {
  id: string;
  leadId: string;
  leadName: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  completed: boolean;
}

export const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-1',
    name: 'Sarah Connor',
    email: 'sarah.c@cyberdyne.com',
    phone: '+1 (555) 892-0192',
    company: 'Cyberdyne Systems',
    status: 'Proposal',
    value: 85000,
    source: 'Referral',
    notes: 'Key decision maker for security integration. Extremely interested in automated protection systems.',
    createdAt: '2026-05-10T10:00:00Z',
    nextFollowUp: '2026-05-24',
    timeline: [
      {
        id: 't-1-1',
        date: '2026-05-10T10:15:00Z',
        title: 'Initial Discovery Call',
        type: 'call',
        description: 'Spoke with Sarah regarding security threats. Scheduled a detailed engineering meeting.',
      },
      {
        id: 't-1-2',
        date: '2026-05-15T14:00:00Z',
        title: 'Technical Demo Completed',
        type: 'meeting',
        description: 'Demonstrated automated defensive AI models. Received highly positive feedback.',
      },
      {
        id: 't-1-3',
        date: '2026-05-20T16:30:00Z',
        title: 'Proposal Submitted',
        type: 'status_change',
        description: 'Submitted an $85,000 deployment and maintenance proposal. Status changed to Proposal.',
      }
    ]
  },
  {
    id: 'lead-2',
    name: 'Bruce Wayne',
    email: 'bruce@waynecorp.com',
    phone: '+1 (555) 901-4820',
    company: 'Wayne Enterprises',
    status: 'Won',
    value: 250000,
    source: 'LinkedIn',
    notes: 'Prefers late night communications. Highly interested in deep tech analytics platforms.',
    createdAt: '2026-04-12T09:00:00Z',
    timeline: [
      {
        id: 't-2-1',
        date: '2026-04-12T11:00:00Z',
        title: 'Inbound Interest',
        type: 'email',
        description: 'Received email query regarding database acceleration pipelines.',
      },
      {
        id: 't-2-2',
        date: '2026-04-18T22:30:00Z',
        title: 'Late Night Review Meeting',
        type: 'meeting',
        description: 'Met at the penthouse. Reviewed data redundancy algorithms.',
      },
      {
        id: 't-2-3',
        date: '2026-05-01T08:00:00Z',
        title: 'Contract Executed & Closed',
        type: 'status_change',
        description: 'Signed full-scale license agreement. Closed for $250,000. Status set to Won.',
      }
    ]
  },
  {
    id: 'lead-3',
    name: 'Tony Stark',
    email: 'tony@starkindustries.com',
    phone: '+1 (555) 468-6869',
    company: 'Stark Industries',
    status: 'Contacted',
    value: 175000,
    source: 'Website',
    notes: 'Expressed interest in clean energy dashboard software. Quick responder, likes neat UI/UX dashboards.',
    createdAt: '2026-05-18T15:30:00Z',
    nextFollowUp: '2026-05-28',
    timeline: [
      {
        id: 't-3-1',
        date: '2026-05-19T09:00:00Z',
        title: 'Quick Chat on Phone',
        type: 'call',
        description: 'Discussed dashboard visualization needs. Tony commented: "Keep it clean, no boring grids."',
      }
    ]
  },
  {
    id: 'lead-4',
    name: 'Diana Prince',
    email: 'diana.p@museum.org',
    phone: '+1 (555) 750-1941',
    company: 'Louvre Antiquities',
    status: 'New',
    value: 45000,
    source: 'Cold Call',
    notes: 'Looking for a digital archiving system. Prefers emails rather than phone calls.',
    createdAt: '2026-05-22T11:45:00Z',
    nextFollowUp: '2026-06-04',
    timeline: []
  },
  {
    id: 'lead-5',
    name: 'Peter Parker',
    email: 'peter@dailybugle.net',
    phone: '+1 (555) 321-9876',
    company: 'Daily Bugle',
    status: 'Lost',
    value: 12000,
    source: 'Referral',
    notes: 'Budget constraints prevented closure. Keeping on watch list for next quarter.',
    createdAt: '2026-03-01T10:00:00Z',
    timeline: [
      {
        id: 't-5-1',
        date: '2026-03-05T14:00:00Z',
        title: 'Initial Call',
        type: 'call',
        description: 'Discussed photo hosting CRM. Budget is extremely tight.',
      },
      {
        id: 't-5-2',
        date: '2026-03-15T09:00:00Z',
        title: 'Lost Deal',
        type: 'status_change',
        description: 'Declined due to pricing matching issues. Status changed to Lost.',
      }
    ]
  }
];

export const INITIAL_TASKS: CRMTask[] = [
  {
    id: 'task-1',
    leadId: 'lead-1',
    leadName: 'Sarah Connor',
    description: 'Send revised contract with maintenance SLA terms',
    priority: 'High',
    dueDate: '2026-05-25',
    completed: false
  },
  {
    id: 'task-2',
    leadId: 'lead-3',
    leadName: 'Tony Stark',
    description: 'Prepare visual deck showing dark-mode widget interface',
    priority: 'High',
    dueDate: '2026-05-27',
    completed: false
  },
  {
    id: 'task-3',
    leadId: 'lead-4',
    leadName: 'Diana Prince',
    description: 'Send follow-up introductory email with archiving case studies',
    priority: 'Medium',
    dueDate: '2026-05-30',
    completed: false
  },
  {
    id: 'task-4',
    leadId: 'lead-2',
    leadName: 'Bruce Wayne',
    description: 'Send onboarding email and setup database credentials',
    priority: 'Low',
    dueDate: '2026-06-02',
    completed: true
  }
];
