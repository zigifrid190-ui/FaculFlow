import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

export default function Header({ title, subtitle, showLogo = false }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + SIZES.sm }]}>
      <View style={styles.content}>
        {showLogo && (
          <Image
            source={require('../../assets/logo-faculflow.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        )}
        {title && !showLogo && (
          <Text style={styles.title}>{title}</Text>
        )}
        {subtitle && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.small,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.md,
  },
  logo: {
    width: 140,
    height: 36,
  },
  title: {
    fontSize: SIZES.title,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  subtitle: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginLeft: 'auto',
  },
});
