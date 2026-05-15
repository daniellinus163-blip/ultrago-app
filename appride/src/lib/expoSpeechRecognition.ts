import * as speechStub from '../shims/expo-speech-recognition.stub';

export type SpeechRecognitionModule = typeof speechStub.ExpoSpeechRecognitionModule;

/**
 * Expo Go always uses the JS stub (no native speech binary).
 * Real voice search is enabled only in a dev build with EXPO_PUBLIC_VOICE_NATIVE=1.
 */
export function getSpeechRecognitionModule(): typeof speechStub {
  return speechStub;
}
