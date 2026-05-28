import React from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { CRMProvider } from '@/context/CRMContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <CRMProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="lead/add" options={{ presentation: 'modal' }} />
          <Stack.Screen name="lead/[id]" />
        </Stack>
      </ThemeProvider>
    </CRMProvider>
  );
}
