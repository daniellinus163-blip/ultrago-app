/**
 * Pure-JS stub for `expo-speech-recognition` when no native module is present
 * (Expo Go, web smoke tests, or any build without the native binary).
 *
 * Metro resolves `expo-speech-recognition` → this file unless
 * `EXPO_PUBLIC_VOICE_NATIVE=1` (see `metro.config.js`).
 */
import { useEffect } from 'react';

export const ExpoSpeechRecognitionModule = {
  isRecognitionAvailable(): boolean {
    return false;
  },
  async requestPermissionsAsync(): Promise<{ granted: boolean; status: string }> {
    return { granted: false, status: 'denied' };
  },
  start(_options?: Record<string, unknown>): void {},
  stop(): void {},
};

export function useSpeechRecognitionEvent(
  _eventName: string,
  _listener: (event: { results?: { transcript?: string }[]; isFinal?: boolean }) => void,
): void {
  useEffect(() => {
    return () => {};
  }, [_eventName]);
}
