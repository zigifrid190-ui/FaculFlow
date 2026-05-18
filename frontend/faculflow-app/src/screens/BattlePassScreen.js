import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, ActivityIndicator, Alert, Share,
  Animated, Easing, Dimensions, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { battlePassAPI } from '../services/api';
import Skeleton from '../components/Common/Skeleton';

export default function BattlePassScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
  
  const [battlePassData, setBattlePassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claimingId, setClaimingId] = useState(null);
  const [confettiParticles, setConfettiParticles] = useState([]);

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

  const triggerConfetti = () => {
    const particleColors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];
    const newParticles = Array.from({ length: 45 }).map((_, i) => {
      const animY = new Animated.Value(-50);
      const animX = new Animated.Value(Math.random() * SCREEN_WIDTH);
      const rotate = new Animated.Value(0);
      const startX = Math.random() * SCREEN_WIDTH;
      return {
        id: i,
        color: particleColors[Math.floor(Math.random() * particleColors.length)],
        size: Math.random() * 8 + 6,
        isRound: Math.random() > 0.5,
        animY,
        animX,
        rotate,
        startX,
      };
    });

    setConfettiParticles(newParticles);

    const animations = newParticles.map((p) => {
      return Animated.parallel([
        Animated.timing(p.animY, {
          toValue: SCREEN_HEIGHT + 50,
          duration: Math.random() * 2000 + 2000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(p.animX, {
          toValue: p.startX + (Math.random() * 160 - 80),
          duration: Math.random() * 2000 + 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(p.rotate, {
          toValue: Math.random() * 10 + 5,
          duration: Math.random() * 2000 + 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ]);
    });

    Animated.parallel(animations).start(() => {
      setConfettiParticles([]);
    });
  };

  const fetchBattlePass = async (showError = false) => {
    try {
      const { data } = await battlePassAPI.getBattlePass();
      setBattlePassData(data);
    } catch (error) {
      console.warn('Error fetching battle pass:', error?.message);
      if (showError) {
        Alert.alert('Erro de Conexão', 'Não foi possível atualizar o Passe de Batalha.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBattlePass();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBattlePass(true);
  }, []);

  const handleClaim = async (rewardId, rewardTitle) => {
    setClaimingId(rewardId);
    try {
      const { data } = await battlePassAPI.claimReward(rewardId);
      if (data.success) {
        triggerConfetti();
        Alert.alert('Parabéns!', `Você resgatou com sucesso: ${rewardTitle}! 🎉`);
        fetchBattlePass(); // Refresh data to update claimed status
      }
    } catch (error) {
      const msg = error.response?.data?.detail || error.response?.data?.[0] || 'Não foi possível resgatar o prêmio.';
      Alert.alert('Ops!', msg);
    } finally {
      setClaimingId(null);
    }
  };

  const handleShare = async () => {
    if (!battlePassData) return;
    try {
      await Share.share({
        message: `Estou no Nível ${battlePassData.level} com ${battlePassData.xp} XP no FaculFlow! Minha ofensiva é de ${battlePassData.streak} dias! Venha mentorar comigo! 🚀`,
      });
    } catch (error) {
      console.warn(error.message);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Carregando o seu Passe de Batalha...</Text>
      </View>
    );
  }

  const { level, xp, streak, streak_freeze_count, xp_within_level, xp_threshold, is_calouro, rewards } = battlePassData;
  const progressPercent = Math.min(Math.max(xp_within_level / xp_threshold, 0), 1);
  const themeColor = is_calouro ? '#2ec4b6' : '#ff9f1c'; // Mint green for calouros, vibrant orange for veteranos

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Premium Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, borderBottomColor: colors.cardBorder }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Passe de Batalha</Text>
          <TouchableOpacity onPress={handleShare} style={styles.iconButton}>
            <Ionicons name="share-social-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Status Profile Dashboard Card */}
        <View style={[styles.dashboardCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.dashboardRow}>
            <View>
              <Text style={[styles.levelLabel, { color: colors.textSecondary }]}>NÍVEL ATUAL</Text>
              <Text style={[styles.levelValue, { color: themeColor }]}>{level}</Text>
              <Text style={[styles.xpText, { color: colors.text }]}>
                {xp} <Text style={{ color: colors.textSecondary }}>total XP</Text>
              </Text>
            </View>

            <View style={styles.statusBadges}>
              {/* Flame Streak Badge */}
              <View style={[styles.badge, { backgroundColor: isDark ? 'rgba(255, 84, 0, 0.1)' : '#ffece6' }]}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <Ionicons name="flame" size={20} color={colors.streakFire} />
                </Animated.View>
                <Text style={[styles.badgeText, { color: colors.streakFire }]}>{streak} dias</Text>
              </View>

              {/* Duolingo Streak Freeze Shield */}
              <View style={[styles.badge, { backgroundColor: isDark ? 'rgba(0, 180, 216, 0.1)' : '#e0f7fa', marginTop: 8 }]}>
                <Ionicons name="snow" size={18} color="#00b4d8" />
                <Text style={[styles.badgeText, { color: '#00b4d8' }]}>{streak_freeze_count} Bloqueios</Text>
              </View>
            </View>
          </View>

          {/* Dynamic Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressText, { color: colors.textSecondary }]}>Progresso do Nível</Text>
              <Text style={[styles.progressValues, { color: colors.text }]}>
                {xp_within_level} / {xp_threshold} XP
              </Text>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: colors.grey100 }]}>
              <View style={[styles.progressBarFill, { width: `${progressPercent * 100}%`, backgroundColor: themeColor }]} />
            </View>
          </View>
        </View>

        {/* Quest Info Callout */}
        <View style={[styles.infoCallout, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Ionicons name="information-circle-outline" size={20} color={themeColor} />
          <Text style={[styles.infoCalloutText, { color: colors.text }]}>
            Ganha XP completando matches (+50), enviando chats (+10), postando no feed (+20) e comentando (+5).
          </Text>
        </View>

        {/* Battle Pass Path Header */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Estrada de Recompensas</Text>

        {/* Rewards Path Timeline */}
        {rewards.map((reward, index) => {
          const isUnlocked = reward.unlocked;
          const isClaimed = reward.claimed;

          return (
            <View key={reward.id} style={styles.timelineItem}>
              {/* Vertical connector line */}
              {index < rewards.length - 1 && (
                <View style={[styles.timelineConnector, { backgroundColor: isUnlocked ? themeColor : colors.grey200 }]} />
              )}

              {/* Left timeline status circle */}
              <View
                style={[
                  styles.timelineIndicator,
                  {
                    backgroundColor: isClaimed
                      ? '#2ec4b6'
                      : isUnlocked
                      ? colors.card
                      : colors.grey100,
                    borderColor: isClaimed
                      ? '#2ec4b6'
                      : isUnlocked
                      ? themeColor
                      : colors.grey200,
                  },
                ]}
              >
                {isClaimed ? (
                  <Ionicons name="checkmark-done" size={18} color="#ffffff" />
                ) : isUnlocked ? (
                  <Ionicons name="star" size={16} color={themeColor} />
                ) : (
                  <Ionicons name="lock-closed" size={16} color={colors.textSecondary} />
                )}
              </View>

              {/* Reward Card */}
              <View style={[styles.rewardCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <View style={styles.rewardCardHeader}>
                  <View style={[styles.rewardIconBg, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f0f1f2' }]}>
                    <Text style={styles.rewardIcon}>{reward.icon}</Text>
                  </View>
                  <View style={styles.rewardTextContainer}>
                    <View style={styles.levelBadgeContainer}>
                      <Text style={[styles.levelBadgeText, { color: themeColor, borderColor: themeColor }]}>
                        NÍVEL {reward.level_required}
                      </Text>
                    </View>
                    <Text style={[styles.rewardTitle, { color: colors.text }]}>{reward.title}</Text>
                    <Text style={[styles.rewardDesc, { color: colors.textSecondary }]}>{reward.description}</Text>
                  </View>
                </View>

                {/* Claim CTA Button */}
                <View style={styles.rewardCardFooter}>
                  {isClaimed ? (
                    <View style={[styles.claimedBadge, { backgroundColor: 'rgba(46, 196, 182, 0.1)' }]}>
                      <Ionicons name="checkmark-circle" size={16} color="#2ec4b6" style={{ marginRight: 6 }} />
                      <Text style={[styles.claimedText, { color: '#2ec4b6' }]}>Resgatado</Text>
                    </View>
                  ) : isUnlocked ? (
                    <TouchableOpacity
                      style={[styles.claimButton, { backgroundColor: themeColor }]}
                      onPress={() => handleClaim(reward.id, reward.title)}
                      disabled={claimingId !== null}
                    >
                      {claimingId === reward.id ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <>
                          <Ionicons name="gift-outline" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                          <Text style={styles.claimButtonText}>Resgatar Recompensa</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.lockedBadge, { backgroundColor: colors.grey100 }]}>
                      <Ionicons name="lock-closed-outline" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                      <Text style={[styles.lockedText, { color: colors.textSecondary }]}>Nível {reward.level_required} Necessário</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Confetti Particle Overlay */}
      {confettiParticles.map((p) => {
        const rotation = p.rotate.interpolate({
          inputRange: [0, 10],
          outputRange: ['0deg', '3600deg'],
        });
        return (
          <Animated.View
            key={p.id}
            pointerEvents="none"
            style={[
              styles.confetti,
              {
                backgroundColor: p.color,
                width: p.size,
                height: p.size,
                borderRadius: p.isRound ? p.size / 2 : 2,
                transform: [
                  { translateX: p.animX },
                  { translateY: p.animY },
                  { rotate: rotation },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  confetti: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 9999,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  dashboardCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  dashboardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  levelLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  levelValue: {
    fontSize: 48,
    fontWeight: '900',
    marginTop: -4,
  },
  xpText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  statusBadges: {
    alignItems: 'flex-end',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  progressContainer: {
    marginTop: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressValues: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  infoCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 20,
  },
  infoCalloutText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 10,
    flex: 1,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    paddingBottom: 24,
    position: 'relative',
  },
  timelineConnector: {
    position: 'absolute',
    left: 17,
    top: 36,
    bottom: -12,
    width: 2,
  },
  timelineIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    zIndex: 1,
  },
  rewardCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  rewardCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rewardIconBg: {
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rewardIcon: {
    fontSize: 26,
  },
  rewardTextContainer: {
    flex: 1,
  },
  levelBadgeContainer: {
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  levelBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rewardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  rewardDesc: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  rewardCardFooter: {
    marginTop: 14,
    alignItems: 'flex-end',
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  claimButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  claimedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  claimedText: {
    fontSize: 13,
    fontWeight: '700',
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  lockedText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
