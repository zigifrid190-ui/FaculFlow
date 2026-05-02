import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

export default function UserCard({ user, onPress }) {
  const roleColor = user.is_calouro ? COLORS.accent : COLORS.primary;
  const roleLabel = user.is_calouro ? 'Calouro' : 'Veterano';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.avatar, { backgroundColor: roleColor }]}>
        <Text style={styles.avatarText}>
          {(user.username || 'U').charAt(0).toUpperCase()}
        </Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {user.username}
        </Text>
        <Text style={styles.detail} numberOfLines={1}>
          {user.curso || 'Curso não informado'}
          {user.semestre ? ` • ${user.semestre}º sem.` : ''}
        </Text>
        <View style={[styles.badge, { backgroundColor: roleColor + '15' }]}>
          <Text style={[styles.badgeText, { color: roleColor }]}>
            {roleLabel}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.connectBtn}>
        <Ionicons name="person-add-outline" size={18} color={COLORS.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.base,
    marginBottom: SIZES.sm,
    ...SHADOWS.small,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: SIZES.title,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    marginLeft: SIZES.md,
  },
  name: {
    fontSize: SIZES.bodyLg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  detail: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SIZES.sm,
    paddingVertical: 2,
    borderRadius: SIZES.radiusFull,
    marginTop: SIZES.xs,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  connectBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
