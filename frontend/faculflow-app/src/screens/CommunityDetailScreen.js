import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator, Image, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { communitiesAPI } from '../services/api';

export default function CommunityDetailScreen({ route, navigation }) {
  const { community } = route.params;
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [isMember, setIsMember] = useState(community.is_member || false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data } = await communitiesAPI.getMessages(community.id);
      setMessages(data.results || data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;
    setSending(true);
    try {
      await communitiesAPI.sendMessage(community.id, inputText.trim());
      setInputText('');
      setIsMember(true);
      // Refresh messages
      const { data } = await communitiesAPI.getMessages(community.id);
      setMessages(data.results || data);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleJoin = async () => {
    try {
      const { data } = await communitiesAPI.join(community.id);
      setIsMember(data.is_member);
    } catch (error) {
      console.error('Error joining community:', error);
    }
  };

  const handleReport = () => {
    Alert.alert(
      'Denunciar Quadro',
      'Tem certeza que deseja denunciar este quadro por irregularidade?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Denunciar',
          style: 'destructive',
          onPress: async () => {
            try {
              await communitiesAPI.report(community.id, 'outro', 'Denúncia pelo app');
              Alert.alert('Pronto', 'Sua denúncia foi registrada e será analisada.');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível registrar a denúncia.');
            }
          }
        }
      ]
    );
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'agora';
    if (diffMin < 60) return `${diffMin}min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    return `${diffD}d`;
  };

  const renderMessage = ({ item }) => (
    <View style={styles.messageCard}>
      <Image
        source={{ uri: `https://i.pravatar.cc/40?u=${item.author_id}` }}
        style={styles.messageAvatar}
      />
      <View style={styles.messageBody}>
        <View style={styles.messageHeader}>
          <Text style={styles.messageName}>{item.author_name}</Text>
          {item.author_curso && (
            <Text style={styles.messageCurso}>{item.author_curso}</Text>
          )}
          <Text style={styles.messageTime}>{formatTime(item.created_at)}</Text>
        </View>
        <Text style={styles.messageText}>{item.content}</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <LinearGradient
        colors={['#004D40', '#00695C']}
        style={[styles.header, { paddingTop: insets.top + SIZES.sm }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerEmoji}>{community.icon}</Text>
          <View>
            <Text style={styles.headerTitle} numberOfLines={1}>{community.name}</Text>
            <Text style={styles.headerSub}>
              {community.member_count || 0} membros · Aberto
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleJoin} style={styles.headerActionBtn}>
            <Ionicons
              name={isMember ? 'checkmark-circle' : 'add-circle-outline'}
              size={24}
              color="#FFF"
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleReport} style={styles.headerActionBtn}>
            <Ionicons name="flag-outline" size={22} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

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
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          inverted={false}
          ListEmptyComponent={
            <View style={styles.emptyMessages}>
              <Text style={styles.emptyEmoji}>{community.icon}</Text>
              <Text style={styles.emptyTitle}>Nenhuma mensagem ainda</Text>
              <Text style={styles.emptyText}>Seja o primeiro a iniciar a conversa!</Text>
            </View>
          }
        />
      )}

      {/* Input Bar */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={styles.textInput}
          placeholder="Escreva sua mensagem..."
          placeholderTextColor={COLORS.textLight}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!inputText.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
        >
          <Ionicons name="send" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.base,
    paddingBottom: SIZES.md,
  },
  backBtn: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
    gap: 10,
  },
  headerEmoji: {
    fontSize: 28,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  headerSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  headerActionBtn: {
    padding: 8,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  messagesList: {
    padding: SIZES.base,
    paddingBottom: 8,
  },
  messageCard: {
    flexDirection: 'row',
    marginBottom: SIZES.md,
    gap: 10,
  },
  messageAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  messageBody: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 12,
    ...SHADOWS.small,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  messageName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  messageCurso: {
    fontSize: 11,
    color: '#009688',
    fontWeight: '600',
    backgroundColor: '#E0F2F1',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  messageTime: {
    fontSize: 11,
    color: COLORS.textLight,
    marginLeft: 'auto',
  },
  messageText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },

  emptyMessages: {
    alignItems: 'center',
    marginTop: 80,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SIZES.md,
    paddingTop: 8,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.textPrimary,
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#009688',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
