import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { communitiesAPI } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      const { data } = await communitiesAPI.getAll();
      setCommunities(data);
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderGroup = ({ item }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
      <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
        <Text style={styles.emoji}>{item.icon}</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardMembers}>{item.member_count} membros</Text>
      </View>
      <TouchableOpacity style={styles.joinBtn}>
        <Text style={styles.joinText}>Entrar</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + SIZES.sm }]}>
        <Text style={styles.title}>👥 Comunidade</Text>
        <Text style={styles.subtitle}>Grupos por curso e temas</Text>
      </View>

      {loading ? (
        <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={communities}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderGroup}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color={COLORS.textLight} />
              <Text style={styles.emptyText}>Nenhuma comunidade encontrada</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.surface, paddingHorizontal: SIZES.lg, paddingBottom: SIZES.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontSize: SIZES.heading, fontWeight: '700', color: COLORS.secondary },
  subtitle: { fontSize: SIZES.body, color: COLORS.textSecondary, marginTop: 2 },
  list: { padding: SIZES.base },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg, padding: SIZES.base, marginBottom: SIZES.sm, ...SHADOWS.small },
  iconBox: { width: 48, height: 48, borderRadius: SIZES.radiusMd, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 24 },
  cardInfo: { flex: 1, marginLeft: SIZES.md },
  cardTitle: { fontSize: SIZES.bodyLg, fontWeight: '600', color: COLORS.textPrimary },
  cardMembers: { fontSize: SIZES.caption, color: COLORS.textSecondary, marginTop: 2 },
  joinBtn: { paddingHorizontal: SIZES.base, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.primaryLight },
  joinText: { fontSize: SIZES.caption, fontWeight: '600', color: COLORS.primary },
  empty: { alignItems: 'center', marginTop: 80, gap: SIZES.md },
  emptyText: { fontSize: SIZES.bodyLg, color: COLORS.textLight },
});
