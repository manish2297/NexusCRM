import React from 'react';
import { View, StyleSheet, Image, ViewStyle, StyleProp } from 'react-native';

interface NexusLogoProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export default function NexusLogo({ size = 44, style }: NexusLogoProps) {
  const borderRadius = Math.round(size * 0.24);
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Image
        source={require('@/assets/images/nexus-logo.png')}
        style={{ width: size, height: size, borderRadius }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
