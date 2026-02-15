/**
 * Root navigator – native stack only
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import LobbyScreen from '../screens/LobbyScreen';
import RoleScreen from '../screens/RoleScreen';
import GameScreen from '../screens/GameScreen';
import ResultScreen from '../screens/ResultScreen';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: '#1a1a2e' },
  headerTintColor: '#eee',
  headerTitleStyle: { fontWeight: '600' },
  contentStyle: { backgroundColor: '#16213e' },
};

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Mafia' }} />
        <Stack.Screen name="Lobby" component={LobbyScreen} options={{ title: 'Lobby' }} />
        <Stack.Screen name="Role" component={RoleScreen} options={{ title: 'Your Role', headerBackVisible: false }} />
        <Stack.Screen name="Game" component={GameScreen} options={{ title: 'Game', headerBackVisible: false }} />
        <Stack.Screen name="Result" component={ResultScreen} options={{ title: 'Game Over', headerBackVisible: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
