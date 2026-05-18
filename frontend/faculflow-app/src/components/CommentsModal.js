import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, FlatList, TextInput,
  TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { postsAPI } from '../services/api';

export default function CommentsModal({ visible, post, onClose, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState(null); // { id: commentId, username: authorName }

  const fetchComments = async () => {
    if (!post) return;
    setLoading(true);
    try {
      const { data } = await postsAPI.getComments(post.id);
      setComments(data.results || data);
    } catch (error) {
      console.warn('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && post) {
      fetchComments();
    } else {
      setComments([]);
      setCommentText('');
      setReplyTo(null);
    }
  }, [visible, post]);

  const handleSendComment = async () => {
    if (!commentText.trim() || !post) return;
    setSubmitting(true);
    try {
      await postsAPI.addComment(post.id, commentText.trim(), replyTo?.id);
      setCommentText('');
      setReplyTo(null);
      await fetchComments();
      if (onCommentAdded) onCommentAdded();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderCommentItem = ({ item }) => {
    const isPostAuthor = post.author_name === item.author_name;

    return (
      <View style={styles.commentContainer}>
        {/* Comment Card */}
        <View style={styles.commentCard}>
          <View style={[styles.avatar, { backgroundColor: isPostAuthor ? COLORS.primary : COLORS.secondary }]}>
            <Text style={styles.avatarText}>
              {(item.author_name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.commentContent}>
            <View style={styles.commentHeader}>
              <Text style={styles.authorName}>{item.author_name}</Text>
              {isPostAuthor && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Autor</Text>
                </View>
              )}
            </View>
            <Text style={styles.contentText}>{item.content}</Text>
            
            <View style={styles.commentFooter}>
              <TouchableOpacity 
                style={styles.replyButton} 
                onPress={() => setReplyTo({ id: item.id, username: item.author_name })}
              >
                <Text style={styles.replyButtonText}>Responder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Nested Replies */}
        {item.replies && item.replies.map((reply) => {
          const isReplyAuthor = post.author_name === reply.author_name;
          return (
            <View key={reply.id} style={styles.replyCard}>
              <View style={[styles.avatarSmall, { backgroundColor: isReplyAuthor ? COLORS.primary : COLORS.secondary }]}>
                <Text style={styles.avatarTextSmall}>
                  {(reply.author_name || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.replyContent}>
                <View style={styles.commentHeader}>
                  <Text style={styles.authorName}>{reply.author_name}</Text>
                  {isReplyAuthor && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>Autor</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.contentText}>{reply.content}</Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.container}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="chevron-down" size={26} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>Comentários</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Post content summary */}
          {post && (
            <View style={styles.postSummary}>
              <Text style={styles.postSummaryAuthor}>📌 Dica de {post.author_name}</Text>
              <Text numberOfLines={2} style={styles.postSummaryContent}>{post.content}</Text>
            </View>
          )}

          {/* Comments List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderCommentItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="chatbubbles-outline" size={48} color={COLORS.textLight} />
                  <Text style={styles.emptyText}>Sem comentários ainda. Comece a conversa!</Text>
                </View>
              }
            />
          )}

          {/* Reply indicator */}
          {replyTo && (
            <View style={styles.replyIndicator}>
              <Text style={styles.replyIndicatorText}>
                Respondendo a <Text style={{ fontWeight: '600' }}>@{replyTo.username}</Text>
              </Text>
              <TouchableOpacity onPress={() => setReplyTo(null)}>
                <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>
          )}

          {/* Input Bar */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={replyTo ? `Responder a @${replyTo.username}...` : "Adicione um comentário..."}
              placeholderTextColor={COLORS.textLight}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              style={[styles.sendButton, !commentText.trim() && styles.sendButtonDisabled]} 
              onPress={handleSendComment}
              disabled={!commentText.trim() || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '80%',
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    padding: SIZES.xs,
  },
  title: {
    fontSize: SIZES.title,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  postSummary: {
    padding: SIZES.md,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  postSummaryAuthor: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  postSummaryContent: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: SIZES.md,
    paddingBottom: SIZES.xxxl,
  },
  commentContainer: {
    marginBottom: SIZES.lg,
  },
  commentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  avatarText: {
    color: '#fff',
    fontSize: SIZES.body,
    fontWeight: '700',
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  authorName: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginRight: SIZES.sm,
  },
  badge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SIZES.sm,
    paddingVertical: 2,
    borderRadius: SIZES.radiusFull,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.primary,
  },
  contentText: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  commentFooter: {
    flexDirection: 'row',
    marginTop: SIZES.xs,
  },
  replyButton: {
    paddingVertical: 2,
    paddingRight: SIZES.sm,
  },
  replyButtonText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  replyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginLeft: 48,
    marginTop: SIZES.md,
    paddingLeft: SIZES.sm,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.border,
  },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.sm,
  },
  avatarTextSmall: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  replyContent: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    color: COLORS.textLight,
    fontSize: SIZES.body,
    marginTop: SIZES.sm,
    textAlign: 'center',
  },
  replyIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.xs,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  replyIndicatorText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingBottom: Platform.OS === 'ios' ? 24 : SIZES.sm,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radiusLg,
    paddingHorizontal: SIZES.md,
    paddingVertical: 8,
    fontSize: SIZES.body,
    color: COLORS.textPrimary,
    maxHeight: 80,
    marginRight: SIZES.sm,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.textLight,
  },
});
