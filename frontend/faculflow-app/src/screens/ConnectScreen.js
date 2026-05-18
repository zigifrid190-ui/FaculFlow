import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, Animated, Dimensions, Platform, TouchableOpacity
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { matchAPI } from '../services/api';
import MatchCard from '../components/Match/MatchCard';

const { width, height } = Dimensions.get('window');

export default function ConnectScreen() {
  const insets = useSafeAreaInsets();

  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const toastAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const { data } = await matchAPI.getFeed();
      setProfiles(data.results || data);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error fetching match feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message) => {
    setToastMessage(message);
    setToastVisible(true);
    Animated.sequence([
      Animated.timing(toastAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => setToastVisible(false));
  };

  const handleAction = async (actionType) => {
    if (currentIndex >= profiles.length) return;
    const profile = profiles[currentIndex];

    // Trigger API in background
    matchAPI.sendAction(profile.id, actionType)
      .then(() => {
        if (actionType === 'connect') {
          showToast('Pedido de conexão enviado!');
        }
      })
      .catch(err => console.error(err));

    // Animate Card out
    const direction = actionType === 'connect' ? 1 : -1;
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: direction * width * 1.2,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start(() => {
      // Move to next and reset animations
      setCurrentIndex(prev => prev + 1);
      slideAnim.setValue(0);
      opacityAnim.setValue(1);
    });
  };

  const renderCards = () => {
    if (currentIndex >= profiles.length) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-done-circle" size={80} color="#FFF" />
          <Text style={styles.emptyText}>Você já viu todos os perfis por hoje!</Text>
          <TouchableOpacity style={styles.btnReload} onPress={fetchFeed}>
            <Text style={styles.btnReloadText}>Buscar Novos Perfis</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Show current and next card for "stack" effect
    return (
      <View style={styles.stackWrapper}>
        {/* Next Card (Behind) */}
        {currentIndex + 1 < profiles.length && (
          <View style={[styles.cardContainer, styles.nextCard]}>
            <MatchCard 
              profile={profiles[currentIndex + 1]} 
              onSkip={() => {}} 
              onConnect={() => {}} 
            />
          </View>
        )}

        {/* Current Card (Front) */}
        <Animated.View style={[
          styles.cardContainer,
          {
            transform: [
              { translateX: slideAnim },
              {
                rotate: slideAnim.interpolate({
                  inputRange: [-width, width],
                  outputRange: ['-15deg', '15deg']
                })
              },
              {
                scale: opacityAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1]
                })
              }
            ],
            opacity: opacityAnim,
            zIndex: 10
          }
        ]}>
          <MatchCard 
            profile={profiles[currentIndex]} 
            onSkip={() => handleAction('skip')} 
            onConnect={() => handleAction('connect')} 
          />
        </Animated.View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FFF" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#E0F2F1', '#B2DFDB', '#00695C']}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.container, { paddingTop: insets.top + SIZES.xl }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mentoria</Text>
          <Text style={styles.headerSubtitle}>Encontre seu par ideal</Text>
        </View>

        {renderCards()}
      </View>

      {/* Custom Toast Notification */}
      {toastVisible && (
        <Animated.View style={[
          styles.toast,
          {
            opacity: toastAnim,
            transform: [{
              translateY: toastAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0]
              })
            }]
          }
        ]}>
          <Ionicons name="checkmark-circle" size={24} color="#FFF" style={{ marginRight: 10 }} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </View>
  );
}

// Helper for Reload Button (used in empty state)


const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1, paddingHorizontal: SIZES.lg },
  
  header: {
    marginBottom: 60, // Give room for the avatar break
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#004D40',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#00695C',
    opacity: 0.8,
  },

  stackWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cardContainer: {
    width: '100%',
    position: 'absolute',
  },
  nextCard: {
    transform: [{ scale: 0.9 }, { translateY: 20 }],
    opacity: 0.6,
    zIndex: 1,
  },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 20, fontWeight: '700', color: '#FFF', marginTop: 16, textAlign: 'center' },
  btnReload: { 
    marginTop: 24, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    paddingHorizontal: 24, 
    paddingVertical: 14, 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  btnReloadText: { color: '#FFF', fontWeight: '700', fontSize: 16 },

  toast: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    backgroundColor: '#009688',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    ...SHADOWS.medium,
    elevation: 10,
    zIndex: 100,
  },
  toastText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
