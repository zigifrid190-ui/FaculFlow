import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import UserCard from '../components/UserCard';
import { COLORS, SIZES } from '../constants/theme';
import { usersAPI } from '../services/api';

export default function ConnectScreen() {
  const insets = useSafeAreaInsets();
  
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, calouro, veterano
  const [loading, setLoading] = useState(true);

  // Use debounce for search API to avoid too many requests
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers(search);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const fetchUsers = async (searchQuery) => {
    setLoading(true);
    try {
      const { data } = await usersAPI.getAll(searchQuery);
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter the fetched users locally based on the chip selection
  const filteredUsers = users.filter((u) => {
    if (filter === 'calouro') return u.is_calouro;
    if (filter === 'veterano') return !u.is_calouro;
    return true; // 'all'
  });

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + SIZES.sm }]}>
        <Text style={styles.title}>🔗 Conectar</Text>
        <Text style={styles.subtitle}>Encontre mentores e colegas</Text>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color={COLORS.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nome ou curso..."
            placeholderTextColor={COLORS.textLight}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRow}>
          {['all', 'veterano', 'calouro'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'all' ? 'Todos' : f === 'veterano' ? '🎓 Veteranos' : '📗 Calouros'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <UserCard user={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color={COLORS.textLight} />
              <Text style={styles.emptyText}>Nenhum usuário encontrado</Text>
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
  subtitle: { fontSize: SIZES.body, color: COLORS.textSecondary, marginTop: 2, marginBottom: SIZES.md },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: SIZES.radiusMd, paddingHorizontal: SIZES.md, height: 44, gap: SIZES.sm },
  searchInput: { flex: 1, fontSize: SIZES.body, color: COLORS.textPrimary },
  filterRow: { flexDirection: 'row', gap: SIZES.sm, marginTop: SIZES.md },
  filterChip: { paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border },
  filterActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: SIZES.caption, fontWeight: '600', color: COLORS.textSecondary },
  filterTextActive: { color: '#fff' },
  list: { padding: SIZES.base },
  empty: { alignItems: 'center', marginTop: 80, gap: SIZES.md },
  emptyText: { fontSize: SIZES.bodyLg, color: COLORS.textLight },
});
