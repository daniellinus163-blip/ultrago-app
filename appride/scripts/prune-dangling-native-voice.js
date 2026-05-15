/**
 * Metro on Windows can crash with ENOENT while watching paths like:
 *   node_modules/@react-native-voice/.voice-xxxx/...
 * when npm leaves a transient or broken install folder. Nothing in this app
 * depends on @react-native-voice directly — remove the scope if present so
 * each `npm start` begins from a clean tree for that name.
 */
const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', 'node_modules', '@react-native-voice');

try {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
    console.log('[prune-dangling-native-voice] Removed node_modules/@react-native-voice (safe to omit).');
  }
} catch (e) {
  console.warn('[prune-dangling-native-voice]', e && e.message ? e.message : e);
}
