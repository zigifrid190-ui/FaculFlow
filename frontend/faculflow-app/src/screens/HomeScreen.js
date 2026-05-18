import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, Image, Modal, TextInput, ActivityIndicator, Alert, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import Button from '../components/Button';
import CommentsModal from '../components/CommentsModal';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { postsAPI } from '../services/api';
import Skeleton from '../components/Common/Skeleton';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Pagination states
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Modal states
  const [isModalVisible, setModalVisible] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Comments modal states
  const [selectedPostForComments, setSelectedPostForComments] = useState(null);
  const [isCommentsModalVisible, setCommentsModalVisible] = useState(false);
  
  const renderSkeletons = () => (
    <View style={styles.skeletonList}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.skeletonCard}>
          <View style={styles.skeletonHeader}>
            <Skeleton width={40} height={40} borderRadius={20} />
            <View style={{ marginLeft: 12 }}>
              <Skeleton width={120} height={14} borderRadius={4} />
              <Skeleton width={80} height={10} borderRadius={4} style={{ marginTop: 6 }} />
            </View>
          </View>
          <Skeleton width="100%" height={16} borderRadius={4} style={{ marginTop: 16 }} />
          <Skeleton width="90%" height={16} borderRadius={4} style={{ marginTop: 8 }} />
          <Skeleton width="60%" height={16} borderRadius={4} style={{ marginTop: 8 }} />
        </View>
      ))}
    </View>
  );

  const fetchPosts = async (isRefresh = false, showAlert = false) => {
    if (!isRefresh && !loading) {
      setLoadingMore(true);
    }
    try {
      const cursor = isRefresh ? '' : (nextCursor || '');
      const { data } = await postsAPI.getAll(cursor);
      
      const newPosts = data.results || data; // Handle paginated vs non-paginated gracefully
      
      if (isRefresh) {
        setPosts(newPosts);
      } else {
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const filteredNew = newPosts.filter(p => !existingIds.has(p.id));
          return [...prev, ...filteredNew];
        });
      }
      
      // Extract next cursor string from URL if present
      if (data.next) {
        const urlParams = new URLSearchParams(data.next.split('?')[1]);
        setNextCursor(urlParams.get('cursor'));
      } else {
        setNextCursor(null);
      }
    } catch (error) {
      console.warn('Error fetching posts:', error?.message);
      if (showAlert) {
        Alert.alert('Erro de conexão', 'Não foi possível carregar o feed. Verifique sua conexão e tente novamente.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPosts(true);
  }, []);

  const handleLoadMore = () => {
    if (nextCursor && !loadingMore && !loading && !refreshing) {
      fetchPosts(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setNextCursor(null);
    fetchPosts(true, false);
  }, []);

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    
    setIsSubmitting(true);
    try {
      await postsAPI.create({ content: newPostContent.trim() });
      setNewPostContent('');
      setModalVisible(false);
      onRefresh(); // Refresh feed after posting
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Erro', 'Não foi possível publicar sua dica.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikePost = async (postId) => {
    // Optimistic update
    setPosts(prevPosts => prevPosts.map(p => {
      if (p.id === postId) {
        const liked = !p.liked_by_user;
        return {
          ...p,
          liked_by_user: liked,
          likes_count: p.likes_count + (liked ? 1 : -1)
        };
      }
      return p;
    }));

    try {
      await postsAPI.toggleLike(postId);
    } catch (error) {
      console.warn('Error liking post:', error);
      onRefresh(); // Revert
    }
  };

  const handleBookmarkPost = async (postId) => {
    // Optimistic update
    setPosts(prevPosts => prevPosts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          bookmarked_by_user: !p.bookmarked_by_user
        };
      }
      return p;
    }));

    try {
      await postsAPI.toggleBookmark(postId);
    } catch (error) {
      console.warn('Error bookmarking post:', error);
      onRefresh(); // Revert
    }
  };

  const handleOpenComments = (post) => {
    setSelectedPostForComments(post);
    setCommentsModalVisible(true);
  };

  const handleSharePost = async (post) => {
    try {
      const shareMessage = `Dica de ${post.author_name} no FaculFlow:\n\n"${post.content}"\n\nBaixe o FaculFlow para ver mais!`;
      const { Share } = require('react-native');
      await Share.share({
        message: shareMessage,
      });
    } catch (error) {
      console.warn('Error sharing post:', error);
    }
  };

  const renderHeader = () => (
    <View>
      <View style={[styles.header, { paddingTop: insets.top + SIZES.sm }]}>
        <Image source={require('../../assets/logo-faculflow.png')} style={styles.logo} resizeMode="contain" />
        <TouchableOpacity style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={24} color={COLORS.secondary} />
          <View style={styles.notifDot} />
        </TouchableOpacity>
      </View>

      <View style={styles.banner}>
        <View style={styles.bannerContent}>
          <Text style={styles.bannerHi}>Olá, {user?.username || 'Estudante'}! 👋</Text>
          <Text style={styles.bannerSub}>Descubra dicas, conecte-se{'\n'}com mentores e cresça</Text>
          <TouchableOpacity style={styles.bannerBtn}>
            <Text style={styles.bannerBtnText}>Explorar</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.secondary} />
          </TouchableOpacity>
        </View>
        <Ionicons name="school" size={64} color="rgba(255,255,255,0.3)" />
      </View>

      <View style={styles.quickRow}>
        {[
          { icon: 'create-outline', label: 'Nova Dica', bg: COLORS.primaryLight, fg: COLORS.primary, onPress: () => setModalVisible(true) },
          { icon: 'people-outline', label: 'Mentores', bg: COLORS.accentLight, fg: COLORS.accent, onPress: () => navigation.navigate('Conectar') },
          { icon: 'chatbubbles-outline', label: 'Grupos', bg: '#EDE9FE', fg: '#7C3AED', onPress: () => navigation.navigate('Comunidade') },
          { icon: 'calendar-outline', label: 'Eventos', bg: '#DBEAFE', fg: '#2563EB', onPress: () => {} },
        ].map((q, i) => (
          <TouchableOpacity key={i} style={styles.quickItem} onPress={q.onPress}>
            <View style={[styles.quickIcon, { backgroundColor: q.bg }]}>
              <Ionicons name={q.icon} size={22} color={q.fg} />
            </View>
            <Text style={styles.quickLabel}>{q.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.feedHead}>
        <Text style={styles.feedTitle}>📌 Últimas dicas</Text>
        <TouchableOpacity><Text style={styles.seeAll}>Ver tudo</Text></TouchableOpacity>
      </View>
      {loading && renderSkeletons()}
    </View>
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={loading ? [] : posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <PostCard 
            post={item} 
            onLikePress={() => handleLikePost(item.id)}
            onBookmarkPress={() => handleBookmarkPost(item.id)}
            onCommentPress={() => handleOpenComments(item)}
            onSharePress={() => handleSharePost(item)}
          />
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: SIZES.md }} /> : null}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhuma dica encontrada. Seja o primeiro a postar!</Text>
            </View>
          )
        }
      />
      
      <TouchableOpacity style={[styles.fab, { bottom: SIZES.lg }]} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Create Post Modal */}
      <Modal visible={isModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={[styles.modalContainer, { paddingTop: Platform.OS === 'ios' ? SIZES.md : insets.top + SIZES.md }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={28} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nova Dica</Text>
            <View style={{ width: 28 }} />
          </View>
          
          <TextInput
            style={styles.postInput}
            placeholder="Compartilhe uma dica ou dúvida com a comunidade..."
            placeholderTextColor={COLORS.textLight}
            multiline
            autoFocus
            value={newPostContent}
            onChangeText={setNewPostContent}
            maxLength={1000}
          />
          
          <View style={styles.modalFooter}>
            <Text style={styles.charCount}>{newPostContent.length}/1000</Text>
            <Button 
              title="Publicar" 
              onPress={handleCreatePost} 
              disabled={!newPostContent.trim() || isSubmitting}
              loading={isSubmitting}
            />
          </View>
        </View>
      </Modal>

      {/* Comments Drawer Modal */}
      <CommentsModal
        visible={isCommentsModalVisible}
        post={selectedPostForComments}
        onClose={() => {
          setCommentsModalVisible(false);
          setSelectedPostForComments(null);
        }}
        onCommentAdded={onRefresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  list: { paddingHorizontal: SIZES.base, paddingBottom: SIZES.xxxl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SIZES.xs, paddingBottom: SIZES.md, backgroundColor: COLORS.surface, marginHorizontal: -SIZES.base, paddingLeft: SIZES.lg, paddingRight: SIZES.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  logo: { width: 130, height: 34 },
  notifBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  notifDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent },
  banner: { backgroundColor: COLORS.primary, borderRadius: SIZES.radiusXl, padding: SIZES.xl, flexDirection: 'row', alignItems: 'center', marginTop: SIZES.base, marginBottom: SIZES.base, overflow: 'hidden' },
  bannerContent: { flex: 1 },
  bannerHi: { fontSize: SIZES.subtitle, fontWeight: '700', color: '#fff', marginBottom: SIZES.xs },
  bannerSub: { fontSize: SIZES.body, color: 'rgba(255,255,255,0.85)', lineHeight: 20, marginBottom: SIZES.md },
  bannerBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#fff', paddingHorizontal: SIZES.base, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusFull, gap: SIZES.xs },
  bannerBtnText: { fontSize: SIZES.body, fontWeight: '600', color: COLORS.secondary },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SIZES.lg, paddingHorizontal: SIZES.xs },
  quickItem: { alignItems: 'center', flex: 1 },
  quickIcon: { width: 52, height: 52, borderRadius: SIZES.radiusMd, alignItems: 'center', justifyContent: 'center', marginBottom: SIZES.xs },
  quickLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, textAlign: 'center' },
  feedHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.md, paddingHorizontal: SIZES.xs },
  feedTitle: { fontSize: SIZES.subtitle, fontWeight: '700', color: COLORS.secondary },
  seeAll: { fontSize: SIZES.body, color: COLORS.primary, fontWeight: '600' },
  fab: { position: 'absolute', right: SIZES.lg, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', ...SHADOWS.large },
  emptyContainer: { padding: SIZES.xl, alignItems: 'center' },
  emptyText: { color: COLORS.textLight, textAlign: 'center', fontSize: SIZES.bodyLg },
  
  // Modal styles
  modalContainer: { flex: 1, backgroundColor: COLORS.surface },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SIZES.lg, paddingBottom: SIZES.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { fontSize: SIZES.title, fontWeight: '700', color: COLORS.secondary },
  postInput: { flex: 1, padding: SIZES.lg, fontSize: SIZES.bodyLg, color: COLORS.textPrimary, textAlignVertical: 'top' },
  modalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SIZES.lg, borderTopWidth: 1, borderTopColor: COLORS.border },
  charCount: { color: COLORS.textLight, fontSize: SIZES.caption },
  skeletonList: { marginTop: SIZES.sm },
  skeletonCard: { backgroundColor: COLORS.surface, padding: SIZES.lg, borderRadius: SIZES.radiusLg, marginBottom: SIZES.md, ...SHADOWS.small },
  skeletonHeader: { flexDirection: 'row', alignItems: 'center' },
});
