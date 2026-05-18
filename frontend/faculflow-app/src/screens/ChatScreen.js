import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator, SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { chatAPI } from '../services/api';

export default function ChatScreen({ route, navigation }) {
  const { otherUser } = route.params;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  const fetchMessages = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const { data } = await chatAPI.getMessages(otherUser.id);
      setMessages(data.results || data);
    } catch (error) {
      console.warn('Could not load chat history:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages(true);

    const interval = setInterval(() => {
      fetchMessages(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [otherUser]);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    const originalText = text;
    setText('');
    try {
      await chatAPI.sendMessage(otherUser.id, originalText.trim());
      await fetchMessages(false);
    } catch (error) {
      console.error('Could not send message:', error);
      setText(originalText);
    } finally {
      setSending(false);
    }
  };

  const renderMessageItem = ({ item }) => {
    const isMe = item.sender !== otherUser.id;
    const date = new Date(item.created_at);
    const timeString = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther]}>
            {item.content}
          </Text>
          <Text style={[styles.timeText, isMe ? styles.timeTextMe : styles.timeTextOther]}>
            {timeString}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.secondary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={[styles.avatar, { backgroundColor: otherUser.is_calouro ? COLORS.accent : COLORS.primary }]}>
            <Text style={styles.avatarText}>
              {otherUser.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.headerUsername}>{otherUser.username}</Text>
            <Text style={styles.headerSubtitle}>
              {otherUser.is_calouro ? '📗 Calouro' : '🎓 Veterano'} • {otherUser.curso || 'Estudante'}
            </Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          inverted
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-ellipses-outline" size={48} color={COLORS.textLight} />
              <Text style={styles.emptyText}>Envie uma mensagem para iniciar o chat!</Text>
            </View>
          }
        />
      )}

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Mensagem..."
            placeholderTextColor={COLORS.textLight}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SIZES.xs,
    marginRight: SIZES.sm,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  avatarText: {
    color: '#fff',
    fontSize: SIZES.bodyLg,
    fontWeight: '700',
  },
  headerUsername: {
    fontSize: SIZES.bodyLg,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  headerSubtitle: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.lg,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: SIZES.md,
    width: '100%',
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: SIZES.radiusLg,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    ...SHADOWS.small,
  },
  bubbleMe: {
    backgroundColor: COLORS.primary,
    borderTopRightRadius: SIZES.xs,
  },
  bubbleOther: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: SIZES.xs,
  },
  messageText: {
    fontSize: SIZES.bodyLg,
    lineHeight: 20,
  },
  messageTextMe: {
    color: '#fff',
  },
  messageTextOther: {
    color: COLORS.textPrimary,
  },
  timeText: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeTextMe: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  timeTextOther: {
    color: COLORS.textLight,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 120,
    transform: [{ scaleY: -1 }],
  },
  emptyText: {
    color: COLORS.textLight,
    fontSize: SIZES.body,
    marginTop: SIZES.sm,
    textAlign: 'center',
    width: '80%',
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
    fontSize: SIZES.bodyLg,
    color: COLORS.textPrimary,
    maxHeight: 100,
    marginRight: SIZES.sm,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.textLight,
  },
});
