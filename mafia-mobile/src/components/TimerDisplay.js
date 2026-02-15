/**
 * Countdown timer display
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a2e',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignSelf: 'center',
    minWidth: 80,
    alignItems: 'center',
  },
  value: { fontSize: 28, fontWeight: '700', color: '#0f3460' },
  label: { fontSize: 12, color: '#888', marginTop: 4 },
});

export default function TimerDisplay({ remaining, phase = '' }) {
  return (
    <View style={styles.container}>
      <Text style={styles.value}>{Math.max(0, remaining)}s</Text>
      <Text style={styles.label}>{phase ? `${phase} phase` : 'Time left'}</Text>
    </View>
  );
}
