import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, updateUser } = useAuth();
  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = async () => {
    try {
      const { data } = await usersAPI.getProfile();
      setProfile(data);
    } catch (error) {
      console.warn('Could not refresh profile:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfile();
  }, []);

  const roleColor = profile?.is_calouro ? COLORS.accent : COLORS.primary;
  const roleLabel = profile?.is_calouro ? '📗 Calouro' : '🎓 Veterano';

  const handleLogout = () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair? Você precisará fazer login novamente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: logout },
      ]
    );
  };

  const menuItems = [
    { icon: 'person-outline', label: 'Editar perfil', color: COLORS.primary, subtitle: 'Atualize suas informações' },
    { icon: 'bookmark-outline', label: 'Salvos', color: '#7C3AED', subtitle: 'Dicas que você salvou' },
    { icon: 'notifications-outline', label: 'Notificações', color: COLORS.accent, subtitle: 'Gerenciar alertas' },
    { icon: 'shield-checkmark-outline', label: 'Privacidade', color: '#10B981', subtitle: 'Configurações de segurança' },
    { icon: 'help-circle-outline', label: 'Ajuda', color: '#2563EB', subtitle: 'Dúvidas frequentes' },
    { icon: 'information-circle-outline', label: 'Sobre o Faculflow', color: COLORS.textSecondary, subtitle: 'Versão e informações' },
  ];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: SIZES.xxxl }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
    >
      {/* Profile Header */}
      <View style={[styles.profileHeader, { paddingTop: insets.top + SIZES.lg }]}>
        <View style={[styles.avatar, { backgroundColor: roleColor }]}>
          <Text style={styles.avatarText}>
            {(profile?.username || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.userName}>{profile?.username || 'Usuário'}</Text>
        <Text style={styles.userEmail}>{profile?.email || ''}</Text>
        <View style={styles.metaRow}>
          <View style={[styles.badge, { backgroundColor: roleColor + '20' }]}>
            <Text style={[styles.badgeText, { color: roleColor }]}>{roleLabel}</Text>
          </View>
          {profile?.curso && (
            <Text style={styles.courseLabel}>• {profile.curso}</Text>
          )}
          {profile?.semestre && (
            <Text style={styles.courseLabel}>• {profile.semestre}º sem.</Text>
          )}
        </View>

        {profile?.bio ? (
          <Text style={styles.bio}>{profile.bio}</Text>
        ) : null}
      </View>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Configurações</Text>
        {menuItems.map((item, i) => (
          <TouchableOpacity key={i} style={styles.menuItem} activeOpacity={0.7}>
            <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
              <Ionicons name={item.icon} size={20} color={item.color} />
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Faculflow v1.0.0 • MVP</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  profileHeader: { backgroundColor: COLORS.surface, alignItems: 'center', paddingBottom: SIZES.xl, paddingHorizontal: SIZES.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  avatar: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: SIZES.md, ...SHADOWS.medium },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: '700' },
  userName: { fontSize: SIZES.title, fontWeight: '700', color: COLORS.secondary },
  userEmail: { fontSize: SIZES.body, color: COLORS.textSecondary, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: SIZES.sm, gap: SIZES.xs, flexWrap: 'wrap', justifyContent: 'center' },
  badge: { paddingHorizontal: SIZES.md, paddingVertical: 4, borderRadius: SIZES.radiusFull },
  badgeText: { fontSize: 13, fontWeight: '600' },
  courseLabel: { fontSize: SIZES.caption, color: COLORS.textSecondary },
  bio: { fontSize: SIZES.body, color: COLORS.textSecondary, textAlign: 'center', marginTop: SIZES.md, lineHeight: 20, paddingHorizontal: SIZES.xl },
  menuSection: { marginTop: SIZES.base, paddingHorizontal: SIZES.base },
  sectionTitle: { fontSize: SIZES.caption, fontWeight: '700', color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 1, marginBottom: SIZES.sm, paddingLeft: SIZES.xs },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, padding: SIZES.base, borderRadius: SIZES.radiusMd, marginBottom: SIZES.sm, ...SHADOWS.small },
  menuIcon: { width: 40, height: 40, borderRadius: SIZES.radiusMd, alignItems: 'center', justifyContent: 'center', marginRight: SIZES.md },
  menuInfo: { flex: 1 },
  menuLabel: { fontSize: SIZES.bodyLg, fontWeight: '500', color: COLORS.textPrimary },
  menuSubtitle: { fontSize: SIZES.caption, color: COLORS.textLight, marginTop: 1 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SIZES.sm, marginTop: SIZES.lg, marginHorizontal: SIZES.base, padding: SIZES.base, borderRadius: SIZES.radiusMd, borderWidth: 1.5, borderColor: COLORS.error + '30', backgroundColor: COLORS.errorLight },
  logoutText: { fontSize: SIZES.bodyLg, fontWeight: '600', color: COLORS.error },
  version: { textAlign: 'center', fontSize: SIZES.caption, color: COLORS.textLight, marginTop: SIZES.lg },
});
