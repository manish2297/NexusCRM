import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth, PRIMARY_ACCOUNTS, UserRole } from '@/context/AuthContext';
import { Colors, Spacing } from '@/constants/theme';
import GlassCard from '@/components/GlassCard';
import NexusLogo from '@/components/NexusLogo';

export default function LoginScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'light' ? 'light' : 'dark'];
  const insets = useSafeAreaInsets();
  const { login, loginWithBiometrics, isBiometricSupported, biometricName } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectAccount = (account: typeof PRIMARY_ACCOUNTS[0]) => {
    setSelectedRole(account.role);
    setEmail(account.email);
    setPassword(account.password);
    setErrorMsg(null);
  };

  const handleBiometricLogin = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);
    const success = await loginWithBiometrics();
    setIsSubmitting(false);
    if (!success) {
      setErrorMsg('Biometric authentication cancelled or not recognized.');
    }
  };

  const handleLogin = async () => {
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Please select an account or enter email & password.');
      return;
    }

    setIsSubmitting(true);
    const success = await login(email.trim(), password);
    setIsSubmitting(false);

    if (!success) {
      const isPrimary = PRIMARY_ACCOUNTS.some(a => a.email.toLowerCase() === email.trim().toLowerCase());
      if (isPrimary) {
        setErrorMsg('Invalid password for selected primary account.');
      } else {
        setErrorMsg('Invalid credentials. Password must be at least 4 characters.');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom, 24) }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.innerWrapper}>
          {/* Brand Header */}
          <View style={styles.headerBlock}>
            <View style={styles.logoWrapper}>
              <NexusLogo size={68} />
            </View>
            <Text style={[styles.brandText, { color: theme.primary }]}>NEXUS CRM</Text>
            <Text style={[styles.title, { color: theme.text }]}>Enterprise Command</Text>
            <Text style={[styles.subText, { color: theme.textSecondary }]}>
              Next-generation client pipeline &amp; intelligence system
            </Text>
          </View>

          {/* Primary Account Selector */}
          <View style={styles.accountsSection}>
            <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
              SELECT PRIMARY ACCOUNT
            </Text>
            <View style={styles.accountsGrid}>
              {PRIMARY_ACCOUNTS.map(acc => {
                const isSelected = selectedRole === acc.role || email.toLowerCase() === acc.email.toLowerCase();
                return (
                  <Pressable
                    key={acc.id}
                    onPress={() => handleSelectAccount(acc)}
                    style={({ pressed }) => [
                      styles.accountCard,
                      {
                        backgroundColor: isSelected ? theme.primary + '18' : theme.backgroundElement,
                        borderColor: isSelected ? acc.color : theme.border,
                      },
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <View style={styles.accountTopRow}>
                      <Text style={[styles.accountBadge, { color: acc.color }]}>{acc.badge}</Text>
                      <View style={[styles.roleIndicator, { backgroundColor: isSelected ? acc.color : 'transparent', borderColor: acc.color }]} />
                    </View>
                    <Text style={[styles.accountName, { color: theme.text }]}>{acc.name}</Text>
                    <Text style={[styles.accountEmail, { color: theme.textSecondary }]} numberOfLines={1}>
                      {acc.email}
                    </Text>
                    <Text style={[styles.passHint, { color: theme.textSecondary }]}>
                      Pass: <Text style={{ color: theme.text, fontWeight: '700' }}>{acc.password}</Text>
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Credential Card */}
          <GlassCard style={styles.loginCard} gradient>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              {selectedRole ? `Sign in as ${selectedRole}` : 'Sign In with Credentials'}
            </Text>

            {errorMsg && (
              <View style={[styles.errorBox, { backgroundColor: theme.statusLost + '15', borderColor: theme.statusLost }]}>
                <Text style={[styles.errorText, { color: theme.statusLost }]}>{errorMsg}</Text>
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Email Address</Text>
              <TextInput
                placeholder="e.g. owner@nexuscrm.com"
                placeholderTextColor={theme.textSecondary}
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  setSelectedRole(null);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Security Password</Text>
              <TextInput
                placeholder="••••••••"
                placeholderTextColor={theme.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
              />
            </View>

            <Pressable
              onPress={handleLogin}
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.loginButton,
                { backgroundColor: theme.primary },
                pressed && styles.buttonPressed,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#07090E" />
              ) : (
                <Text style={styles.loginButtonText}>
                  {selectedRole ? `ENTER AS ${selectedRole.toUpperCase()}` : 'AUTHORIZE ACCESS'}
                </Text>
              )}
            </Pressable>

            {isBiometricSupported && (
              <Pressable
                onPress={handleBiometricLogin}
                disabled={isSubmitting}
                style={({ pressed }) => [
                  styles.biometricButton,
                  { borderColor: theme.primary, backgroundColor: theme.backgroundElement },
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={[styles.biometricButtonText, { color: theme.primary }]}>
                  🔒 UNLOCK WITH {biometricName.toUpperCase()}
                </Text>
              </Pressable>
            )}
          </GlassCard>

          <View style={styles.footerBrand}>
            <Text style={[styles.footerBrandText, { color: theme.textSecondary }]}>
              NEXUS CRM PLATFORM • BUILD 2026.11
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  innerWrapper: {
    width: '100%',
    maxWidth: 440,
    justifyContent: 'center',
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoWrapper: {
    marginBottom: 12,
    shadowColor: '#4FACFE',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  brandText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  subText: {
    fontSize: 12.5,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
  },
  accountsSection: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  accountsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  accountCard: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'space-between',
  },
  accountTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  accountBadge: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  roleIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  accountName: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  accountEmail: {
    fontSize: 10,
    marginTop: 2,
  },
  passHint: {
    fontSize: 9.5,
    marginTop: 4,
  },
  loginCard: {
    padding: Spacing.four,
    gap: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
  },
  formGroup: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  loginButton: {
    height: 46,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#4FACFE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: '#07090E',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
  },
  biometricButton: {
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 4,
  },
  biometricButtonText: {
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  footerBrand: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerBrandText: {
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
});
