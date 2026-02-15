/**
 * Socket.io client service – single connection, reconnection handled by socket.io
 * Uses polling first (more reliable on mobile/cross-network), then upgrades to WebSocket.
 */

import { io } from 'socket.io-client';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3001';

let socket = null;
let onReadyCallback = null;
let onConnectError = null;

export const getSocket = () => socket;

/** Call this to be notified when the socket connects (so you can attach listeners). */
export const onSocketReady = (callback) => {
  onReadyCallback = callback;
  return () => { onReadyCallback = null; };
};

export const connectSocket = (url = SOCKET_URL) => {
  const baseUrl = (url?.trim() || SOCKET_URL).replace(/\/$/, ''); // no trailing slash
  if (socket?.connected && socket.io?.uri?.replace(/\/$/, '') === baseUrl) return socket;

  // Disconnect existing socket when changing URL
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  console.log('[Socket] Connecting to', baseUrl);
  socket = io(baseUrl, {
    path: '/socket.io',
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 25000,
    forceNew: true,
  });
  socket.on('connect', () => {
    console.log('[Socket] Connected', socket.id);
    if (onReadyCallback) onReadyCallback();
  });
  socket.on('disconnect', (reason) => console.log('[Socket] Disconnected', reason));
  socket.on('connect_error', (err) => {
    console.log('[Socket] Error', err.message);
    if (onConnectError) onConnectError(err);
  });
  return socket;
};

export const setOnConnectError = (callback) => {
  onConnectError = callback;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    console.log('[Socket] Disconnected and cleared');
  }
};

export default { getSocket, connectSocket, disconnectSocket };
