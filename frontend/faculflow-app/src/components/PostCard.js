import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

/**
 * Format a date string into a relative time like "há 5 min", "há 2h", "há 3 dias"
 */
function timeAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'agora';
  if (diffMin < 60) return `há ${diffMin} min`;
  if (diffHour < 24) return `há ${diffHour}h`;
  if (diffDay < 7) return `há ${diffDay} dia${diffDay > 1 ? 's' : ''}`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export default function PostCard({ post, onLikePress, onCommentPress, onBookmarkPress, onSharePress }) {
  const roleColor = post.is_calouro ? COLORS.accent : COLORS.primary;
  const roleLabel = post.is_calouro ? 'Calouro' : 'Veterano';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: roleColor }]}>
          <Text style={styles.avatarText}>
            {(post.author_name || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.authorName}>{post.author_name || 'Usuário'}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.badge, { backgroundColor: roleColor + '20' }]}>
              <Text style={[styles.badgeText, { color: roleColor }]}>
                {roleLabel}
              </Text>
            </View>
            {post.curso && (
              <Text style={styles.courseText}>• {post.curso}</Text>
            )}
            {post.created_at && (
              <Text style={styles.timeText}>• {timeAgo(post.created_at)}</Text>
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={18} color={COLORS.textLight} />
        </TouchableOpacity>
      </View>

      <Text style={styles.content}>{post.content}</Text>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerAction} onPress={onLikePress}>
          <Ionicons 
            name={post.is_liked ? "heart" : "heart-outline"} 
            size={18} 
            color={post.is_liked ? '#EF4444' : COLORS.textSecondary} 
          />
          <Text style={[styles.footerText, post.is_liked && { color: '#EF4444', fontWeight: '700' }]}>
            {post.likes_count || 0}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerAction} onPress={onCommentPress}>
          <Ionicons name="chatbubble-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.footerText}>{post.comments_count || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerAction} onPress={onSharePress}>
          <Ionicons name="share-social-outline" size={17} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.footerAction} onPress={onBookmarkPress}>
          <Ionicons 
            name={post.is_bookmarked ? "bookmark" : "bookmark-outline"} 
            size={17} 
            color={post.is_bookmarked ? COLORS.primary : COLORS.textSecondary} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.base,
    marginBottom: SIZES.md,
    ...SHADOWS.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: SIZES.subtitle,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
    marginLeft: SIZES.md,
  },
  authorName: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: SIZES.xs,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: SIZES.sm,
    paddingVertical: 2,
    borderRadius: SIZES.radiusFull,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  courseText: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
  },
  timeText: {
    fontSize: SIZES.caption,
    color: COLORS.textLight,
  },
  moreButton: {
    padding: SIZES.xs,
  },
  content: {
    fontSize: SIZES.bodyLg,
    color: COLORS.textPrimary,
    lineHeight: 22,
    marginBottom: SIZES.md,
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SIZES.md,
    gap: SIZES.lg,
    alignItems: 'center',
  },
  footerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.xs,
  },
  footerText: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
