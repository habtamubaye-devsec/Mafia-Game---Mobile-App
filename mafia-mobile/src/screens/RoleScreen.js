/**
 * Role – show private role, then navigate to Game
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useGame } from '../context/GameContext';

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#1a1a2e',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 280,
  },
  label: { fontSize: 14, color: '#888', marginBottom: 8 },
  role: { fontSize: 28, fontWeight: '700', color: '#eee', textTransform: 'capitalize' },
  hint: { fontSize: 14, color: '#aaa', marginTop: 16, textAlign: 'center' },
  button: {
    backgroundColor: '#0f3460',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 32,
    minWidth: 200,
  },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#eee' },
});

const ROLE_HINTS = {
  mafia: 'Work with your partner. Eliminate the town at night.',
  doctor: 'Save one player each night. Choose wisely.',
  detective: 'Check one player each night to see if they are Mafia.',
  villager: 'Find the Mafia through discussion and voting.',
};

export default function RoleScreen({ navigation }) {
  const { myRole } = useGame();

  const handleContinue = () => {
    navigation.replace('Game');
  };

  if (!myRole) {
    return (
      <View style={styles.container}>
        <Text style={styles.role}>Loading your role...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>You are</Text>
        <Text style={styles.role}>{myRole}</Text>
        <Text style={styles.hint}>{ROLE_HINTS[myRole] || ''}</Text>
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Continue to game</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
