import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { getSpeechRecognitionModule } from '../lib/expoSpeechRecognition';

type Options = {
  onFinalTranscript: (text: string) => void;
};

/**
 * Voice → destination query (Phase 7).
 * Works in Expo Go with the stub (shows a helpful message). Real mic needs a dev build.
 */
export function useDestinationVoiceSearch({ onFinalTranscript }: Options) {
  const speech = useMemo(() => getSpeechRecognitionModule(), []);
  const { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } = speech;

  const [listening, setListening] = useState(false);
  const pending = useRef<string>('');

  useSpeechRecognitionEvent('result', (ev) => {
    const t = ev.results?.[0]?.transcript?.trim();
    if (!t) {
      return;
    }
    pending.current = t;
    if (ev.isFinal) {
      onFinalTranscript(t);
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch {
        /* ignore */
      }
      setListening(false);
    }
  });

  useSpeechRecognitionEvent('error', () => {
    setListening(false);
  });

  useSpeechRecognitionEvent('end', () => {
    setListening(false);
  });

  const startListening = useCallback(async () => {
    try {
      if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
        const inExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
        Alert.alert(
          'Voice search',
          inExpoGo
            ? 'Expo Go does not include speech recognition. Use a dev build (`npx expo run:android`) and set EXPO_PUBLIC_VOICE_NATIVE=1 in appride/.env for voice search.'
            : 'Speech recognition is not available on this device.',
        );
        return;
      }
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Allow microphone and speech recognition to use voice search.');
        return;
      }
      pending.current = '';
      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        addsPunctuation: false,
      });
      setListening(true);
    } catch {
      Alert.alert('Voice search', 'Could not start listening. Try again or type your destination.');
      setListening(false);
    }
  }, [ExpoSpeechRecognitionModule]);

  const stopListening = useCallback(() => {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      /* ignore */
    }
    setListening(false);
  }, [ExpoSpeechRecognitionModule]);

  return { listening, startListening, stopListening };
}
