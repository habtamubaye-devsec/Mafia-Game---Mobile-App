# Mafia Server

Real-time game server for the Mafia multiplayer game (Node.js + Express + Socket.io).

## Run

```bash
cd mafia-server
npm install
npm start
```

Server listens on **port 3001** by default. To use another port:

```bash
PORT=4000 npm start
```

## Connect from other devices

1. Find your machine's local IP (e.g. `192.168.1.100` on Linux: `ip addr` or `hostname -I`).
2. On each phone/device, in the app set **Server URL** to `http://YOUR_IP:3001` (e.g. `http://192.168.1.100:3001`).
3. Ensure all devices are on the same Wi‑Fi and that your firewall allows inbound TCP on port 3001.

## Debug logs

The server logs to console: room creation, joins, game start, and client connect/disconnect.
