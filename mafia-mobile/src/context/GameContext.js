/**
 * Global game state via Context API
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect, useState } from 'react';
import { getSocket, connectSocket, onSocketReady, setOnConnectError } from '../socket/socketService';

const GameContext = createContext(null);

const PHASES = { lobby: 'lobby', night: 'night', day: 'day', voting: 'voting', ended: 'ended' };

const initialState = {
  room: null,
  myRole: null,
  phase: PHASES.lobby,
  round: 0,
  timerRemaining: 0,
  winner: null,
  playersWithRoles: null, // [{ id, name, role, isAlive }] when game ends
  loading: false,
  error: null,
  detectiveResult: null,
  lastNotification: null, // { title, message } for vote/phase end alerts
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload, error: action.payload ? null : state.error };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'ROOM_UPDATED':
      return {
        ...state,
        room: action.payload,
        phase: action.payload?.phase ?? state.phase,
        round: action.payload?.round ?? state.round,
        winner: action.payload?.winner ?? null,
        error: null,
        loading: false,
      };
    case 'GAME_STARTED':
      return {
        ...state,
        room: action.payload,
        phase: action.payload?.phase ?? PHASES.night,
        round: action.payload?.round ?? 1,
        winner: null,
        playersWithRoles: null,
        error: null,
        loading: false,
      };
    case 'YOUR_ROLE':
      return { ...state, myRole: action.payload };
    case 'PHASE_CHANGED':
      return { ...state, phase: action.payload.phase, round: action.payload.round ?? state.round };
    case 'PLAYER_ELIMINATED':
      return { ...state };
    case 'TIMER_UPDATE':
      return { ...state, timerRemaining: action.payload.remaining };
    case 'GAME_OVER':
      return {
        ...state,
        phase: PHASES.ended,
        winner: action.payload?.winner ?? null,
        playersWithRoles: action.payload?.playersWithRoles ?? null,
      };
    case 'DETECTIVE_RESULT':
      return { ...state, detectiveResult: action.payload?.isMafia };
    case 'NOTIFICATION':
      return { ...state, lastNotification: action.payload };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

export function GameProvider({ children, serverUrl }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [socketReady, setSocketReady] = useState(0); // increment when socket connects so we attach listeners

  useEffect(() => {
    if (serverUrl) connectSocket(serverUrl);
  }, [serverUrl]);

  // When socket connects, we need to attach game listeners (they're not attached on mount because socket didn't exist yet)
  useEffect(() => {
    const unsub = onSocketReady(() => setSocketReady((n) => n + 1));
    return unsub;
  }, []);

  useEffect(() => {
    setOnConnectError((err) => {
      dispatch({ type: 'SET_ERROR', payload: 'Could not connect to server. On mobile, use your PC IP (e.g. 192.168.1.x:3001) instead of localhost.' });
    });
    return () => setOnConnectError(null);
  }, []);

  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const onRoom = (room) => dispatch({ type: 'ROOM_UPDATED', payload: room });
    const onStarted = (room) => dispatch({ type: 'GAME_STARTED', payload: room });
    const onRole = (data) => dispatch({ type: 'YOUR_ROLE', payload: data?.role });
    const onPhase = (data) => dispatch({ type: 'PHASE_CHANGED', payload: data });
    const onEliminated = () => dispatch({ type: 'PLAYER_ELIMINATED' });
    const onTimer = (data) => dispatch({ type: 'TIMER_UPDATE', payload: data });
    const onOver = (data) => dispatch({ type: 'GAME_OVER', payload: data });
    const onDetective = (data) => dispatch({ type: 'DETECTIVE_RESULT', payload: data });
    const onError = (data) => dispatch({ type: 'SET_ERROR', payload: data?.message });
    const onNotification = (data) => dispatch({ type: 'NOTIFICATION', payload: data });
    const onTerminated = () => dispatch({ type: 'RESET' });

    s.on('room-updated', onRoom);
    s.on('game-started', onStarted);
    s.on('your-role', onRole);
    s.on('phase-changed', onPhase);
    s.on('player-eliminated', onEliminated);
    s.on('timer-update', onTimer);
    s.on('game-over', onOver);
    s.on('detective-result', onDetective);
    s.on('notification', onNotification);
    s.on('game-terminated', onTerminated);
    s.on('error', onError);

    return () => {
      s.off('room-updated', onRoom);
      s.off('game-started', onStarted);
      s.off('your-role', onRole);
      s.off('phase-changed', onPhase);
      s.off('player-eliminated', onEliminated);
      s.off('timer-update', onTimer);
      s.off('game-over', onOver);
      s.off('detective-result', onDetective);
      s.off('notification', onNotification);
      s.off('game-terminated', onTerminated);
      s.off('error', onError);
    };
  }, [socketReady]);

  const createRoom = useCallback((name) => {
    const s = getSocket();
    if (!s) return;
    dispatch({ type: 'SET_LOADING', payload: true });
    s.emit('create-room', { name });
  }, []);

  const joinRoom = useCallback((roomId, name) => {
    const s = getSocket();
    if (!s) return;
    dispatch({ type: 'SET_LOADING', payload: true });
    s.emit('join-room', { roomId: roomId.trim().toLowerCase(), name });
  }, []);

  const startGame = useCallback(() => {
    getSocket()?.emit('start-game');
  }, []);

  const sendNightAction = useCallback((role, targetId) => {
    getSocket()?.emit('night-action', { role, targetId });
  }, []);

  const submitVote = useCallback((targetId) => {
    getSocket()?.emit('submit-vote', { targetId });
  }, []);

  const nextPhase = useCallback(() => {
    getSocket()?.emit('next-phase');
  }, []);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const clearNotification = useCallback(() => {
    dispatch({ type: 'NOTIFICATION', payload: null });
  }, []);

  const requestRestart = useCallback(() => {
    getSocket()?.emit('restart-game');
  }, []);

  const requestTerminate = useCallback(() => {
    getSocket()?.emit('terminate-game');
  }, []);

  const value = {
    ...state,
    isConnected: !!getSocket()?.connected,
    createRoom,
    joinRoom,
    startGame,
    sendNightAction,
    submitVote,
    nextPhase,
    resetGame,
    clearNotification,
    requestRestart,
    requestTerminate,
    PHASES,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

export { PHASES };
