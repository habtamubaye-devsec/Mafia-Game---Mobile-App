/**
 * Mafia Game Server
 * Real-time multiplayer with Socket.io, in-memory room storage
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*' },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ============ CONSTANTS ============
const ROLES = {
  MAFIA: 'mafia',
  DOCTOR: 'doctor',
  DETECTIVE: 'detective',
  VILLAGER: 'villager',
};

const PHASES = {
  LOBBY: 'lobby',
  NIGHT: 'night',
  DAY: 'day',
  VOTING: 'voting',
  ENDED: 'ended',
};

const PHASE_DURATION_MS = {
  [PHASES.NIGHT]: 45 * 1000,
  [PHASES.DAY]: 60 * 1000,
  [PHASES.VOTING]: 30 * 1000,
};

const MIN_PLAYERS = 5; // 2 mafia + 1 doctor + 1 detective + 1 villager minimum
const MAFIA_COUNT = 2;

// ============ IN-MEMORY STORAGE ============
const rooms = new Map(); // roomId -> room object
const socketToRoom = new Map(); // socketId -> roomId
const socketToPlayerName = new Map(); // socketId -> playerName (for reconnection)

// ============ ROOM HELPERS ============

function createRoom(hostId, hostName) {
  const id = uuidv4().slice(0, 8);
  const room = {
    id,
    host: hostId,
    players: [
      { id: hostId, name: hostName, role: null, isAlive: true },
    ],
    phase: PHASES.LOBBY,
    round: 0,
    votes: {}, // playerId -> targetId
    nightActions: {}, // role -> { targetId }
    timerEnd: null,
    timerInterval: null,
    winner: null, // 'mafia' | 'town' when ended
  };
  rooms.set(id, room);
  socketToRoom.set(hostId, id);
  socketToPlayerName.set(hostId, hostName);
  console.log('[Server] Room created:', id, 'by', hostName);
  return room;
}

function getRoomBySocket(socketId) {
  const roomId = socketToRoom.get(socketId);
  return roomId ? rooms.get(roomId) : null;
}

function assignRoles(room) {
  const count = room.players.length;
  const roles = [ROLES.MAFIA, ROLES.MAFIA, ROLES.DOCTOR, ROLES.DETECTIVE];
  for (let i = roles.length; i < count; i++) roles.push(ROLES.VILLAGER);
  // Shuffle
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }
  room.players.forEach((p, i) => {
    p.role = roles[i];
    p.isAlive = true;
  });
  room.round = 1;
  room.phase = PHASES.NIGHT;
  room.votes = {};
  room.nightActions = {};
}

function getPublicRoomState(room) {
  return {
    id: room.id,
    host: room.host,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      role: null, // never send role to others
      isAlive: p.isAlive,
    })),
    phase: room.phase,
    round: room.round,
    winner: room.winner,
  };
}

function getAlivePlayers(room) {
  return room.players.filter((p) => p.isAlive);
}

function getAliveMafia(room) {
  return room.players.filter((p) => p.isAlive && p.role === ROLES.MAFIA);
}

function getAliveTown(room) {
  return room.players.filter((p) => p.isAlive && (p.role !== ROLES.MAFIA));
}

function checkWinCondition(room) {
  const mafia = getAliveMafia(room).length;
  const town = getAliveTown(room).length;
  if (mafia === 0) return 'town';
  if (mafia >= town) return 'mafia';
  return null;
}

function clearPhaseTimer(room) {
  if (room.timerInterval) {
    clearInterval(room.timerInterval);
    room.timerInterval = null;
  }
  room.timerEnd = null;
}

function startPhaseTimer(room, phase, io, roomId) {
  clearPhaseTimer(room);
  const duration = PHASE_DURATION_MS[phase];
  if (!duration) return;
  room.timerEnd = Date.now() + duration;
  const phaseLabels = { [PHASES.NIGHT]: 'Night', [PHASES.DAY]: 'Day', [PHASES.VOTING]: 'Voting' };
  const emitTimer = () => {
    const remaining = Math.max(0, Math.ceil((room.timerEnd - Date.now()) / 1000));
    io.to(roomId).emit('timer-update', { remaining, phase: room.phase });
    if (remaining <= 0) {
      clearPhaseTimer(room);
      const label = phaseLabels[room.phase] || room.phase;
      emitNotification(io, roomId, `${label} phase time is up. Moving to the next phase...`, 'Time\'s up!');
      nextPhase(room, io, roomId);
    }
  };
  emitTimer();
  room.timerInterval = setInterval(emitTimer, 1000);
}

function emitNotification(io, roomId, message, title = 'Game Update') {
  io.to(roomId).emit('notification', { title, message });
}

function nextPhase(room, io, roomId) {
  clearPhaseTimer(room);
  const alive = getAlivePlayers(room);

  if (room.phase === PHASES.NIGHT) {
    // Resolve night: kill (unless saved), then send results
    const mafiaTarget = room.nightActions[ROLES.MAFIA]?.targetId;
    const doctorTarget = room.nightActions[ROLES.DOCTOR]?.targetId;
    let killedId = mafiaTarget && mafiaTarget !== doctorTarget ? mafiaTarget : null;
    if (killedId) {
      const victim = room.players.find((p) => p.id === killedId);
      if (victim) {
        victim.isAlive = false;
        io.to(roomId).emit('player-eliminated', { playerId: killedId, reason: 'night' });
      }
    }
    io.to(roomId).emit('room-updated', getPublicRoomState(room));
    room.nightActions = {};
    room.phase = PHASES.DAY;
    emitNotification(io, roomId, 'Night has ended. Day phase has started — discuss and prepare for voting.', 'Night ended');
    io.to(roomId).emit('phase-changed', { phase: PHASES.DAY, round: room.round });
    io.to(roomId).emit('room-updated', getPublicRoomState(room));
    startPhaseTimer(room, PHASES.DAY, io, roomId);
    return;
  }

  if (room.phase === PHASES.DAY) {
    room.phase = PHASES.VOTING;
    room.votes = {};
    emitNotification(io, roomId, 'Discussion time is over. Voting has started — vote for a player to eliminate.', 'Day ended');
    io.to(roomId).emit('phase-changed', { phase: PHASES.VOTING, round: room.round });
    io.to(roomId).emit('room-updated', getPublicRoomState(room));
    startPhaseTimer(room, PHASES.VOTING, io, roomId);
    return;
  }

  if (room.phase === PHASES.VOTING) {
    // Tally votes
    const voteCount = {};
    Object.values(room.votes).forEach((targetId) => {
      if (alive.some((p) => p.id === targetId)) {
        voteCount[targetId] = (voteCount[targetId] || 0) + 1;
      }
    });
    let maxVotes = 0;
    let eliminatedId = null;
    Object.entries(voteCount).forEach(([id, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        eliminatedId = id;
      }
    });
    const ROLE_LABELS = { mafia: 'Mafia', doctor: 'Doctor', detective: 'Detective', villager: 'Villager' };
    if (eliminatedId) {
      const victim = room.players.find((p) => p.id === eliminatedId);
      if (victim) {
        victim.isAlive = false;
        const roleLabel = ROLE_LABELS[victim.role] || victim.role || 'Unknown';
        emitNotification(io, roomId, `${victim.name} (${roleLabel}) has been eliminated by vote. The night phase starts now.`, 'Vote ended');
        io.to(roomId).emit('player-eliminated', { playerId: eliminatedId, reason: 'vote', playerName: victim.name, playerRole: victim.role });
      }
    } else {
      emitNotification(io, roomId, 'No one was eliminated (tie or no votes). The night phase starts now.', 'Vote ended');
    }
    io.to(roomId).emit('room-updated', getPublicRoomState(room));
    room.votes = {};
    const winner = checkWinCondition(room);
    if (winner) {
      room.phase = PHASES.ENDED;
      room.winner = winner;
      clearPhaseTimer(room);
      const playersWithRoles = room.players.map((p) => ({ id: p.id, name: p.name, role: p.role, isAlive: p.isAlive }));
      const winnerLabel = winner === 'town' ? 'Town' : 'Mafia';
      emitNotification(io, roomId, `Game over! ${winnerLabel} wins. Check the results to see everyone's role.`, 'Game Over');
      io.to(roomId).emit('game-over', { winner, playersWithRoles });
      return;
    }
    // Next night
    room.round += 1;
    room.phase = PHASES.NIGHT;
    room.nightActions = {};
    io.to(roomId).emit('phase-changed', { phase: PHASES.NIGHT, round: room.round });
    io.to(roomId).emit('room-updated', getPublicRoomState(room));
    startPhaseTimer(room, PHASES.NIGHT, io, roomId);
  }
}

// ============ SOCKET HANDLERS ============

io.on('connection', (socket) => {
  console.log('[Server] Client connected:', socket.id);

  socket.on('create-room', (data) => {
    const name = (data?.name || 'Player').trim() || 'Player';
    const room = createRoom(socket.id, name);
    socket.join(room.id);
    socket.emit('room-updated', getPublicRoomState(room));
    console.log('[Server] create-room:', room.id);
  });

  socket.on('join-room', (data) => {
    const roomId = (data?.roomId || '').trim().toLowerCase();
    const name = (data?.name || 'Player').trim() || 'Player';
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit('error', { message: 'Room not found. Please check the room code and try again.' });
      return;
    }
    if (room.phase !== PHASES.LOBBY) {
      socket.emit('error', { message: 'This game has already started. Join another room or wait for the next round.' });
      return;
    }
    if (room.players.some((p) => p.id === socket.id)) {
      socket.emit('room-updated', getPublicRoomState(room));
      return;
    }
    if (room.players.length >= 10) {
      socket.emit('error', { message: 'This room is full (max 10 players). Try another room.' });
      return;
    }
    room.players.push({ id: socket.id, name, role: null, isAlive: true });
    socketToRoom.set(socket.id, roomId);
    socketToPlayerName.set(socket.id, name);
    socket.join(roomId);
    socket.emit('room-updated', getPublicRoomState(room));
    io.to(roomId).emit('room-updated', getPublicRoomState(room));
    console.log('[Server] join-room:', roomId, name);
  });

  socket.on('start-game', () => {
    const room = getRoomBySocket(socket.id);
    if (!room) {
      socket.emit('error', { message: 'You are not in a room. Create or join a room first.' });
      return;
    }
    if (room.phase !== PHASES.LOBBY) {
      socket.emit('error', { message: 'The game has already started.' });
      return;
    }
    if (room.host !== socket.id) {
      socket.emit('error', { message: 'Only the host can start the game.' });
      return;
    }
    if (room.players.length < MIN_PLAYERS) {
      socket.emit('error', { message: `At least ${MIN_PLAYERS} players are needed to start. Waiting for more players...` });
      return;
    }
    assignRoles(room);
    room.phase = PHASES.NIGHT;
    room.nightActions = {};
    room.votes = {};
    // Send each player their role privately
    room.players.forEach((p) => {
      io.to(p.id).emit('your-role', { role: p.role });
      io.to(p.id).emit('game-started', getPublicRoomState(room));
    });
    io.to(room.id).emit('phase-changed', { phase: PHASES.NIGHT, round: room.round });
    startPhaseTimer(room, PHASES.NIGHT, io, room.id);
    console.log('[Server] Game started in room:', room.id);
  });

  socket.on('night-action', (data) => {
    const room = getRoomBySocket(socket.id);
    if (!room || room.phase !== PHASES.NIGHT) return;
    const player = room.players.find((p) => p.id === socket.id);
    if (!player || !player.isAlive) return;
    const { role, targetId } = data || {};
    if (!role || !targetId) return;
    if (player.role !== role) return;
    const target = room.players.find((p) => p.id === targetId);
    if (!target || !target.isAlive) return;
    if (!room.nightActions[role]) room.nightActions[role] = {};
    if (role === ROLES.MAFIA) {
      room.nightActions[ROLES.MAFIA].targetId = targetId;
    } else if (role === ROLES.DOCTOR) {
      room.nightActions[ROLES.DOCTOR].targetId = targetId;
    } else if (role === ROLES.DETECTIVE) {
      room.nightActions[ROLES.DETECTIVE] = { targetId, isMafia: target.role === ROLES.MAFIA };
      io.to(socket.id).emit('detective-result', { isMafia: target.role === ROLES.MAFIA });
    }
  });

  socket.on('submit-vote', (data) => {
    const room = getRoomBySocket(socket.id);
    if (!room || room.phase !== PHASES.VOTING) return;
    const player = room.players.find((p) => p.id === socket.id);
    if (!player || !player.isAlive) return;
    const targetId = data?.targetId;
    if (!targetId) return;
    const target = room.players.find((p) => p.id === targetId);
    if (!target || !target.isAlive) return;
    room.votes[socket.id] = targetId;
    io.to(room.id).emit('room-updated', getPublicRoomState(room));
  });

  socket.on('next-phase', () => {
    const room = getRoomBySocket(socket.id);
    if (!room) return;
    if (room.host !== socket.id) return;
    if (room.phase === PHASES.ENDED) return;
    nextPhase(room, io, room.id);
  });

  socket.on('restart-game', () => {
    const room = getRoomBySocket(socket.id);
    if (!room) {
      socket.emit('error', { message: 'You are not in a room.' });
      return;
    }
    if (room.phase !== PHASES.ENDED) {
      socket.emit('error', { message: 'You can only restart after the game has ended.' });
      return;
    }
    if (room.host !== socket.id) {
      socket.emit('error', { message: 'Only the host can restart the game.' });
      return;
    }
    // Reset room to new game with same players (same socket IDs)
    room.winner = null;
    room.round = 0;
    room.votes = {};
    room.nightActions = {};
    assignRoles(room); // sets phase = NIGHT, round = 1, assigns roles
    room.nightActions = {};
    room.votes = {};
    const roomState = getPublicRoomState(room);
    // Broadcast game-started to entire room first so everyone gets the new phase/round
    io.to(room.id).emit('game-started', roomState);
    room.players.forEach((p) => {
      io.to(p.id).emit('your-role', { role: p.role });
    });
    emitNotification(io, room.id, 'A new game has started with the same players. Good luck!', 'Game restarted');
    io.to(room.id).emit('phase-changed', { phase: PHASES.NIGHT, round: room.round });
    startPhaseTimer(room, PHASES.NIGHT, io, room.id);
    console.log('[Server] Game restarted in room:', room.id);
  });

  socket.on('terminate-game', () => {
    const room = getRoomBySocket(socket.id);
    if (!room) {
      socket.emit('error', { message: 'You are not in a room.' });
      return;
    }
    if (room.phase !== PHASES.ENDED && room.phase !== PHASES.LOBBY) {
      socket.emit('error', { message: 'You can only terminate when the game has ended or in the lobby.' });
      return;
    }
    if (room.host !== socket.id) {
      socket.emit('error', { message: 'Only the host can terminate the game.' });
      return;
    }
    const playerIds = room.players.map((p) => p.id);
    clearPhaseTimer(room);
    io.to(room.id).emit('game-terminated', { message: 'The host has ended the game. You have been returned to the home screen.' });
    rooms.delete(room.id);
    playerIds.forEach((id) => socketToRoom.delete(id));
    console.log('[Server] Game terminated, room removed:', room.id);
  });

  socket.on('disconnect', (reason) => {
    const room = getRoomBySocket(socket.id);
    if (room) {
      socketToRoom.delete(socket.id);
      io.to(room.id).emit('room-updated', getPublicRoomState(room));
    }
    console.log('[Server] Client disconnected:', socket.id, reason);
  });
});

// ============ HTTP SERVER ============
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Mafia server running on port ${PORT}`);
  console.log(`[Server] Connect from devices using http://<this-machine-ip>:${PORT}`);
});
