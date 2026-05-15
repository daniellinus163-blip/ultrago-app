// @expo/metro-config sets `react-native` package export conditions on iOS/Android
// (required for Firebase Auth RN persistence via `firebase/auth` → `@firebase/auth`).
const fs = require('fs');
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const exclusionList = require('metro-config/private/defaults/exclusionList').default;

const projectRoot = __dirname;

/** Read EXPO_PUBLIC_* flags from appride/.env so Metro matches the running app. */
function loadPublicEnvFlagsFromDotEnv() {
  const envPath = path.join(projectRoot, '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }
  const text = fs.readFileSync(envPath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const match = trimmed.match(/^(EXPO_PUBLIC_[A-Z0-9_]+)\s*=\s*(.+)$/);
    if (match) {
      process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  }
}

loadPublicEnvFlagsFromDotEnv();

const useSpeechStub = process.env.EXPO_PUBLIC_VOICE_NATIVE !== '1';
const useGoogleSignInStub = process.env.EXPO_PUBLIC_GOOGLE_SIGNIN_NATIVE !== '1';
/** Expo Go SDK 53+ — Android remote push removed; stub silences LogBox errors. */
const useNotificationsStub = process.env.EXPO_PUBLIC_PUSH_NATIVE !== '1';

const config = getDefaultConfig(projectRoot);

const speechStubPath = path.join(projectRoot, 'src', 'shims', 'expo-speech-recognition.stub.ts');
const googleSignInStubPath = path.join(projectRoot, 'src', 'shims', 'google-signin.stub.ts');
const notificationsStubPath = path.join(projectRoot, 'src', 'shims', 'expo-notifications.stub.ts');

const upstreamBlockList = config.resolver.blockList;
const extraBlocks = [
  /@react-native-voice[/\\]\.voice-[^/\\]+[/\\].*/,
  /node_modules[/\\]@react-native-voice[/\\]\.[^/\\]+[/\\].*/,
];
if (useGoogleSignInStub) {
  extraBlocks.push(/node_modules[/\\]@react-native-google-signin[/\\].*/);
}
if (useSpeechStub) {
  extraBlocks.push(/node_modules[/\\]expo-speech-recognition[/\\].*/);
}
if (useNotificationsStub) {
  extraBlocks.push(/node_modules[/\\]expo-notifications[/\\].*/);
}
if (upstreamBlockList instanceof RegExp) {
  config.resolver.blockList = exclusionList([upstreamBlockList, ...extraBlocks]);
} else {
  config.resolver.blockList = exclusionList(extraBlocks);
}

if (useSpeechStub) {
  console.log('[metro] expo-speech-recognition → stub (Expo Go / EXPO_PUBLIC_VOICE_NATIVE≠1)');
}
if (useGoogleSignInStub) {
  console.log('[metro] @react-native-google-signin/google-signin → stub (Expo Go safe)');
}
if (useNotificationsStub) {
  console.log('[metro] expo-notifications → stub (Expo Go / EXPO_PUBLIC_PUSH_NATIVE≠1)');
}

const upstreamResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'expo-speech-recognition' && useSpeechStub) {
    return { type: 'sourceFile', filePath: speechStubPath };
  }
  if (moduleName === '@react-native-google-signin/google-signin' && useGoogleSignInStub) {
    return { type: 'sourceFile', filePath: googleSignInStubPath };
  }
  if (moduleName === 'expo-notifications' && useNotificationsStub) {
    return { type: 'sourceFile', filePath: notificationsStubPath };
  }
  if (typeof upstreamResolveRequest === 'function') {
    return upstreamResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
