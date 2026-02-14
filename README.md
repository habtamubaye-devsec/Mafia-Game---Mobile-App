# Mafia – Real-time multiplayer game

Two-part project: **mafia-server** (Node.js + Socket.io) and **mafia-mobile** (React Native Expo).

## Project structure

```
mafia/
├── mafia-server/          # Game server
│   ├── package.json
│   ├── server.js
│   └── README.md
├── mafia-mobile/          # Expo app
│   ├── App.js
│   ├── package.json
│   ├── app.json
│   ├── babel.config.js
│   ├── src/
│   │   ├── navigation/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── context/
│   │   └── socket/
│   └── README.md
├── PROJECT_STRUCTURE.md
└── README.md (this file)
```

## Quick start

### 1. Run the server

```bash
cd mafia-server
npm install
npm start
```

Server runs on **http://0.0.0.0:3001** (all interfaces). Note your machine’s local IP for devices (e.g. `192.168.1.100`).

### 2. Run the Expo app

```bash
cd mafia-mobile
npm install
npx expo start
```

- **Emulator/Simulator:** Use Server URL `http://localhost:3001` on Home screen.
- **Physical device:** Use `http://YOUR_PC_IP:3001` (same Wi‑Fi as the PC).

### 3. Connect via local IP (multiple devices)

1. On the PC: `ip addr` (Linux) or `ipconfig` (Windows) to get the local IP (e.g. `192.168.1.100`).
2. On each phone: install **Expo Go**, open the project (QR from `expo start`), then on the Home screen set **Server URL** to `http://192.168.1.100:3001`.
3. One device: **Create room** → share the **room code**.
4. Others: **Join room** → enter room code and name.
5. With **5+ players**, host taps **Start game**. Play night → day → voting until Mafia or Town wins.

## Game rules (summary)

- **Roles:** 2 Mafia, 1 Doctor, 1 Detective, rest Villagers.
- **Phases:** Lobby → Night → Day → Voting → (repeat or Game Over).
- **Night:** Mafia pick a kill, Doctor picks a save, Detective checks one player (result is private).
- **Day:** Discussion only.
- **Voting:** Alive players vote; highest votes is eliminated.
- **Win:** Mafia win if mafia count ≥ town; Town win if all Mafia are eliminated.

## Tech stack

| Part        | Stack |
|------------|--------|
| Server     | Node.js, Express, Socket.io, uuid, cors |
| Mobile     | React Native (Expo), React Navigation (native stack), Context API, socket.io-client |

No external UI libraries; dark theme with basic React Native components.

## Troubleshooting

- **Can’t connect from phone:** Same Wi‑Fi, correct Server URL (`http://IP:3001`), firewall allows port 3001.
- **Missing assets in Expo:** See `mafia-mobile/README.md` (create default Expo assets or copy from a blank template).
- **“Room not found”:** Server running, correct room code, Server URL correct on all clients.

For more detail, see **mafia-server/README.md** and **mafia-mobile/README.md**.
