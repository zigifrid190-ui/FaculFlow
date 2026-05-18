import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';

export default function TagPill({ name, isPrimary }) {
  return (
    <View style={[styles.container, isPrimary && styles.primaryContainer]}>
      <Text style={[styles.text, isPrimary && styles.primaryText]}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  primaryContainer: {
    backgroundColor: '#E0F2F1',
  },
  text: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  primaryText: {
    color: '#00796B',
    fontWeight: '700',
  },
});
