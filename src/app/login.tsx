import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, useColorScheme, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { Colors, Spacing } from '@/constants/theme';
import GlassCard from '@/components/GlassCard';

export default function LoginScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'light' ? 'light' : 'dark'];
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    const success = await login(email.trim(), password);
    setIsSubmitting(false);

    if (!success) {
      setErrorMsg('Invalid email format or password. Try admin@nexuscrm.com / password123.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={[styles.innerWrapper, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.headerBlock}>
          <Text style={[styles.brandText, { color: theme.primary }]}>NEXUS CRM</Text>
          <Text style={[styles.title, { color: theme.text }]}>Welcome Back</Text>
          <Text style={[styles.subText, { color: theme.textSecondary }]}>
            Enter operational credentials to access Command Dashboard
          </Text>
        </View>

        <GlassCard style={styles.loginCard} gradient>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Sign In</Text>

          {errorMsg && (
            <View style={[styles.errorBox, { backgroundColor: theme.statusLost + '15', borderColor: theme.statusLost }]}>
              <Text style={[styles.errorText, { color: theme.statusLost }]}>{errorMsg}</Text>
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Email Address</Text>
            <TextInput
              placeholder="e.g. admin@nexuscrm.com"
              placeholderTextColor={theme.textSecondary}
              value={email}
              onChangeText={setEmail}
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
              pressed && styles.buttonPressed
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#07090E" />
            ) : (
              <Text style={styles.loginButtonText}>AUTHORIZE ACCESS</Text>
            )}
          </Pressable>

          <View style={[styles.tipBox, { borderColor: theme.border }]}>
            <Text style={[styles.tipTitle, { color: theme.text }]}>🔑 Default Sandbox Profile</Text>
            <Text style={[styles.tipText, { color: theme.textSecondary }]}>
              Email: <Text style={{ color: theme.text, fontWeight: 'bold' }}>admin@nexuscrm.com</Text>
            </Text>
            <Text style={[styles.tipText, { color: theme.textSecondary }]}>
              Password: <Text style={{ color: theme.text, fontWeight: 'bold' }}>password123</Text>
            </Text>
          </View>
        </GlassCard>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerWrapper: {
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: Spacing.four,
    justifyContent: 'center',
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brandText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  loginCard: {
    padding: 20,
    borderRadius: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 11.5,
    fontWeight: '600',
    lineHeight: 16,
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 13,
    fontWeight: '600',
  },
  loginButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 18,
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  loginButtonText: {
    color: '#07090E',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  tipBox: {
    marginTop: 20,
    borderTopWidth: 1,
    paddingTop: 16,
    gap: 4,
  },
  tipTitle: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 10.5,
  },
});
