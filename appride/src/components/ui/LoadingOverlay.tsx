import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = {
  visible: boolean;
  message?: string;
};

/** Full-screen blocker while async work finishes (Firestore writes, auth, etc.). */
export function LoadingOverlay({ visible, message }: Props) {
  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color={colors.primary} />
          {message ? <Text style={styles.text}>{message}</Text> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    minWidth: 200,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    marginTop: spacing.md,
    color: colors.text,
    textAlign: 'center',
  },
});
