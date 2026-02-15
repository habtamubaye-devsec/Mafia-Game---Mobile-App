/**
 * Player list – highlights eliminated players
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

const styles = StyleSheet.create({
  container: { marginVertical: 8 },
  title: { fontSize: 16, fontWeight: '600', color: '#eee', marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginVertical: 2,
    borderRadius: 8,
    backgroundColor: '#1a1a2e',
  },
  rowEliminated: { backgroundColor: '#2d2d44', opacity: 0.85 },
  name: { fontSize: 16, color: '#eee', flex: 1 },
  nameEliminated: { color: '#888', textDecorationLine: 'line-through' },
  badge: { fontSize: 12, color: '#e94560', marginLeft: 8 },
});

export default function PlayerList({ players = [], title = 'Players', highlightIds = [], onSelectPlayer, selectable }) {
  const keyExtractor = (item) => item.id;

  const renderRow = (item) => {
    const eliminated = !item.isAlive;
    const highlighted = highlightIds.includes(item.id);
    const Wrapper = selectable && !eliminated ? TouchableOpacity : View;
    return (
      <Wrapper
        style={[styles.row, eliminated && styles.rowEliminated, highlighted && { borderWidth: 2, borderColor: '#e94560' }]}
        onPress={selectable && !eliminated ? () => onSelectPlayer?.(item) : undefined}
        activeOpacity={0.7}
      >
        <Text style={[styles.name, eliminated && styles.nameEliminated]} numberOfLines={1}>
          {item.name || 'Unknown'}
        </Text>
        {eliminated && <Text style={styles.badge}>OUT</Text>}
      </Wrapper>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <FlatList
        data={players}
        keyExtractor={keyExtractor}
        renderItem={({ item }) => renderRow(item)}
        scrollEnabled={false}
      />
    </View>
  );
}
