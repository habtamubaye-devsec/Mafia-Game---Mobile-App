/**
 * Home – enter name, server URL, create or join room
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useGame } from '../context/GameContext';
import { connectSocket } from '../socket/socketService';

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#eee', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 24, textAlign: 'center' },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#eee',
    marginBottom: 12,
  },
  label: { fontSize: 14, color: '#aaa', marginBottom: 4 },
  button: {
    backgroundColor: '#0f3460',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonSecondary: { backgroundColor: '#1a1a2e', marginTop: 12 },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#eee' },
  error: { fontSize: 14, color: '#e94560', marginTop: 8, textAlign: 'center' },
});

export default function HomeScreen({ navigation }) {
  const { createRoom, joinRoom, room, loading, error, resetGame, isConnected } = useGame();
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [serverUrl, setServerUrl] = useState('http://localhost:3001');
  const [pendingCreate, setPendingCreate] = useState(null);
  const [pendingJoin, setPendingJoin] = useState(null);

  useEffect(() => {
    if (room?.id && room?.phase === 'lobby') {
      navigation.replace('Lobby', { isHost: true });
    }
  }, [room?.id, room?.phase, navigation]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
    }
  }, [error]);

  // Create room only after socket is connected
  useEffect(() => {
    if (isConnected && pendingCreate) {
      resetGame();
      createRoom(pendingCreate);
      setPendingCreate(null);
    }
  }, [isConnected, pendingCreate, resetGame, createRoom]);

  // Join room only after socket is connected
  useEffect(() => {
    if (isConnected && pendingJoin) {
      resetGame();
      joinRoom(pendingJoin.roomId, pendingJoin.name);
      setPendingJoin(null);
    }
  }, [isConnected, pendingJoin, resetGame, joinRoom]);

  const handleConnect = (url) => {
    const u = (url || serverUrl).trim() || 'http://localhost:3001';
    setServerUrl(u);
    connectSocket(u);
  };

  const handleCreate = () => {
    const n = name.trim() || 'Player';
    resetGame();
    handleConnect(serverUrl);
    setPendingCreate(n);
  };

  const handleJoin = () => {
    const n = name.trim() || 'Player';
    const r = roomId.trim().toLowerCase();
    if (!r) {
      Alert.alert('Error', 'Enter room code');
      return;
    }
    resetGame();
    handleConnect(serverUrl);
    setPendingJoin({ roomId: r, name: n });
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.title}>Mafia</Text>  
      <Text style={styles.subtitle}>Real-time multiplayer</Text> 

      <Text style={styles.label}>Server URL (on mobile: use your PC IP, e.g. 192.168.1.5:3001)</Text>
      <TextInput
        style={styles.input}
        value={serverUrl}
        onChangeText={setServerUrl}
        placeholder="http://192.168.x.x:3001"
        placeholderTextColor="#666"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={styles.label}>Your name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Player name"
        placeholderTextColor="#666"
      />

      {(loading || pendingCreate || pendingJoin) && (
        <ActivityIndicator size="large" color="#0f3460" style={{ marginVertical: 16 }} />
      )}
      {(pendingCreate || pendingJoin) && !isConnected && (
        <Text style={styles.subtitle}>Connecting to server...</Text>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={handleCreate}
        disabled={loading || !!pendingCreate || !!pendingJoin}
      >
        <Text style={styles.buttonText}>Create room</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Room code (to join)</Text>
      <TextInput
        style={styles.input}
        value={roomId}
        onChangeText={setRoomId}
        placeholder="e.g. abc12def"
        placeholderTextColor="#666"
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={[styles.button, styles.buttonSecondary]}
        onPress={handleJoin}
        disabled={loading || !!pendingCreate || !!pendingJoin}
      >
        <Text style={styles.buttonText}>Join room</Text>
      </TouchableOpacity>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </KeyboardAvoidingView>
  );
}
