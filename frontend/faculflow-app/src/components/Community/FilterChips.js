import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';

const FILTERS = [
  { key: '', label: 'Todos' },
  { key: 'curso', label: 'Curso' },
  { key: 'ano', label: 'Ano' },
  { key: 'membros', label: 'Membros' },
];

export default function FilterChips({ activeFilter, onFilterChange }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {FILTERS.map((filter) => {
        const isActive = activeFilter === filter.key;
        return (
          <TouchableOpacity
            key={filter.key}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onFilterChange(filter.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.sm,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E8E8E8',
  },
  chipActive: {
    backgroundColor: '#009688',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: '#FFF',
  },
});
