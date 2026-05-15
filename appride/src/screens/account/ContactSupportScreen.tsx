import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../components/ui/AppButton';
import { AppTextField } from '../../components/ui/AppTextField';
import { Screen } from '../../components/ui/Screen';
import { useAuth } from '../../context/AuthContext';
import type { AccountStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<AccountStackParamList, 'ContactSupport'>;

const SUPPORT_EMAIL = 'support@ultrago.app';

export function ContactSupportScreen({}: Props) {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  function send() {
    const sub = subject.trim() || 'UltraGo support request';
    const text = body.trim();
    if (!text) {
      Alert.alert('Message required', 'Please describe your issue so we can help.');
      return;
    }
    const uidLine = user?.uid ? `\n\nUser id: ${user.uid}` : '';
    const fullBody = encodeURIComponent(`${text}${uidLine}`);
    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(sub)}&body=${fullBody}`;
    Linking.openURL(mailto).catch(() => {
      Alert.alert('Could not open mail', `Reach us at ${SUPPORT_EMAIL}`);
    });
  }

  return (
    <Screen keyboardAvoid>
      <Text style={styles.hint}>
        We open your email app with a pre-filled message. Nothing is sent until you press send in that app.
      </Text>
      <View style={styles.pad}>
        <AppTextField label="Subject (optional)" value={subject} onChangeText={setSubject} />
        <AppTextField
          label="How can we help?"
          value={body}
          onChangeText={setBody}
          placeholder="Describe what happened…"
          multiline
          style={styles.multiline}
        />
        <AppButton title="Open email app" variant="primary" onPress={send} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hint: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  pad: {
    padding: spacing.lg,
  },
  multiline: {
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
});
