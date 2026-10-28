import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Lead, CRMTask } from '@/constants/DummyData';

export const ExportService = {
  /**
   * Format leads list into a RFC-compliant CSV string
   */
  generateLeadsCSV(leads: Lead[]): string {
    const headers = [
      'Lead ID',
      'Name',
      'Company',
      'Email',
      'Phone',
      'Status',
      'Deal Value ($)',
      'Acquisition Source',
      'Next Follow-Up',
      'Tags',
      'Created Date',
      'Total Timeline Touchpoints',
    ];

    const escapeCSV = (str: string | number | undefined | null) => {
      if (str === undefined || str === null) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = leads.map(l => [
      escapeCSV(l.id),
      escapeCSV(l.name),
      escapeCSV(l.company),
      escapeCSV(l.email),
      escapeCSV(l.phone),
      escapeCSV(l.status),
      escapeCSV(l.value),
      escapeCSV(l.source),
      escapeCSV(l.nextFollowUp || 'None'),
      escapeCSV((l.tags || []).join('; ')),
      escapeCSV(l.createdAt),
      escapeCSV(l.timeline.length),
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  },

  /**
   * Format tasks list into a CSV string
   */
  generateTasksCSV(tasks: CRMTask[]): string {
    const headers = ['Task ID', 'Lead ID', 'Lead Name', 'Description', 'Priority', 'Due Date', 'Status'];

    const escapeCSV = (str: string | number | undefined | null) => {
      if (str === undefined || str === null) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = tasks.map(t => [
      escapeCSV(t.id),
      escapeCSV(t.leadId),
      escapeCSV(t.leadName),
      escapeCSV(t.description),
      escapeCSV(t.priority),
      escapeCSV(t.dueDate),
      escapeCSV(t.completed ? 'Completed' : 'Pending'),
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  },

  /**
   * Share file natively on iOS/Android or trigger browser download on Web
   */
  async shareData(filename: string, content: string, mimeType: string = 'text/csv'): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        // Web download fallback
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return true;
      }

      // Native mobile file export and share using Expo SDK 56 File API
      const file = new File(Paths.cache, filename);
      file.write(content);
      const fileUri = file.uri;

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        console.warn('[ExportService] Sharing is not available on this device');
        return false;
      }

      await Sharing.shareAsync(fileUri, {
        mimeType,
        dialogTitle: `Export NexusCRM: ${filename}`,
        UTI: mimeType === 'application/json' ? 'public.json' : 'public.comma-separated-values-text',
      });

      return true;
    } catch (error) {
      console.error('[ExportService] Failed to export data:', error);
      return false;
    }
  },

  /**
   * Quick export of leads pipeline to CSV
   */
  async exportLeadsPipeline(leads: Lead[]): Promise<boolean> {
    const csvData = this.generateLeadsCSV(leads);
    const dateStr = new Date().toISOString().split('T')[0];
    return this.shareData(`NexusCRM_Leads_${dateStr}.csv`, csvData, 'text/csv');
  },

  /**
   * Complete CRM JSON backup export
   */
  async exportCompleteBackup(leads: Lead[], tasks: CRMTask[]): Promise<boolean> {
    const backup = {
      app: 'NexusCRM',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      leadsCount: leads.length,
      tasksCount: tasks.length,
      leads,
      tasks,
    };

    const jsonString = JSON.stringify(backup, null, 2);
    const dateStr = new Date().toISOString().split('T')[0];
    return this.shareData(`NexusCRM_Backup_${dateStr}.json`, jsonString, 'application/json');
  }
};
