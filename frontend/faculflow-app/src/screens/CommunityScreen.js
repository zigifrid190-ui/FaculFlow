import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { communitiesAPI } from '../services/api';
import CommunityCard from '../components/Community/CommunityCard';
import FilterChips from '../components/Community/FilterChips';
import CreateCommunityModal from '../components/Community/CreateCommunityModal';

import Skeleton from '../components/Common/Skeleton';

export default function CommunityScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Helper for skeleton grid
  const renderSkeletons = () => (
    <View style={styles.skeletonGrid}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <View key={i} style={styles.skeletonCard}>
          <Skeleton width="100%" height={120} borderRadius={SIZES.radiusMd} />
          <Skeleton width="80%" height={16} borderRadius={4} style={{ marginTop: 8 }} />
          <Skeleton width="40%" height={12} borderRadius={4} style={{ marginTop: 6 }} />
        </View>
      ))}
    </View>
  );

  useEffect(() => {
    fetchCommunities();
  }, [activeFilter]);

  const fetchCommunities = async () => {
    try {
      // If filter is 'membros', send as ordering param. Otherwise as category.
      let category = '';
      let ordering = 'hot';
      if (activeFilter === 'membros') {
        ordering = 'membros';
      } else if (activeFilter) {
        category = activeFilter;
      }
      const { data } = await communitiesAPI.getAll(category, ordering);
      setCommunities(data.results || data);
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCommunities();
  }, [activeFilter]);

  const handleCreateCommunity = async (data) => {
    const response = await communitiesAPI.create(data);
    // Refresh list
    fetchCommunities();
    return response;
  };

  const handleCardPress = (community) => {
    navigation.navigate('CommunityDetail', { community });
  };

  const renderHeader = () => (
    <View>
      {/* Header with greeting */}
      <View style={[styles.headerSection, { paddingTop: insets.top + SIZES.md }]}>
        <LinearGradient
          colors={['#004D40', '#00695C', '#00897B']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Comunidade</Text>
            <Text style={styles.greetingSub}>Quadros de discussão abertos</Text>
          </View>
          <TouchableOpacity style={styles.searchBtn}>
            <Ionicons name="search" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Section Title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Minhas Comunidades</Text>
        <Ionicons name="chevron-down" size={20} color={COLORS.textPrimary} />
      </View>

      {/* Filter Chips */}
      <FilterChips
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />
    </View>
  );


  return (
    <View style={styles.root}>
      <FlatList
        data={loading ? [] : communities}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        ListHeaderComponent={
          <View>
            {renderHeader()}
            {loading && renderSkeletons()}
          </View>
        }
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        renderItem={({ item }) => (
          <CommunityCard
            community={item}
            onPress={() => handleCardPress(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>Nenhum quadro ainda</Text>
            <Text style={styles.emptyText}>Seja o primeiro a criar um!</Text>
          </View>
        }
      />

      {/* FAB - Create Community */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        onPress={() => setShowCreateModal(true)}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#00897B', '#004D40']}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Create Modal */}
      <CreateCommunityModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateCommunity}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },

  headerSection: {
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.lg,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFF',
  },
  greetingSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
    paddingTop: SIZES.lg,
    paddingBottom: SIZES.xs,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },

  listContent: {
    paddingBottom: 100,
  },
  columnWrapper: {
    paddingHorizontal: SIZES.md,
  },

  empty: {
    alignItems: 'center',
    marginTop: 80,
    gap: 8,
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

  fab: {
    position: 'absolute',
    right: 20,
    ...SHADOWS.large,
    elevation: 10,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SIZES.md,
    gap: SIZES.md,
  },
  skeletonCard: {
    width: '47%',
    marginBottom: SIZES.md,
  },
});
