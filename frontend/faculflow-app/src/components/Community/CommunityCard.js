import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const MEMBER_AVATARS_MAX = 5;

export default function CommunityCard({ community, onPress }) {
  const {
    id, name, icon, member_count, is_open, is_hot, is_member,
  } = community;

  // Generate mock avatars based on member count
  const avatarCount = Math.min(member_count || 0, MEMBER_AVATARS_MAX);

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.85} onPress={onPress}>
      <LinearGradient
        colors={['#00897B', '#00695C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Hot Badge */}
        {is_hot && (
          <View style={styles.hotBadge}>
            <Text style={styles.hotBadgeText}>Em alta 🔥</Text>
          </View>
        )}

        {/* Emoji Icon */}
        <View style={styles.emojiContainer}>
          <Text style={styles.emoji}>{icon || '📚'}</Text>
        </View>

        {/* Name & Info */}
        <Text style={styles.name} numberOfLines={2}>{name}</Text>
        <Text style={styles.info}>
          {member_count || 0} membros · {is_open ? 'Aberto' : 'Fechado'}
        </Text>

        {/* Member Avatars */}
        <View style={styles.avatarRow}>
          {Array.from({ length: avatarCount }).map((_, i) => (
            <Image
              key={i}
              source={{ uri: `https://i.pravatar.cc/40?u=community-${id}-member-${i}` }}
              style={[styles.memberAvatar, { marginLeft: i > 0 ? -8 : 0 }]}
            />
          ))}
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={[styles.ctaButton, is_member && styles.ctaButtonMember]}
          activeOpacity={0.8}
          onPress={onPress}
        >
          <Text style={[styles.ctaText, is_member && styles.ctaTextMember]}>
            {is_member ? 'Entrar no papo' : 'Entrar no papo'}
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 6,
    borderRadius: 20,
    ...SHADOWS.medium,
    elevation: 6,
  },
  gradient: {
    borderRadius: 20,
    padding: 16,
    minHeight: 220,
    justifyContent: 'flex-end',
  },
  hotBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hotBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  emojiContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  emoji: {
    fontSize: 48,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 2,
  },
  info: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
    marginBottom: 8,
  },
  avatarRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  memberAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#00695C',
  },
  ctaButton: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  ctaButtonMember: {
    backgroundColor: '#FFF',
  },
  ctaText: {
    color: '#00695C',
    fontWeight: '700',
    fontSize: 14,
  },
  ctaTextMember: {
    color: '#00695C',
  },
});
