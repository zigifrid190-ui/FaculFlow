import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const EMOJI_OPTIONS = ['📚', '🎓', '💡', '🔬', '📈', '🎨', '🏋️', '💻', '🎵', '🌍', '⚖️', '🧮', '📐', '🔧', '🩺', '😢', '😞', '🤝', '🚀', '🎯'];
const CATEGORY_OPTIONS = [
  { key: 'curso', label: 'Curso' },
  { key: 'tema', label: 'Tema' },
  { key: 'ano', label: 'Ano' },
];

export default function CreateCommunityModal({ visible, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('📚');
  const [selectedCategory, setSelectedCategory] = useState('tema');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onCreate({
        name: name.trim(),
        description: description.trim(),
        icon: selectedIcon,
        category: selectedCategory,
      });
      // Reset form
      setName('');
      setDescription('');
      setSelectedIcon('📚');
      setSelectedCategory('tema');
      onClose();
    } catch (error) {
      console.error('Error creating community:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <Text style={styles.title}>Criar Novo Quadro</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Name */}
            <Text style={styles.label}>Nome do quadro</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Direito - Estágio e OAB"
              placeholderTextColor={COLORS.textLight}
              value={name}
              onChangeText={setName}
              maxLength={100}
            />

            {/* Description */}
            <Text style={styles.label}>Descrição (opcional)</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Sobre o que é esse quadro?"
              placeholderTextColor={COLORS.textLight}
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={500}
            />

            {/* Emoji Picker */}
            <Text style={styles.label}>Escolha um emoji</Text>
            <View style={styles.emojiGrid}>
              {EMOJI_OPTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[styles.emojiOption, selectedIcon === emoji && styles.emojiOptionActive]}
                  onPress={() => setSelectedIcon(emoji)}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Category */}
            <Text style={styles.label}>Categoria</Text>
            <View style={styles.categoryRow}>
              {CATEGORY_OPTIONS.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.categoryChip, selectedCategory === cat.key && styles.categoryChipActive]}
                  onPress={() => setSelectedCategory(cat.key)}
                >
                  <Text style={[styles.categoryText, selectedCategory === cat.key && styles.categoryTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Create Button */}
          <TouchableOpacity
            style={[styles.createBtn, (!name.trim() || loading) && styles.createBtnDisabled]}
            onPress={handleCreate}
            disabled={!name.trim() || loading}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={22} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.createBtnText}>
              {loading ? 'Criando...' : 'Criar Quadro'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SIZES.lg,
    paddingBottom: 40,
    maxHeight: '85%',
    ...SHADOWS.large,
  },
  header: {
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  closeBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emojiOption: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiOptionActive: {
    backgroundColor: '#E0F2F1',
    borderWidth: 2,
    borderColor: '#009688',
  },
  emojiText: {
    fontSize: 22,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  categoryChipActive: {
    backgroundColor: '#009688',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  categoryTextActive: {
    color: '#FFF',
  },
  createBtn: {
    backgroundColor: '#009688',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  createBtnDisabled: {
    opacity: 0.5,
  },
  createBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
