/**
 * Removes stale Expo dev manifests that can still point at EAS Update URLs
 * and cause: java.io.IOException: Failed to download remote update
 */
const fs = require('fs');
const path = require('path');

const targets = [
  path.join(__dirname, '..', '.expo'),
  path.join(__dirname, '..', 'node_modules', '.cache'),
];

for (const target of targets) {
  try {
    if (fs.existsSync(target)) {
      fs.rmSync(target, { recursive: true, force: true });
      console.log('[clear-expo-cache] Removed', target);
    }
  } catch (e) {
    console.warn('[clear-expo-cache]', e && e.message ? e.message : e);
  }
}
