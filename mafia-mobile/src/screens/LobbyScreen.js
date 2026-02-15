/**
 * Lobby – show room code, player list, start game (host only)
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useGame } from '../context/GameContext';
import { getSocket } from '../socket/socketService';
import PlayerList from '../components/PlayerList';

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  codeBox: {
    backgroundColor: '#1a1a2e',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  codeLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  code: { fontSize: 28, fontWeight: '700', color: '#eee', letterSpacing: 4 },
  hint: { fontSize: 13, color: '#888', marginTop: 8, textAlign: 'center' },
  button: {
    backgroundColor: '#0f3460',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#eee' },
});

const MIN_PLAYERS = 5;

export default function LobbyScreen({ navigation }) {
  const { room, startGame, loading, error } = useGame();
  const mySocketId = getSocket()?.id;
  const isHost = room?.host === mySocketId;
  const canStart = room?.players?.length >= MIN_PLAYERS && isHost;

  useEffect(() => {
    if (!room?.id) {
      navigation.replace('Home');
      return;
    }
    if (room.phase && room.phase !== 'lobby') {
      navigation.replace('Role');
    }
  }, [room?.id, room?.phase, navigation]);

  useEffect(() => {
    if (error) Alert.alert('Error', error);
  }, [error]);

  const handleStart = () => {
    if (!canStart) return;
    if (room.players.length < MIN_PLAYERS) {
      Alert.alert('Not enough players', `Need at least ${MIN_PLAYERS} players to start.`);
      return;
    }
    startGame();
  };

  if (!room) return null;

  return (
    <View style={styles.container}>
      <View style={styles.codeBox}>
        <Text style={styles.codeLabel}>Room code</Text>
        <Text style={styles.code}>{room.id?.toUpperCase()}</Text>
        <Text style={styles.hint}>Share this code with others to join</Text>
      </View>

      <PlayerList players={room.players} title={`Players (${room.players?.length || 0}/${MIN_PLAYERS} to start)`} />

      {loading && <ActivityIndicator size="large" color="#0f3460" style={{ marginVertical: 16 }} />}

      {isHost && (
        <TouchableOpacity
          style={[styles.button, (!canStart || loading) && styles.buttonDisabled]}
          onPress={handleStart}
          disabled={!canStart || loading}
        >
          <Text style={styles.buttonText}>Start game</Text>
        </TouchableOpacity>
      )}

      {!isHost && <Text style={styles.hint}>Waiting for host to start the game...</Text>}
    </View>
  );
}
