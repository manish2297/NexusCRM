import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Lead, CRMTask } from '@/constants/DummyData';

// Configure default notification handler for foreground notifications
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export const NotificationService = {
  /**
   * Request notification permissions from device
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (err) {
      console.warn('[NotificationService] Error requesting permissions:', err);
      return false;
    }
  },

  /**
   * Schedule a local notification reminder for a lead follow-up
   */
  async scheduleFollowUpReminder(lead: Lead): Promise<string | null> {
    if (Platform.OS === 'web' || !lead.nextFollowUp) return null;

    try {
      const granted = await this.requestPermissions();
      if (!granted) return null;

      // Follow up target date (scheduled for 9:00 AM on that date)
      const targetDate = new Date(`${lead.nextFollowUp}T09:00:00`);
      const now = new Date();

      // If the scheduled time is already in the past, schedule for 10 seconds from now for immediate awareness
      const triggerDate = targetDate > now ? targetDate : new Date(now.getTime() + 10 * 1000);

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: `🔔 Follow-up Due: ${lead.name}`,
          body: `${lead.company ? `${lead.company} — ` : ''}Deal Valuation: $${lead.value.toLocaleString()}. Action required today!`,
          data: { leadId: lead.id, type: 'followup' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });

      console.log(`[NotificationService] Scheduled follow-up notification ${identifier} for ${lead.name}`);
      return identifier;
    } catch (error) {
      console.warn('[NotificationService] Failed to schedule follow-up notification:', error);
      return null;
    }
  },

  /**
   * Schedule a local notification reminder for a task deadline
   */
  async scheduleTaskReminder(task: CRMTask): Promise<string | null> {
    if (Platform.OS === 'web' || !task.dueDate || task.completed) return null;

    try {
      const granted = await this.requestPermissions();
      if (!granted) return null;

      const targetDate = new Date(`${task.dueDate}T09:30:00`);
      const now = new Date();
      const triggerDate = targetDate > now ? targetDate : new Date(now.getTime() + 15 * 1000);

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: `⚠️ Task Priority [${task.priority}]: ${task.leadName}`,
          body: task.description,
          data: { taskId: task.id, leadId: task.leadId, type: 'task' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });

      console.log(`[NotificationService] Scheduled task reminder ${identifier} for ${task.leadName}`);
      return identifier;
    } catch (error) {
      console.warn('[NotificationService] Failed to schedule task reminder:', error);
      return null;
    }
  },

  /**
   * Send an immediate test notification to confirm device alerts
   */
  async sendInstantAlert(title: string, body: string): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      const granted = await this.requestPermissions();
      if (!granted) return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
        },
        trigger: null, // trigger immediately
      });
    } catch (error) {
      console.warn('[NotificationService] Failed to send instant alert:', error);
    }
  },

  /**
   * Cancel all pending scheduled notifications
   */
  async cancelAll(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.warn('[NotificationService] Failed to cancel notifications:', error);
    }
  }
};
