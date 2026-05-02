import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const { login, register, error, clearError, isLoading } = useAuth();
  const insets = useSafeAreaInsets();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [username, setUsername] = useState('');
  const [curso, setCurso] = useState('');
  const [semestre, setSemestre] = useState('');
  const [isCalouro, setIsCalouro] = useState(true);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const toggleMode = () => {
    clearError();
    setIsLoginMode(!isLoginMode);
  };

  const handleSubmit = async () => {
    setLoading(true);
    if (isLoginMode) {
      await login(email, password);
    } else {
      await register({
        email,
        password,
        username,
        curso,
        semestre: parseInt(semestre) || 1,
        is_calouro: isCalouro,
      });
    }
    setLoading(false);
  };

  const isFormValid = isLoginMode
    ? email && password
    : email && password && username;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + SIZES.xxl, paddingBottom: insets.bottom + SIZES.xxl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo Section */}
        <Animated.View
          style={[
            styles.logoSection,
            {
              opacity: fadeAnim,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/logo-faculflow.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.tagline}>
            Conectando calouros e veteranos{'\n'}da Estácio
          </Text>
        </Animated.View>

        {/* Form Card */}
        <Animated.View
          style={[
            styles.formCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.formTitle}>
            {isLoginMode ? 'Entrar na sua conta' : 'Criar conta'}
          </Text>
          <Text style={styles.formSubtitle}>
            {isLoginMode
              ? 'Bem-vindo de volta! 👋'
              : 'Junte-se à comunidade Faculflow 🎓'}
          </Text>

          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={18} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {!isLoginMode && (
            <Input
              label="Nome de usuário"
              placeholder="Seu nome ou apelido"
              value={username}
              onChangeText={setUsername}
              icon="person-outline"
            />
          )}

          <Input
            label="E-mail"
            placeholder="seu@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            icon="mail-outline"
          />

          <Input
            label="Senha"
            placeholder="Sua senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            icon="lock-closed-outline"
          />

          {!isLoginMode && (
            <>
              <Input
                label="Curso"
                placeholder="Ex: Direito, Psicologia..."
                value={curso}
                onChangeText={setCurso}
                icon="school-outline"
              />

              <Input
                label="Semestre"
                placeholder="Ex: 1"
                value={semestre}
                onChangeText={setSemestre}
                keyboardType="numeric"
                icon="calendar-outline"
              />

              {/* Role Toggle */}
              <View style={styles.roleToggle}>
                <Text style={styles.roleLabel}>Você é:</Text>
                <View style={styles.roleButtons}>
                  <TouchableOpacity
                    style={[
                      styles.roleBtn,
                      isCalouro && styles.roleBtnActive,
                    ]}
                    onPress={() => setIsCalouro(true)}
                  >
                    <Ionicons
                      name="school"
                      size={16}
                      color={isCalouro ? '#fff' : COLORS.accent}
                    />
                    <Text
                      style={[
                        styles.roleBtnText,
                        isCalouro && styles.roleBtnTextActive,
                      ]}
                    >
                      Calouro
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.roleBtn,
                      !isCalouro && styles.roleBtnActiveVet,
                    ]}
                    onPress={() => setIsCalouro(false)}
                  >
                    <Ionicons
                      name="ribbon"
                      size={16}
                      color={!isCalouro ? '#fff' : COLORS.primary}
                    />
                    <Text
                      style={[
                        styles.roleBtnText,
                        !isCalouro && styles.roleBtnTextActive,
                      ]}
                    >
                      Veterano
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          <Button
            title={isLoginMode ? 'Entrar' : 'Criar conta'}
            onPress={handleSubmit}
            loading={loading}
            disabled={!isFormValid}
            style={styles.submitButton}
          />

          <TouchableOpacity onPress={toggleMode} style={styles.switchMode}>
            <Text style={styles.switchText}>
              {isLoginMode
                ? 'Não tem conta? '
                : 'Já tem conta? '}
              <Text style={styles.switchLink}>
                {isLoginMode ? 'Cadastre-se' : 'Faça login'}
              </Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SIZES.xl,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: SIZES.xxl,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.large,
    marginBottom: SIZES.base,
  },
  logo: {
    width: 90,
    height: 90,
  },
  tagline: {
    fontSize: SIZES.bodyLg,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusXl,
    padding: SIZES.xl,
    ...SHADOWS.medium,
  },
  formTitle: {
    fontSize: SIZES.title,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: SIZES.xs,
  },
  formSubtitle: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginBottom: SIZES.lg,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    padding: SIZES.md,
    borderRadius: SIZES.radiusSm,
    marginBottom: SIZES.base,
    gap: SIZES.sm,
  },
  errorText: {
    flex: 1,
    color: COLORS.error,
    fontSize: SIZES.body,
    fontWeight: '500',
  },
  roleToggle: {
    marginBottom: SIZES.base,
  },
  roleLabel: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SIZES.sm,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: SIZES.md,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.sm,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  roleBtnActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  roleBtnActiveVet: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  roleBtnText: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  roleBtnTextActive: {
    color: '#fff',
  },
  submitButton: {
    marginTop: SIZES.sm,
  },
  switchMode: {
    alignItems: 'center',
    paddingVertical: SIZES.base,
  },
  switchText: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  switchLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
