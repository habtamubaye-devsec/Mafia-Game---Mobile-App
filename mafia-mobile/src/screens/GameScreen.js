/**
 * Game – dynamic UI for night / day / voting / ended + phase/vote end notifications
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useGame } from '../context/GameContext';
import { getSocket } from '../socket/socketService';
import PlayerList from '../components/PlayerList';
import TimerDisplay from '../components/TimerDisplay';

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  phaseBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  phaseText: { fontSize: 18, fontWeight: '700', color: '#eee', textTransform: 'capitalize' },
  roundText: { fontSize: 14, color: '#888' },
  section: { marginBottom: 20 },
  instruction: { fontSize: 15, color: '#ccc', marginBottom: 12 },
  button: {
    backgroundColor: '#0f3460',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#eee' },
  detectiveResult: {
    backgroundColor: '#1a1a2e',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  detectiveText: { fontSize: 14, color: '#eee' },
});

export default function GameScreen({ navigation }) {
  const {
    room,
    phase,
    round,
    myRole,
    timerRemaining,
    winner,
    sendNightAction,
    submitVote,
    detectiveResult,
    lastNotification,
    clearNotification,
    PHASES,
  } = useGame();

  const myPlayer = room?.players?.find((p) => p.id === getSocket()?.id);
  const isAlive = myPlayer?.isAlive ?? false;
  const alivePlayers = room?.players?.filter((p) => p.isAlive) ?? [];

  useEffect(() => {
    if (!room?.id) {
      navigation.replace('Home');
      return;
    }
    if (phase === PHASES.ended) {
      navigation.replace('Result');
    }
  }, [room?.id, phase, navigation, PHASES.ended]);

  // Show user-friendly notification when vote / night / day time ends
  useEffect(() => {
    if (lastNotification?.message) {
      Alert.alert(
        lastNotification.title || 'Game Update',
        lastNotification.message,
        [{ text: 'OK', onPress: clearNotification }],
        { cancelable: true, onDismiss: clearNotification }
      );
    }
  }, [lastNotification, clearNotification]);

  const handleNightTarget = (player) => {
    if (!isAlive || !player?.id) return;
    sendNightAction(myRole, player.id);
  };

  const handleVoteTarget = (player) => {
    if (!isAlive || phase !== PHASES.voting) return;
    submitVote(player.id);
  };

  if (!room) return null;

  const isNight = phase === PHASES.night;
  const isDay = phase === PHASES.day;
  const isVoting = phase === PHASES.voting;

  const mafiaAction = isNight && isAlive && myRole === 'mafia';
  const doctorAction = isNight && isAlive && myRole === 'doctor';
  const detectiveAction = isNight && isAlive && myRole === 'detective';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.phaseBar}>
        <Text style={styles.phaseText}>{phase}</Text>
        <Text style={styles.roundText}>Round {round}</Text>
        <TimerDisplay remaining={timerRemaining} phase={phase} />
      </View>

      {detectiveResult !== null && detectiveResult !== undefined && myRole === 'detective' && (
        <View style={styles.detectiveResult}>
          <Text style={styles.detectiveText}>
            Last check: {detectiveResult ? 'Mafia' : 'Not Mafia'}
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <PlayerList players={room.players} title="Players" />
      </View>

      {!isAlive && (
        <Text style={styles.instruction}>You are out. Wait for the game to end.</Text>
      )}

      {isAlive && isNight && (
        <View style={styles.section}>
          {mafiaAction && (
            <>
              <Text style={styles.instruction}>Choose a player to eliminate tonight.</Text>
              <PlayerList
                players={alivePlayers.filter((p) => p.id !== getSocket()?.id)}
                selectable
                onSelectPlayer={handleNightTarget}
              />
            </>
          )}
          {doctorAction && (
            <>
              <Text style={styles.instruction}>Choose a player to save tonight.</Text>
              <PlayerList players={alivePlayers} selectable onSelectPlayer={handleNightTarget} />
            </>
          )}
          {detectiveAction && (
            <>
              <Text style={styles.instruction}>Choose a player to check tonight.</Text>
              <PlayerList
                players={alivePlayers.filter((p) => p.id !== getSocket()?.id)}
                selectable
                onSelectPlayer={handleNightTarget}
              />
            </>
          )}
          {!mafiaAction && !doctorAction && !detectiveAction && (
            <Text style={styles.instruction}>Wait for night actions...</Text>
          )}
        </View>
      )}

      {isAlive && isDay && (
        <View style={styles.section}>
          <Text style={styles.instruction}>Discussion phase. Wait for voting.</Text>
        </View>
      )}

      {isAlive && isVoting && (
        <View style={styles.section}>
          <Text style={styles.instruction}>Vote for a player to eliminate.</Text>
          <PlayerList players={alivePlayers} selectable onSelectPlayer={handleVoteTarget} />
        </View>
      )}
    </ScrollView>
  );
}
