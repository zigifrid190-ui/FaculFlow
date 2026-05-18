import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  ActivityIndicator, RefreshControl, Animated, Image, Modal, TextInput, Switch
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usersAPI, chatAPI, tagsAPI, matchAPI } from '../services/api';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Edit Profile States
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editCurso, setEditCurso] = useState('');
  const [editSemestre, setEditSemestre] = useState('');
  const [editIsCalouro, setEditIsCalouro] = useState(true);
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [saving, setSaving] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);

  // Connection states
  const [connections, setConnections] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [pendingReceived, setPendingReceived] = useState([]);
  const [pendingSent, setPendingSent] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

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

  const fetchConnections = async () => {
    setLoadingConnections(true);
    try {
      const { data } = await chatAPI.getConversations();
      if (Array.isArray(data)) {
        setConnections(data);
      } else if (data && Array.isArray(data.results)) {
        setConnections(data.results);
      } else {
        setConnections([]);
      }
    } catch (error) {
      console.warn('Could not fetch conversations:', error);
      setConnections([]);
    } finally {
      setLoadingConnections(false);
    }
  };

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const { data } = await matchAPI.getRequests();
      setPendingReceived(data.received || []);
      setPendingSent(data.sent || []);
    } catch (error) {
      console.warn('Could not fetch connection requests:', error);
      setPendingReceived([]);
      setPendingSent([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleAccept = async (requestItem) => {
    try {
      const otherUserId = requestItem.sender_detail?.id || requestItem.user?.id;
      if (!otherUserId) return;
      await matchAPI.sendAction(otherUserId, 'connect');
      Alert.alert('Sucesso 🎉', 'Convite aceito! Vocês agora estão conectados.');
      fetchConnections();
      fetchRequests();
    } catch (error) {
      console.warn('Error accepting request:', error);
      Alert.alert('Erro', 'Não foi possível aceitar a solicitação.');
    }
  };

  const handleSkip = async (requestItem) => {
    try {
      const otherUserId = requestItem.sender_detail?.id || requestItem.user?.id;
      if (!otherUserId) return;
      await matchAPI.sendAction(otherUserId, 'skip');
      fetchRequests();
    } catch (error) {
      console.warn('Error skipping request:', error);
      Alert.alert('Erro', 'Não foi possível recusar a solicitação.');
    }
  };

  const fetchAvailableTags = async () => {
    try {
      const { data } = await tagsAPI.getAll();
      if (Array.isArray(data)) {
        setAvailableTags(data);
      } else if (data && Array.isArray(data.results)) {
        setAvailableTags(data.results);
      } else {
        throw new Error('Response data is not an array');
      }
    } catch (error) {
      console.warn('Could not fetch tags:', error);
      // Fallback tags se banco estiver vazio
      setAvailableTags([
        { id: 1, name: 'Engenharia' },
        { id: 2, name: 'Estágio' },
        { id: 3, name: 'Dúvidas' },
        { id: 4, name: 'Grupo de Estudos' },
        { id: 5, name: 'Dicas' },
        { id: 6, name: 'Carreira' }
      ]);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchConnections();
    fetchAvailableTags();
    fetchRequests();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfile();
    fetchConnections();
    fetchAvailableTags();
    fetchRequests();
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

  const handlePickAvatar = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à sua galeria para alterar o avatar.');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!pickerResult.canceled) {
      setLoading(true);
      try {
        const manipResult = await ImageManipulator.manipulateAsync(
          pickerResult.assets[0].uri,
          [{ resize: { width: 400, height: 400 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        const formData = new FormData();
        const filename = manipResult.uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        formData.append('avatar', {
          uri: manipResult.uri,
          name: filename,
          type,
        });

        const { data } = await usersAPI.updateProfile(formData);
        setProfile(data);
        Alert.alert('Sucesso', 'Avatar atualizado com sucesso!');
      } catch (error) {
        console.warn('Erro ao fazer upload do avatar:', error);
        Alert.alert('Erro', 'Não foi possível atualizar o avatar.');
      } finally {
        setLoading(false);
      }
    }
  };

  const openEditModal = () => {
    setEditBio(profile?.bio || '');
    setEditCurso(profile?.curso || '');
    setEditSemestre(profile?.semestre?.toString() || '1');
    setEditIsCalouro(profile?.is_calouro ?? true);
    setSelectedTagIds(profile?.tags?.map(t => t.id) || []);
    setIsEditModalVisible(true);
  };

  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
      const updateData = {
        bio: editBio,
        curso: editCurso,
        semestre: parseInt(editSemestre, 10) || 1,
        is_calouro: editIsCalouro,
        tag_ids: selectedTagIds,
      };

      const { data } = await usersAPI.updateProfile(updateData);
      setProfile(data);
      Alert.alert('Sucesso', 'Seu perfil foi atualizado com sucesso!');
      setIsEditModalVisible(false);
    } catch (error) {
      console.warn('Update profile error:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao atualizar seu perfil.');
    } finally {
      setSaving(false);
    }
  };

  const toggleTagSelection = (tagId) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter(id => id !== tagId));
    } else {
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
  };

  const menuItems = [
    { icon: 'person-outline', label: 'Editar perfil', color: COLORS.primary, subtitle: 'Atualize suas informações', onPress: openEditModal },
    { icon: 'bookmark-outline', label: 'Salvos', color: '#7C3AED', subtitle: 'Dicas que você salvou' },
    { icon: 'notifications-outline', label: 'Notificações', color: COLORS.accent, subtitle: 'Gerenciar alertas' },
    { icon: 'shield-checkmark-outline', label: 'Privacidade', color: '#10B981', subtitle: 'Configurações de segurança' },
    { icon: 'help-circle-outline', label: 'Ajuda', color: '#2563EB', subtitle: 'Dúvidas frequentes' },
    { icon: 'information-circle-outline', label: 'Sobre o Faculflow', color: COLORS.textSecondary, subtitle: 'Versão e informações' },
  ];

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: SIZES.xxxl }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[roleColor]} tintColor={roleColor} />}
    >
      {/* Profile Header */}
      <View style={[styles.profileHeader, { backgroundColor: isDark ? colors.card : '#ffffff', paddingTop: insets.top + SIZES.lg, borderBottomColor: colors.cardBorder }]}>
        <TouchableOpacity activeOpacity={0.8} onPress={handlePickAvatar} style={styles.avatarWrapper}>
          <View style={[styles.avatar, { backgroundColor: roleColor }]}>
            {profile?.avatar ? (
              <Image source={{ uri: profile.avatar }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {(profile?.username || 'U').charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.editAvatarBadge}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={[styles.userName, { color: colors.text }]}>{profile?.username || 'Usuário'}</Text>
        <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{profile?.email || ''}</Text>
        <View style={styles.metaRow}>
          <View style={[styles.badge, { backgroundColor: roleColor + '20' }]}>
            <Text style={[styles.badgeText, { color: roleColor }]}>{roleLabel}</Text>
          </View>
          {profile?.curso && (
            <Text style={[styles.courseLabel, { color: colors.textSecondary }]}>• {profile.curso}</Text>
          )}
          {profile?.semestre && (
            <Text style={[styles.courseLabel, { color: colors.textSecondary }]}>• {profile.semestre}º sem.</Text>
          )}
        </View>

        {profile?.bio ? (
          <Text style={[styles.bio, { color: colors.textSecondary }]}>{profile.bio}</Text>
        ) : null}

        {profile?.tags && Array.isArray(profile.tags) && profile.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {profile.tags.map((tag) => (
              <View key={tag.id} style={[styles.tagBadge, { backgroundColor: isDark ? 'rgba(0, 137, 123, 0.15)' : '#e0f2f1' }]}>
                <Text style={[styles.tagText, { color: isDark ? '#4db6ac' : '#00796b' }]}>#{tag.name}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Battle Pass & Streak Section */}
      <View style={styles.battlePassSection}>
        <TouchableOpacity
          style={[styles.battlePassCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          onPress={() => navigation.navigate('BattlePass')}
          activeOpacity={0.8}
        >
          <View style={styles.battlePassRow}>
            <View style={styles.battlePassInfo}>
              <View style={styles.battlePassHeaderRow}>
                <Ionicons name="trophy" size={18} color={roleColor} style={{ marginRight: 6 }} />
                <Text style={[styles.battlePassTitle, { color: colors.text }]}>Passe de Batalha</Text>
              </View>
              <Text style={[styles.battlePassLevel, { color: colors.text }]}>
                Nível <Text style={{ color: roleColor, fontWeight: '900' }}>{profile?.level || 1}</Text>
              </Text>
              <Text style={[styles.battlePassXP, { color: colors.textSecondary }]}>
                {profile?.xp || 0} XP acumulados
              </Text>
            </View>

            <View style={styles.battlePassStreakContainer}>
              <View style={[styles.streakFireBadge, { backgroundColor: isDark ? 'rgba(255, 84, 0, 0.1)' : '#ffece6' }]}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <Ionicons name="flame" size={20} color={colors.streakFire} />
                </Animated.View>
                <Text style={[styles.streakFireText, { color: colors.streakFire }]}>
                  {profile?.streak || 0} dias
                </Text>
              </View>
              {profile?.streak_freeze_count > 0 && (
                <View style={[styles.freezeBadgeSmall, { backgroundColor: isDark ? 'rgba(0, 180, 216, 0.1)' : '#e0f7fa' }]}>
                  <Ionicons name="snow" size={12} color="#00b4d8" style={{ marginRight: 4 }} />
                  <Text style={[styles.freezeTextSmall, { color: '#00b4d8' }]}>{profile.streak_freeze_count}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={[styles.battlePassFooter, { borderTopColor: colors.cardBorder }]}>
            <Text style={[styles.battlePassFooterText, { color: roleColor }]}>Ver recompensas e progresso</Text>
            <Ionicons name="arrow-forward" size={16} color={roleColor} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Solicitações de Conexão (Recebidas & Enviadas) */}
      {(pendingReceived.length > 0 || pendingSent.length > 0) && (
        <View style={styles.requestsSection}>
          <Text style={styles.sectionTitle}>🤝 Solicitações de Mentoria</Text>
          
          {pendingReceived.length > 0 && (
            <View style={{ marginBottom: SIZES.md }}>
              <Text style={[styles.requestsSubtitle, { color: colors.textSecondary }]}>Recebidas ({pendingReceived.length})</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.requestsScroll}>
                {pendingReceived.map((item) => {
                  const sender = item.sender_detail;
                  if (!sender) return null;
                  return (
                    <View key={item.id} style={[styles.requestCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                      <View style={styles.requestHeader}>
                        <View style={[styles.connAvatar, { backgroundColor: sender.is_calouro ? COLORS.accent : COLORS.primary, width: 44, height: 44, borderRadius: 22 }]}>
                          {sender.avatar ? (
                            <Image source={{ uri: sender.avatar }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                          ) : (
                            <Text style={[styles.connAvatarText, { fontSize: 16 }]}>
                              {sender.username.charAt(0).toUpperCase()}
                            </Text>
                          )}
                        </View>
                        <View style={styles.requestInfo}>
                          <Text style={[styles.requestName, { color: colors.text }]} numberOfLines={1}>{sender.username}</Text>
                          <Text style={[styles.requestCourse, { color: colors.textSecondary }]} numberOfLines={1}>{sender.curso}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.requestActions}>
                        <TouchableOpacity style={[styles.reqBtn, styles.reqBtnAccept, { backgroundColor: roleColor }]} onPress={() => handleAccept(item)}>
                          <Ionicons name="checkmark" size={16} color="#fff" />
                          <Text style={styles.reqBtnText}>Aceitar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.reqBtn, styles.reqBtnReject, { borderColor: colors.cardBorder, borderWidth: 1 }]} onPress={() => handleSkip(item)}>
                          <Ionicons name="close" size={16} color={COLORS.textLight} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {pendingSent.length > 0 && (
            <View>
              <Text style={[styles.requestsSubtitle, { color: colors.textSecondary }]}>Enviadas ({pendingSent.length})</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.requestsScroll}>
                {pendingSent.map((item) => {
                  const receiver = item.receiver_detail;
                  if (!receiver) return null;
                  return (
                    <View key={item.id} style={[styles.sentCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                      <View style={[styles.connAvatar, { backgroundColor: receiver.is_calouro ? COLORS.accent : COLORS.primary, width: 36, height: 36, borderRadius: 18 }]}>
                        {receiver.avatar ? (
                          <Image source={{ uri: receiver.avatar }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                        ) : (
                          <Text style={[styles.connAvatarText, { fontSize: 14 }]}>
                            {receiver.username.charAt(0).toUpperCase()}
                          </Text>
                        )}
                      </View>
                      <View style={styles.sentInfo}>
                        <Text style={[styles.sentName, { color: colors.text }]} numberOfLines={1}>{receiver.username}</Text>
                        <View style={styles.pendingBadge}>
                          <Text style={styles.pendingText}>Aguardando...</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      )}

      {/* Matches Section */}
      <View style={styles.connectionsSection}>
        <Text style={styles.sectionTitle}>💬 Minhas Conexões</Text>
        {loadingConnections ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: SIZES.md }} />
        ) : Array.isArray(connections) && connections.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.connectionsScroll}>
            {connections.map((conn) => (
              <TouchableOpacity 
                key={conn.id} 
                style={styles.connCard}
                onPress={() => navigation.navigate('Chat', { otherUser: conn })}
              >
                <View style={[styles.connAvatar, { backgroundColor: conn.is_calouro ? COLORS.accent : COLORS.primary }]}>
                  <Text style={styles.connAvatarText}>
                    {conn.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.connUsername} numberOfLines={1}>{conn.username}</Text>
                <View style={[styles.roleBadgeSmall, { backgroundColor: conn.is_calouro ? COLORS.accent + '20' : COLORS.primary + '20' }]}>
                  <Text style={[styles.roleBadgeSmallText, { color: conn.is_calouro ? COLORS.accent : COLORS.primary }]}>
                    {conn.is_calouro ? 'Calouro' : 'Veterano'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyConnections}>
            <Ionicons name="people-outline" size={32} color={COLORS.textLight} style={{ marginBottom: 6 }} />
            <Text style={styles.emptyConnectionsText}>Nenhum match ainda.</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Conectar')}>
              <Text style={styles.emptyConnectionsBtn}>Encontrar Conexões</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Configurações</Text>
        {menuItems.map((item, i) => (
          <TouchableOpacity key={i} style={styles.menuItem} activeOpacity={0.7} onPress={item.onPress || (() => {})}>
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

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#121214' : '#ffffff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Editar Perfil</Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              {/* Bio Field */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Biografia / Apresentação</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea, { 
                    color: colors.text, 
                    borderColor: colors.cardBorder,
                    backgroundColor: isDark ? '#1a1a1e' : '#f5f5f5'
                  }]}
                  value={editBio}
                  onChangeText={setEditBio}
                  placeholder="Conte um pouco sobre você..."
                  placeholderTextColor={COLORS.textLight}
                  multiline={true}
                  numberOfLines={4}
                />
              </View>

              {/* Curso Field */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Curso</Text>
                <TextInput
                  style={[styles.textInput, { 
                    color: colors.text, 
                    borderColor: colors.cardBorder,
                    backgroundColor: isDark ? '#1a1a1e' : '#f5f5f5'
                  }]}
                  value={editCurso}
                  onChangeText={setEditCurso}
                  placeholder="Ex: Análise e Desenvolvimento de Estudos"
                  placeholderTextColor={COLORS.textLight}
                />
              </View>

              {/* Semestre Field */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Semestre</Text>
                <TextInput
                  style={[styles.textInput, { 
                    color: colors.text, 
                    borderColor: colors.cardBorder,
                    backgroundColor: isDark ? '#1a1a1e' : '#f5f5f5'
                  }]}
                  value={editSemestre}
                  onChangeText={setEditSemestre}
                  placeholder="Ex: 3"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="numeric"
                />
              </View>

              {/* Is Calouro Switch */}
              <View style={[styles.switchContainer, { borderColor: colors.cardBorder }]}>
                <View>
                  <Text style={[styles.switchLabel, { color: colors.text }]}>Eu sou Calouro</Text>
                  <Text style={[styles.switchSubtitle, { color: colors.textSecondary }]}>
                    Desmarque se você for Veterano
                  </Text>
                </View>
                <Switch
                  value={editIsCalouro}
                  onValueChange={setEditIsCalouro}
                  trackColor={{ false: '#767577', true: COLORS.accent + '50' }}
                  thumbColor={editIsCalouro ? COLORS.accent : '#f4f3f4'}
                />
              </View>

              {/* Tags Selection */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Tags de Interesse</Text>
                <View style={styles.tagsGrid}>
                  {Array.isArray(availableTags) && availableTags.map((tag) => {
                    const isSelected = selectedTagIds.includes(tag.id);
                    return (
                      <TouchableOpacity
                        key={tag.id}
                        style={[
                          styles.tagChip,
                          {
                            borderColor: isSelected ? roleColor : colors.cardBorder,
                            backgroundColor: isSelected ? roleColor + '20' : 'transparent',
                          }
                        ]}
                        onPress={() => toggleTagSelection(tag.id)}
                      >
                        <Text style={[
                          styles.tagChipText,
                          {
                            color: isSelected ? roleColor : colors.textSecondary,
                            fontWeight: isSelected ? '600' : 'normal',
                          }
                        ]}>
                          #{tag.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            <View style={[styles.modalActions, { borderTopColor: colors.cardBorder }]}>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.cancelBtn, { borderColor: colors.cardBorder }]} 
                onPress={() => setIsEditModalVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.saveBtn, { backgroundColor: roleColor }]} 
                onPress={handleUpdateProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Salvar Alterações</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  profileHeader: { backgroundColor: COLORS.surface, alignItems: 'center', paddingBottom: SIZES.xl, paddingHorizontal: SIZES.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  avatarWrapper: { position: 'relative', marginBottom: SIZES.md },
  avatar: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', ...SHADOWS.medium, overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  editAvatarBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primary, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: '700' },
  userName: { fontSize: SIZES.title, fontWeight: '700', color: COLORS.secondary },
  userEmail: { fontSize: SIZES.body, color: COLORS.textSecondary, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: SIZES.sm, gap: SIZES.xs, flexWrap: 'wrap', justifyContent: 'center' },
  badge: { paddingHorizontal: SIZES.md, paddingVertical: 4, borderRadius: SIZES.radiusFull },
  badgeText: { fontSize: 13, fontWeight: '600' },
  courseLabel: { fontSize: SIZES.caption, color: COLORS.textSecondary },
  bio: { fontSize: SIZES.body, color: COLORS.textSecondary, textAlign: 'center', marginTop: SIZES.md, lineHeight: 20, paddingHorizontal: SIZES.xl },
  battlePassSection: {
    paddingHorizontal: SIZES.base,
    marginTop: SIZES.md,
  },
  battlePassCard: {
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    padding: SIZES.md,
    ...SHADOWS.medium,
  },
  battlePassRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  battlePassInfo: {
    flex: 1,
  },
  battlePassHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  battlePassTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  battlePassLevel: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  battlePassXP: {
    fontSize: 12,
    marginTop: 4,
  },
  battlePassStreakContainer: {
    alignItems: 'flex-end',
  },
  streakFireBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakFireText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  freezeBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 6,
  },
  freezeTextSmall: {
    fontSize: 10,
    fontWeight: '700',
  },
  battlePassFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 12,
  },
  battlePassFooterText: {
    fontSize: 13,
    fontWeight: '700',
  },
  requestsSection: { marginTop: SIZES.md, paddingHorizontal: SIZES.base, paddingBottom: SIZES.sm },
  requestsSubtitle: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SIZES.xs, paddingLeft: SIZES.xs },
  requestsScroll: { paddingLeft: SIZES.xs, paddingRight: SIZES.lg, gap: SIZES.md, paddingVertical: SIZES.xs },
  requestCard: { width: 220, backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg, padding: SIZES.sm, ...SHADOWS.small, borderWidth: 1 },
  requestHeader: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm, marginBottom: SIZES.xs },
  requestInfo: { flex: 1 },
  requestName: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  requestCourse: { fontSize: 10, color: COLORS.textSecondary },
  requestActions: { flexDirection: 'row', gap: SIZES.sm, marginTop: 4 },
  reqBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 6, borderRadius: SIZES.radiusMd },
  reqBtnAccept: { backgroundColor: COLORS.primary },
  reqBtnReject: { width: 36, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, borderRadius: SIZES.radiusMd },
  reqBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  sentCard: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm, backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg, padding: SIZES.sm, width: 180, ...SHADOWS.small, borderWidth: 1 },
  sentInfo: { flex: 1 },
  sentName: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary },
  pendingBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: SIZES.radiusFull, backgroundColor: 'rgba(239, 108, 0, 0.12)', alignSelf: 'flex-start', marginTop: 2 },
  pendingText: { fontSize: 9, fontWeight: '700', color: '#EF6C00' },
  connectionsSection: { marginTop: SIZES.md, paddingHorizontal: SIZES.base, paddingBottom: SIZES.sm },
  connectionsScroll: { paddingLeft: SIZES.xs, paddingRight: SIZES.lg, gap: SIZES.md, paddingVertical: SIZES.xs },
  connCard: { width: 90, alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg, padding: SIZES.sm, ...SHADOWS.small },
  connAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  connAvatarText: { color: '#fff', fontSize: SIZES.bodyLg, fontWeight: '700' },
  connUsername: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'center', width: '100%', marginBottom: 4 },
  roleBadgeSmall: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: SIZES.radiusFull },
  roleBadgeSmallText: { fontSize: 8, fontWeight: '700' },
  emptyConnections: { backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg, padding: SIZES.lg, alignItems: 'center', justifyContent: 'center', ...SHADOWS.small },
  emptyConnectionsText: { fontSize: SIZES.body, color: COLORS.textSecondary, marginBottom: SIZES.xs },
  emptyConnectionsBtn: { fontSize: SIZES.body, color: COLORS.primary, fontWeight: '600' },
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

  // Tags Container in Profile Header
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: SIZES.md,
    paddingHorizontal: SIZES.md,
  },
  tagBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Edit Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.15)',
  },
  modalTitle: {
    fontSize: SIZES.h3,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  modalScroll: {
    padding: SIZES.lg,
    gap: SIZES.md,
  },
  inputContainer: {
    gap: SIZES.xs,
  },
  inputLabel: {
    fontSize: SIZES.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    fontSize: SIZES.bodyLg,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    marginVertical: SIZES.xs,
  },
  switchLabel: {
    fontSize: SIZES.bodyLg,
    fontWeight: '600',
  },
  switchSubtitle: {
    fontSize: SIZES.caption,
    marginTop: 2,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  tagChip: {
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagChipText: {
    fontSize: 12,
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.lg,
    paddingTop: SIZES.md,
    borderTopWidth: 1,
    gap: SIZES.md,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  cancelBtnText: {
    fontSize: SIZES.bodyLg,
    fontWeight: '600',
  },
  saveBtn: {
    elevation: 2,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: SIZES.bodyLg,
    fontWeight: '700',
  },
});
