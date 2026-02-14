# Mafia Mobile (Expo)

React Native (Expo) client for the real-time Mafia game.

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo Go app on your phone (for device testing), or Android emulator / iOS simulator

## Setup and run

1. **Install dependencies**

   ```bash
   cd mafia-mobile
   npm install
   ```

2. **Create Expo assets (if missing)**

   If you see errors about missing `assets/icon.png` or `assets/splash.png`, create a minimal Expo app and copy its assets:

   ```bash
   cd ..
   npx create-expo-app mafia-mobile-temp --template blank
   cp -r mafia-mobile-temp/assets mafia-mobile/
   rm -rf mafia-mobile-temp
   cd mafia-mobile
   ```

   Or create the folder and add any 1024x1024 PNG as `assets/icon.png` and a splash image as `assets/splash.png`.

3. **Start the app**

   ```bash
   npx expo start
   ```

   Then scan the QR code with Expo Go (Android/iOS) or press `a` for Android emulator / `i` for iOS simulator.

## Connecting to the server

- **Same machine (emulator/simulator):** Use `http://localhost:3001` as Server URL.
- **Physical device on same Wi‑Fi:** Use your computer’s IP, e.g. `http://192.168.1.100:3001`, in the **Server URL** field on the Home screen.

## Testing with multiple devices

1. Start **mafia-server** on your computer (see `mafia-server/README.md`).
2. Get your computer’s local IP (e.g. `192.168.1.100`).
3. On each device, open the Expo app and set Server URL to `http://YOUR_IP:3001`.
4. One device: **Create room**, note the room code.
5. Other devices: **Join room** and enter the same room code and a name.
6. When at least 5 players are in the lobby, the host taps **Start game**.
7. Play through night (mafia/doctor/detective actions), day, and voting until the game ends.

## Error handling

- **"Room not found"** – Wrong room code or server not reachable; check Server URL and that the server is running.
- **"Need at least 5 players"** – Host can start only when there are 5+ players.
- **Connection errors** – Ensure Server URL uses the correct IP and port and that the device can reach the host (same network, firewall allows port 3001).

## Debug logs

Socket and game events are logged to the JS console (Expo dev tools or terminal where `expo start` is running).
