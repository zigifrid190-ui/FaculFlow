import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';

export default function ActionButtons({ onSkip, onConnect }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.btnSkip}
        onPress={onSkip}
        activeOpacity={0.8}
      >
        <Text style={styles.btnSkipText}>Pular</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.btnConnect}
        onPress={onConnect}
        activeOpacity={0.8}
      >
        <Ionicons name="hand-right" size={20} color="#FFF" style={{ marginRight: 8 }} />
        <Text style={styles.btnConnectText}>Quero me Conectar!</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginTop: SIZES.xl,
    gap: SIZES.sm,
  },
  btnSkip: {
    flex: 0.8,
    backgroundColor: '#E0E0E0',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  btnSkipText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  btnConnect: {
    flex: 1.5,
    backgroundColor: '#009688',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  btnConnectText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
