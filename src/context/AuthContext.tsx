import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

const AUTH_STORAGE_KEY = '@nexuscrm_session_auth_v1';

interface AuthContextType {
  isAuthenticated: boolean;
  userEmail: string | null;
  isLoading: boolean;
  isBiometricSupported: boolean;
  biometricName: string;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithBiometrics: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [biometricName, setBiometricName] = useState('Biometrics');

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
            setIsAuthenticated(true);
            setUserEmail(parsed.email);
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
    await new Promise(resolve => setTimeout(resolve, 600));

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setIsLoading(false);
      return false;
    }

    if (password.length >= 4) {
      setIsAuthenticated(true);
      setUserEmail(email);
      await AsyncStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ authenticated: true, email, lastLogin: new Date().toISOString() })
      ).catch(() => {});
      setIsLoading(false);
      return true;
    }

    setIsLoading(false);
    return false;
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
        const defaultEmail = userEmail || 'admin@nexuscrm.com';
        setIsAuthenticated(true);
        setUserEmail(defaultEmail);
        await AsyncStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({ authenticated: true, email: defaultEmail, lastLogin: new Date().toISOString() })
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
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userEmail,
        isLoading,
        isBiometricSupported,
        biometricName,
        login,
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
