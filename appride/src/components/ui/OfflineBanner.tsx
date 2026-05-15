import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) {
    return null;
  }
  return (
    <View style={styles.bar} accessibilityRole="alert">
      <Text style={styles.txt}>You are offline — actions will queue until you reconnect.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: 'rgba(248,113,113,0.95)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  txt: { color: colors.textOnGold, fontWeight: '700', fontSize: 13, textAlign: 'center' },
});
