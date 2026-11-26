import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

const AUTH_STORAGE_KEY = '@nexuscrm_session_auth_v2';

export type UserRole = 'Owner' | 'Admin' | 'Staff';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  badge: string;
  color: string;
  defaultQuota: number;
}

export const PRIMARY_ACCOUNTS: (UserAccount & { password: string })[] = [
  {
    id: 'acc-owner',
    name: 'Alexander Vance',
    email: 'owner@nexuscrm.com',
    role: 'Owner',
    title: 'Workspace Owner',
    badge: '👑 OWNER',
    color: '#F59E0B',
    defaultQuota: 1000000,
    password: 'owner123',
  },
  {
    id: 'acc-admin',
    name: 'Morgan Brooks',
    email: 'admin@nexuscrm.com',
    role: 'Admin',
    title: 'System Administrator',
    badge: '⚡ ADMIN',
    color: '#00F2FE',
    defaultQuota: 500000,
    password: 'admin123',
  },
  {
    id: 'acc-staff',
    name: 'Taylor Reed',
    email: 'staff@nexuscrm.com',
    role: 'Staff',
    title: 'Sales Associate',
    badge: '💼 STAFF',
    color: '#8B5CF6',
    defaultQuota: 250000,
    password: 'staff123',
  },
];

interface AuthContextType {
  isAuthenticated: boolean;
  userEmail: string | null;
  currentUser: UserAccount | null;
  userRole: UserRole | null;
  isLoading: boolean;
  isBiometricSupported: boolean;
  biometricName: string;
  primaryAccounts: (UserAccount & { password: string })[];
  login: (email: string, password: string) => Promise<boolean>;
  loginAsAccount: (role: UserRole) => Promise<boolean>;
  loginWithBiometrics: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [biometricName, setBiometricName] = useState('Biometrics');

  const resolveAccount = (email: string, role?: UserRole, name?: string): UserAccount => {
    const matched = PRIMARY_ACCOUNTS.find(a => a.email.toLowerCase() === email.toLowerCase());
    if (matched) {
      return {
        id: matched.id,
        name: matched.name,
        email: matched.email,
        role: matched.role,
        title: matched.title,
        badge: matched.badge,
        color: matched.color,
        defaultQuota: matched.defaultQuota,
      };
    }
    const resolvedRole = role || 'Staff';
    const resolvedName = name || email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return {
      id: `acc-${Date.now()}`,
      name: resolvedName,
      email,
      role: resolvedRole,
      title: resolvedRole === 'Owner' ? 'Workspace Owner' : resolvedRole === 'Admin' ? 'System Administrator' : 'Sales Associate',
      badge: resolvedRole === 'Owner' ? '👑 OWNER' : resolvedRole === 'Admin' ? '⚡ ADMIN' : '💼 STAFF',
      color: resolvedRole === 'Owner' ? '#F59E0B' : resolvedRole === 'Admin' ? '#00F2FE' : '#8B5CF6',
      defaultQuota: 250000,
    };
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Check biometrics hardware & enrollment
        if (Platform.OS !== 'web') {
          const hasHardware = await LocalAuthentication.hasHardwareAsync();
          const isEnrolled = await LocalAuthentication.isEnrolledAsync();

          if (hasHardware && isEnrolled) {
            setIsBiometricSupported(true);
            const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
            if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
              setBiometricName('Face ID');
            } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
              setBiometricName('Fingerprint');
            }
          }
        }

        // 2. Check saved session in AsyncStorage
        const savedSession = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          if (parsed?.authenticated && parsed?.email) {
            const acc = resolveAccount(parsed.email, parsed.role, parsed.name);
            setIsAuthenticated(true);
            setUserEmail(acc.email);
            setCurrentUser(acc);
          }
        }
      } catch (err) {
        console.warn('[AuthContext] Session init error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 400));

    const cleanEmail = email.trim().toLowerCase();
    const primary = PRIMARY_ACCOUNTS.find(a => a.email.toLowerCase() === cleanEmail);

    if (primary) {
      if (password !== primary.password) {
        setIsLoading(false);
        return false;
      }
      const acc = resolveAccount(primary.email, primary.role, primary.name);
      setIsAuthenticated(true);
      setUserEmail(acc.email);
      setCurrentUser(acc);
      await AsyncStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ authenticated: true, email: acc.email, role: acc.role, name: acc.name, lastLogin: new Date().toISOString() })
      ).catch(() => {});
      setIsLoading(false);
      return true;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setIsLoading(false);
      return false;
    }

    if (password.length >= 4) {
      const acc = resolveAccount(cleanEmail);
      setIsAuthenticated(true);
      setUserEmail(acc.email);
      setCurrentUser(acc);
      await AsyncStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ authenticated: true, email: acc.email, role: acc.role, name: acc.name, lastLogin: new Date().toISOString() })
      ).catch(() => {});
      setIsLoading(false);
      return true;
    }

    setIsLoading(false);
    return false;
  };

  const loginAsAccount = async (role: UserRole): Promise<boolean> => {
    const primary = PRIMARY_ACCOUNTS.find(a => a.role === role);
    if (!primary) return false;
    return login(primary.email, primary.password);
  };

  const loginWithBiometrics = async (): Promise<boolean> => {
    if (Platform.OS === 'web' || !isBiometricSupported) return false;

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Nexus CRM Cockpit',
        fallbackLabel: 'Use Password',
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        const primary = currentUser || PRIMARY_ACCOUNTS[0];
        setIsAuthenticated(true);
        setUserEmail(primary.email);
        setCurrentUser(primary);
        await AsyncStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({ authenticated: true, email: primary.email, role: primary.role, name: primary.name, lastLogin: new Date().toISOString() })
        ).catch(() => {});
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[AuthContext] Biometric login error:', err);
      return false;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (err) {
      console.warn('[AuthContext] Logout clear error:', err);
    }
    setIsAuthenticated(false);
    setUserEmail(null);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userEmail,
        currentUser,
        userRole: currentUser?.role || null,
        isLoading,
        isBiometricSupported,
        biometricName,
        primaryAccounts: PRIMARY_ACCOUNTS,
        login,
        loginAsAccount,
        loginWithBiometrics,
        logout,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
