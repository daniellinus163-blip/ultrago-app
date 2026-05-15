/// <reference types="node" />
import fs from 'fs';
import path from 'path';
import type { ConfigContext, ExpoConfig } from 'expo/config';

/** Prefer `__dirname` when Expo evaluates as CJS; else cwd (run from `appride/`). */
const configDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
const googleServicesJsonPath = path.join(configDir, 'google-services.json');
const hasGoogleServicesJson = fs.existsSync(googleServicesJsonPath);

/** OTA updates only when you explicitly opt in (production EAS builds). Never in Expo Go / Metro dev. */
const otaUpdatesEnabled = process.env.EXPO_PUBLIC_ENABLE_OTA_UPDATES === '1';

/**
 * Dynamic Expo config lets students keep secrets in `.env` (EXPO_PUBLIC_*)
 * instead of hard-coding API keys inside the repo.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

  const speechRecognitionPlugin: [string, Record<string, string>] = [
    'expo-speech-recognition',
    {
      microphonePermission: 'UltraGo uses the microphone for voice destination search.',
      speechRecognitionPermission:
        'UltraGo uses speech recognition to turn your voice into addresses.',
    },
  ];

  return {
    ...config,
    name: 'UltraGo',
    slug: 'appride',
    /**
     * Do NOT spread `config.updates` — that can keep an EAS `url` and trigger
     * "java.io.IOException: Failed to download remote update" in Expo Go on Android.
     */
    updates: otaUpdatesEnabled
      ? {
          enabled: true,
          checkAutomatically: 'ON_LOAD',
          url: `https://u.expo.dev/${process.env.EAS_PROJECT_ID ?? '866a29bf-39ec-4142-9368-865b36c5995a'}`,
        }
      : {
          enabled: false,
          checkAutomatically: 'NEVER',
          fallbackToCacheTimeout: 0,
        },
    runtimeVersion: otaUpdatesEnabled ? config.runtimeVersion : undefined,
    plugins: [
      ...(config.plugins ?? []),
      'expo-font',
      ...(process.env.EXPO_PUBLIC_GOOGLE_SIGNIN_NATIVE === '1'
        ? ['@react-native-google-signin/google-signin']
        : []),
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'UltraGo uses your location to show the map, match rides, and update trip status.',
        },
      ],
      ...(process.env.EXPO_PUBLIC_PUSH_NATIVE === '1'
        ? [
            [
              'expo-notifications',
              {
                icon: './assets/uberlogo.png',
                color: '#FBC02D',
              },
            ] as [string, Record<string, string>],
          ]
        : []),
      [
        'expo-image-picker',
        {
          photosPermission: 'UltraGo needs access to your photos to set a profile picture.',
          cameraPermission: 'UltraGo can use the camera if you prefer to take a new profile photo.',
        },
      ],
      ...(process.env.EXPO_PUBLIC_VOICE_NATIVE === '1' ? [speechRecognitionPlugin] : []),
    ],
    extra: {
      ...config.extra,
      firebase: {
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
        storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
        messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
        appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
      },
      googleMapsApiKey,
      googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
      /** EAS project id for cloud builds only — not used for OTA while updates.enabled is false. */
      eas: {
        projectId: process.env.EAS_PROJECT_ID ?? '866a29bf-39ec-4142-9368-865b36c5995a',
      },
    },
    ios: {
      ...config.ios,
      bundleIdentifier: 'com.ultrago.app',
      config: {
        ...config.ios?.config,
        googleMapsApiKey,
      },
    },
    android: {
      ...config.android,
      package: 'com.ultrago.app',
      ...(hasGoogleServicesJson ? { googleServicesFile: './google-services.json' as const } : {}),
      config: {
        ...config.android?.config,
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
  };
};
