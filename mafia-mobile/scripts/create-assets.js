#!/usr/bin/env node
/**
 * Create minimal placeholder PNGs for Expo (icon, splash, adaptive-icon).
 * Run: node scripts/create-assets.js
 */
const fs = require('fs');
const path = require('path');

// Minimal valid 1x1 PNG (transparent)
const MINIMAL_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const assetsDir = path.join(__dirname, '..', 'assets');
const buffer = Buffer.from(MINIMAL_PNG_BASE64, 'base64');

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

const files = ['icon.png', 'splash.png', 'adaptive-icon.png'];
files.forEach((file) => {
  fs.writeFileSync(path.join(assetsDir, file), buffer);
  console.log('Created', file);
});
