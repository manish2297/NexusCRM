import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  useColorScheme,
  Platform,
  Alert,
  Switch,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useCRM } from '@/context/CRMContext';
import { useAuth } from '@/context/AuthContext';
import { Colors, Spacing, BottomTabInset, MaxContentWidth } from '@/constants/theme';
import GlassCard from '@/components/GlassCard';
import NexusLogo from '@/components/NexusLogo';
import { ExportService } from '@/services/ExportService';
import { NotificationService } from '@/services/NotificationService';

const CURRENCIES: ('$' | '€' | '£' | '₹')[] = ['$', '€', '£', '₹'];
const CURRENCY_LABELS: Record<string, string> = {
  $: '$ USD',
  '€': '€ EUR',
  '£': '£ GBP',
  '₹': '₹ INR',
};

export default function SettingsScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'light' ? 'light' : 'dark'];
  const insets = useSafeAreaInsets();

  const { leads, tasks, settings, updateSettings, resetToDemoData, factoryReset, formatCurrency, metrics } = useCRM();
  const { logout, userEmail, currentUser, loginAsAccount, primaryAccounts, isBiometricSupported, biometricName } = useAuth();

  const [isExporting, setIsExporting] = useState(false);

  const paddingBottomStyle = Platform.select({
    ios: insets.bottom + BottomTabInset + Spacing.three,
    android: insets.bottom + BottomTabInset + Spacing.three,
    default: Spacing.four,
  });

  const displayName = currentUser?.name || settings.userName || 'User Profile';
  const displayEmail = currentUser?.email || userEmail || settings.userEmail || 'Active Session';
  const displayRole = currentUser?.title || settings.userRole || 'Account Executive';
  const roleBadge = currentUser?.badge || '💼 STAFF';
  const roleColor = currentUser?.color || theme.primary;
  const avatarInitials = (displayName || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const quotaProgress = Math.min(
    100,
    Math.round((metrics.totalRevenue / (currentUser?.defaultQuota || settings.salesQuota || 100000)) * 100)
  );

  const handleExportCSV = async () => {
    setIsExporting(true);
    const success = await ExportService.exportLeadsPipeline(leads);
    setIsExporting(false);
    if (!success && Platform.OS !== 'web') {
      Alert.alert('Notice', 'Unable to initiate system share modal.');
    }
  };

  const handleExportJSON = async () => {
    setIsExporting(true);
    const success = await ExportService.exportCompleteBackup(leads, tasks);
    setIsExporting(false);
    if (!success && Platform.OS !== 'web') {
      Alert.alert('Notice', 'Unable to initiate system share modal.');
    }
  };

  const handleTestNotification = async () => {
    await NotificationService.sendInstantAlert(
      '🔔 Nexus CRM System Alert',
      'Local push notifications are active and functioning correctly.'
    );
    if (Platform.OS === 'web') {
      alert('Notification simulated for Web environment.');
    } else {
      Alert.alert('Alert Dispatched', 'Check your device notification banner.');
    }
  };

  const handleFactoryReset = () => {
    const performReset = async () => {
      await factoryReset();
      if (Platform.OS === 'web') {
        alert('Factory reset complete. All data has been deleted.');
      } else {
        Alert.alert('Factory Reset Complete', 'All CRM pipeline leads, tasks, notes, and records have been deleted.');
      }
    };

    if (Platform.OS === 'web') {
      if (confirm('FACTORY RESET: Are you sure you want to delete all data? All pipeline leads, tasks, and notes will be permanently deleted.')) {
        performReset();
      }
    } else {
      Alert.alert(
        '⚠️ Factory Reset',
        'Are you sure you want to delete all data? All leads, pipeline deals, tasks, notes, and metrics will be permanently erased. This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete All Data', style: 'destructive', onPress: performReset },
        ]
      );
    }
  };

  const handleLogout = () => {
    const doLogout = async () => {
      await logout();
      router.replace('/login');
    };

    if (Platform.OS === 'web') {
      if (confirm('Sign out from your active Nexus session?')) {
        doLogout();
      }
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to log out of your CRM session?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingTop: Math.max(insets.top, 24),
            paddingBottom: paddingBottomStyle,
          },
        ]}>
        <View style={styles.innerWrapper}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.headerLogoBadge, { backgroundColor: theme.primary + '18', borderColor: theme.primary + '40' }]}>
                <Image source={require('@/assets/images/tabIcons/settings.png')} style={[styles.headerLogoIcon, { tintColor: theme.primary }]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.headerPre, { color: theme.primary }]}>CONTROL & PREFERENCES</Text>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Settings Cockpit</Text>
              </View>
            </View>
            <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
              Workspace management, data synchronization, and currency configuration.
            </Text>
          </View>

          {/* User Profile Card */}
          <GlassCard style={styles.card} gradient>
            <View style={styles.profileRow}>
              <View style={[styles.avatar, { backgroundColor: roleColor + '20', borderColor: roleColor }]}>
                <Text style={[styles.avatarText, { color: roleColor }]}>
                  {avatarInitials}
                </Text>
              </View>
              <View style={styles.profileMeta}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Text style={[styles.userName, { color: theme.text }]}>{displayName}</Text>
                  <View style={[styles.roleBadgePill, { borderColor: roleColor + '60', backgroundColor: roleColor + '18' }]}>
                    <Text style={[styles.roleBadgePillText, { color: roleColor }]}>{roleBadge}</Text>
                  </View>
                </View>
                <Text style={[styles.userRole, { color: roleColor }]}>{displayRole}</Text>
                <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
                  {displayEmail}
                </Text>
              </View>
            </View>

            {/* Quota Progress */}
            <View style={[styles.quotaBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <View style={styles.quotaHeader}>
                <Text style={[styles.quotaTitle, { color: theme.textSecondary }]}>QUARTERLY SALES TARGET</Text>
                <Text style={[styles.quotaVal, { color: theme.text }]}>
                  {formatCurrency(metrics.totalRevenue)} / {formatCurrency(currentUser?.defaultQuota || settings.salesQuota || 100000)}
                </Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: theme.background }]}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${quotaProgress}%`,
                      backgroundColor: quotaProgress >= 80 ? theme.statusWon : roleColor,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.quotaPacing, { color: theme.textSecondary }]}>
                🎯 {quotaProgress}% achieved • Active Deals: {formatCurrency(metrics.activeDealsValue)}
              </Text>
            </View>
          </GlassCard>

          {/* Primary Role Switcher Card */}
          <GlassCard style={styles.card}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Primary Access Accounts</Text>
            <Text style={[styles.sectionDesc, { color: theme.textSecondary }]}>
              Switch workspace identity between Owner, Admin, and Staff roles.
            </Text>

            <View style={styles.roleSwitchGrid}>
              {primaryAccounts.map(acc => {
                const isActive = currentUser?.role === acc.role;
                return (
                  <Pressable
                    key={acc.id}
                    onPress={async () => {
                      if (!isActive) {
                        await loginAsAccount(acc.role);
                        updateSettings({
                          userName: acc.name,
                          userEmail: acc.email,
                          userRole: acc.title,
                          salesQuota: acc.defaultQuota,
                        });
                      }
                    }}
                    style={({ pressed }) => [
                      styles.roleSwitchBtn,
                      {
                        backgroundColor: isActive ? acc.color + '15' : theme.backgroundElement,
                        borderColor: isActive ? acc.color : theme.border,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.roleSwitchTop}>
                      <Text style={[styles.roleSwitchBadge, { color: acc.color }]}>{acc.badge}</Text>
                      {isActive && (
                        <View style={[styles.activeDot, { backgroundColor: acc.color }]} />
                      )}
                    </View>
                    <Text style={[styles.roleSwitchName, { color: theme.text }]}>{acc.name}</Text>
                    <Text style={[styles.roleSwitchTitle, { color: theme.textSecondary }]} numberOfLines={1}>
                      {acc.title}
                    </Text>
                    <Text style={[styles.roleSwitchEmail, { color: theme.textSecondary }]} numberOfLines={1}>
                      {acc.email}
                    </Text>
                    <View style={[styles.switchStatusBox, { backgroundColor: isActive ? acc.color : theme.background, borderColor: isActive ? acc.color : theme.border }]}>
                      <Text style={[styles.switchStatusText, { color: isActive ? '#07090E' : theme.textSecondary }]}>
                        {isActive ? 'ACTIVE' : 'SWITCH'}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </GlassCard>

          {/* Currency Configuration */}
          <GlassCard style={styles.card}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Valuation Currency</Text>
            <Text style={[styles.sectionDesc, { color: theme.textSecondary }]}>
              Select the default currency symbol across your metrics, pipelines, and export files.
            </Text>
            <View style={styles.currencyRow}>
              {CURRENCIES.map(curr => {
                const isSelected = settings.currency === curr;
                return (
                  <Pressable
                    key={curr}
                    onPress={() => updateSettings({ currency: curr })}
                    style={({ pressed }) => [
                      styles.currencyBtn,
                      {
                        backgroundColor: isSelected ? theme.primary : theme.backgroundElement,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                      pressed && styles.pressed,
                    ]}>
                    <Text
                      style={[
                        styles.currencyBtnText,
                        { color: isSelected ? '#07090E' : theme.text },
                      ]}>
                      {CURRENCY_LABELS[curr]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </GlassCard>

          {/* System & Alerts */}
          <GlassCard style={styles.card}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Device Alerts & Security</Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: theme.text }]}>Follow-up Push Reminders</Text>
                <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                  Receive local alerts at 9:00 AM on scheduled follow-up dates
                </Text>
              </View>
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={val => updateSettings({ notificationsEnabled: val })}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={Platform.OS === 'android' ? (settings.notificationsEnabled ? '#FFFFFF' : '#888888') : undefined}
              />
            </View>

            {isBiometricSupported && (
              <View style={[styles.settingRow, { borderTopWidth: 1, borderTopColor: theme.border }]}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: theme.text }]}>
                    {biometricName} Quick Unlock
                  </Text>
                  <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                    Allow biometric authentication when accessing the CRM
                  </Text>
                </View>
                <Switch
                  value={settings.biometricsEnabled}
                  onValueChange={val => updateSettings({ biometricsEnabled: val })}
                  trackColor={{ false: theme.border, true: theme.primary }}
                  thumbColor={Platform.OS === 'android' ? (settings.biometricsEnabled ? '#FFFFFF' : '#888888') : undefined}
                />
              </View>
            )}

            <Pressable
              onPress={handleTestNotification}
              style={({ pressed }) => [
                styles.actionBtnSecondary,
                { borderColor: theme.border, backgroundColor: theme.backgroundElement },
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.actionBtnTextSecondary, { color: theme.primary }]}>
                🔔 Send Test Notification
              </Text>
            </Pressable>
          </GlassCard>

          {/* Data Export & Backup */}
          <GlassCard style={styles.card}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Data Pipeline & Backups</Text>
            <Text style={[styles.sectionDesc, { color: theme.textSecondary }]}>
              Export your CRM database or share formatted account spreadsheets.
            </Text>

            <View style={styles.btnStack}>
              <Pressable
                onPress={handleExportCSV}
                disabled={isExporting}
                style={({ pressed }) => [
                  styles.actionBtnPrimary,
                  { backgroundColor: theme.primary },
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.actionBtnTextPrimary}>
                  📤 EXPORT PIPELINE TO CSV ({leads.length} LEADS)
                </Text>
              </Pressable>

              <Pressable
                onPress={handleExportJSON}
                disabled={isExporting}
                style={({ pressed }) => [
                  styles.actionBtnSecondary,
                  { borderColor: theme.border, backgroundColor: theme.backgroundElement },
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.actionBtnTextSecondary, { color: theme.text }]}>
                  💾 DOWNLOAD FULL JSON BACKUP
                </Text>
              </Pressable>

              <Pressable
                onPress={handleFactoryReset}
                style={({ pressed }) => [
                  styles.actionBtnDanger,
                  { borderColor: theme.statusLost + '80', backgroundColor: theme.statusLost + '18' },
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.actionBtnTextDanger, { color: theme.statusLost }]}>
                  🗑️ FACTORY RESET (CLEAR ALL CRM DATA)
                </Text>
              </Pressable>
            </View>
          </GlassCard>

          {/* Session & Sign Out */}
          <GlassCard style={styles.card}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Account Session</Text>
            <Text style={[styles.sectionDesc, { color: theme.textSecondary }]}>
              Logged in as {displayEmail}. Use the button below to sign out of your workspace.
            </Text>

            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [
                styles.logoutBtn,
                { borderColor: theme.statusLost + '60', backgroundColor: theme.statusLost + '15' },
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.logoutBtnText, { color: theme.statusLost }]}>
                🚪 SIGN OUT OF WORKSPACE
              </Text>
            </Pressable>

            <View style={styles.footerNote}>
              <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                Nexus CRM Mobile • SDK 56 Production Build
              </Text>
              <Text style={[styles.footerSub, { color: theme.textSecondary }]}>
                Offline-First Persistent Engine Active
              </Text>
            </View>
          </GlassCard>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  innerWrapper: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.four,
  },
  header: {
    marginBottom: Spacing.one,
  },
  headerLogoBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogoIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  headerPre: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
  card: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '900',
  },
  profileMeta: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
  },
  roleBadgePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  roleBadgePillText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  roleSwitchGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  roleSwitchBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'space-between',
  },
  roleSwitchTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  roleSwitchBadge: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  roleSwitchName: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  roleSwitchTitle: {
    fontSize: 10,
    marginTop: 1,
  },
  roleSwitchEmail: {
    fontSize: 9,
    marginTop: 2,
  },
  switchStatusBox: {
    marginTop: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchStatusText: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  userRole: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userEmail: {
    fontSize: 11,
  },
  quotaBox: {
    padding: Spacing.three,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    marginTop: 4,
  },
  quotaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quotaTitle: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  quotaVal: {
    fontSize: 11,
    fontWeight: '800',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  quotaPacing: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  sectionDesc: {
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: -4,
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  currencyBtn: {
    flex: 1,
    minWidth: 70,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  currencyBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  settingInfo: {
    flex: 1,
    gap: 2,
  },
  settingLabel: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  settingSub: {
    fontSize: 10.5,
    lineHeight: 14,
  },
  btnStack: {
    gap: 10,
  },
  actionBtnPrimary: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnTextPrimary: {
    color: '#07090E',
    fontWeight: '900',
    fontSize: 11.5,
    letterSpacing: 0.8,
  },
  actionBtnSecondary: {
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionBtnTextSecondary: {
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  actionBtnDanger: {
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionBtnTextDanger: {
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  logoutBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  logoutBtnText: {
    fontWeight: '900',
    fontSize: 11.5,
    letterSpacing: 0.8,
  },
  footerNote: {
    alignItems: 'center',
    marginTop: 4,
    gap: 2,
  },
  footerText: {
    fontSize: 10,
    fontWeight: '700',
  },
  footerSub: {
    fontSize: 9.5,
    opacity: 0.7,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
});
