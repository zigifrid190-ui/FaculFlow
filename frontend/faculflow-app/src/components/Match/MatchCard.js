import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import TagPill from './TagPill';
import ActionButtons from './ActionButtons';

export default function MatchCard({ profile, onSkip, onConnect }) {
  if (!profile) return null;

  return (
    <View style={styles.card}>
      {/* Avatar Header */}
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: `https://i.pravatar.cc/150?u=${profile.id}` }}
          style={styles.avatar}
        />
      </View>

      {/* Profile Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.nameText}>{profile.username}</Text>

        <View style={styles.badgeRow}>
          <View style={[styles.badge, profile.is_calouro ? styles.badgeCalouro : styles.badgeVeterano]}>
            <Text style={styles.badgeText}>
              {profile.is_calouro ? 'Calouro' : 'Veterano'}
            </Text>
          </View>
          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
        </View>

        <Text style={styles.detailsText}>Curso: {profile.curso || 'Engenharia'}</Text>
        <Text style={styles.detailsText}>Período: {profile.semestre}º período</Text>

        <Text style={styles.bioText} numberOfLines={4}>
          {profile.bio || 'Sem descrição no momento. Buscando fazer networking e trocar conhecimentos na plataforma!'}
        </Text>

        {/* Tags */}
        <View style={styles.tagsContainer}>
          {profile.tags && profile.tags.length > 0 ? (
            profile.tags.map((tag, idx) => (
              <TagPill key={tag.id} name={tag.name} isPrimary={idx === 0} />
            ))
          ) : (
            <>
              <TagPill name="Matemática" isPrimary />
              <TagPill name="Projetos" />
              <TagPill name="Dúvidas de TCC" />
            </>
          )}
        </View>

        {/* Rating */}
        <View style={styles.ratingRow}>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map(star => (
              <Ionicons key={star} name="star" size={18} color="#FFC107" />
            ))}
          </View>
          <Text style={styles.ratingText}>
            <Text style={{ fontWeight: '700' }}>{profile.rating > 0 ? profile.rating : '4.8'}</Text> Avaliações ({profile.reviews_count > 0 ? profile.reviews_count : '128'})
          </Text>
        </View>
      </View>

      {/* Actions */}
      <ActionButtons onSkip={onSkip} onConnect={onConnect} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    width: '100%',
    padding: SIZES.lg,
    paddingTop: 60,
    position: 'relative',
    ...SHADOWS.medium,
    elevation: 8,
  },
  avatarContainer: {
    position: 'absolute',
    top: -50,
    alignSelf: 'center',
    borderRadius: 20,
    backgroundColor: '#FFF',
    padding: 4,
    ...SHADOWS.medium,
    elevation: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 16,
  },
  infoContainer: {
    marginTop: SIZES.md,
  },
  nameText: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.secondary,
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
  },
  badgeVeterano: { backgroundColor: '#009688' },
  badgeCalouro: { backgroundColor: '#FF9800' },
  badgeText: { color: '#FFF', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  detailsText: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '500', marginBottom: 2 },
  bioText: { fontSize: 14, color: COLORS.textSecondary, marginTop: SIZES.sm, lineHeight: 20 },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SIZES.md,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.lg,
    paddingTop: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  stars: { flexDirection: 'row', marginRight: 8 },
  ratingText: { fontSize: 14, color: COLORS.textPrimary },
});
