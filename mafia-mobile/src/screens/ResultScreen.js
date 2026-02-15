/**
 * Result – show winner, all players with roles, Terminate or Restart
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useGame } from '../context/GameContext';
import { getSocket } from '../socket/socketService';

const ROLE_LABELS = {
  mafia: 'Mafia',
  doctor: 'Doctor',
  detective: 'Detective',
  villager: 'Villager',
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  card: {
    backgroundColor: '#1a1a2e',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 20, color: '#888', marginBottom: 8 },
  winner: {
    fontSize: 26,
    fontWeight: '700',
    color: '#eee',
    textTransform: 'capitalize',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#aaa',
    marginBottom: 12,
    alignSelf: 'stretch',
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#16213e',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
  },
  playerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, flexWrap: 'wrap' },
  playerName: { fontSize: 16, fontWeight: '600', color: '#eee' },
  playerRole: { fontSize: 14, color: '#0f3460', textTransform: 'capitalize', marginLeft: 8 },
  playerDead: { fontSize: 12, color: '#e94560', marginLeft: 8 },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginLeft: 8,
  },
  badgeWin: { backgroundColor: '#16a34a' },
  badgeLose: { backgroundColor: '#dc2626' },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#0f3460',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 140,
  },
  buttonDanger: { backgroundColor: '#e94560' },
  buttonSecondary: { backgroundColor: '#1a1a2e' },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#eee' },
});

export default function ResultScreen({ navigation }) {
  const {
    room,
    winner,
    playersWithRoles,
    resetGame,
    requestRestart,
    requestTerminate,
    phase,
    PHASES,
  } = useGame();

  const isHost = room?.host === getSocket()?.id;

  // When game is terminated, room becomes null → go home
  useEffect(() => {
    if (!room?.id) {
      resetGame();
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    }
  }, [room?.id, navigation, resetGame]);

  // When host restarts, we get game-started (phase becomes night) → go to Game
  useEffect(() => {
    if (phase === PHASES.night && room?.id) {
      navigation.replace('Game');
    }
  }, [phase, room?.id, PHASES.night, navigation]);

  const handleHome = () => {
    resetGame();
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  const handleTerminate = () => {
    requestTerminate();
    // Server will emit game-terminated → RESET → room null → useEffect above navigates home
  };

  const handleRestart = () => {
    requestRestart();
    // Server will emit game-started + phase-changed → state updates → useEffect above navigates to Game
  };

  const winnerLabel = winner === 'mafia' ? 'Mafia' : winner === 'town' ? 'Town' : 'Unknown';
  const list = playersWithRoles && playersWithRoles.length > 0 ? playersWithRoles : room?.players?.map((p) => ({ ...p, role: '—' })) ?? [];

  const isWinner = (p) => {
    if (!winner || !p.role) return null;
    if (winner === 'town') return p.role !== 'mafia';
    if (winner === 'mafia') return p.role === 'mafia';
    return null;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.card}>
        <Text style={styles.title}>Game Over</Text>
        <Text style={styles.winner}>{winnerLabel} wins!</Text>

        <Text style={styles.sectionTitle}>All players & roles</Text>
        {list.map((p) => {
          const won = isWinner(p);
          return (
            <View key={p.id} style={styles.playerRow}>
              <View style={styles.playerLeft}>
                <Text style={styles.playerName}>{p.name}</Text>
                {!p.isAlive && <Text style={styles.playerDead}>(eliminated)</Text>}
                <Text style={styles.playerRole}>
                  {ROLE_LABELS[p.role] || (p.role ?? '—')}
                </Text>
                {won === true && (
                  <View style={[styles.badge, styles.badgeWin]}>
                    <Text style={styles.badgeText}>WIN</Text>
                  </View>
                )}
                {won === false && (
                  <View style={[styles.badge, styles.badgeLose]}>
                    <Text style={styles.badgeText}>LOSE</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}

        <View style={styles.buttonsRow}>
          <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={handleHome}>
            <Text style={styles.buttonText}>Back to Home</Text>
          </TouchableOpacity>
          {isHost && (
            <>
              <TouchableOpacity style={[styles.button, styles.buttonDanger]} onPress={handleTerminate}>
                <Text style={styles.buttonText}>Terminate Game</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={handleRestart}>
                <Text style={styles.buttonText}>Restart Game</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        {!isHost && (
          <Text style={{ fontSize: 12, color: '#666', marginTop: 12 }}>
            Only the host can restart or terminate the game.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
