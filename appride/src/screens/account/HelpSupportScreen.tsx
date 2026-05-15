import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../components/ui/Screen';
import type { AccountStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { AccountMenuRow } from './AccountMenuRow';

type Props = NativeStackScreenProps<AccountStackParamList, 'HelpSupport'>;

export function HelpSupportScreen({ navigation }: Props) {
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.menuCard}>
          <AccountMenuRow
            icon="help-buoy-outline"
            title="FAQ"
            subtitle="Common questions"
            onPress={() => navigation.navigate('FAQ')}
          />
          <AccountMenuRow
            icon="mail-outline"
            title="Contact support"
            subtitle="Email our team"
            onPress={() => navigation.navigate('ContactSupport')}
          />
        </View>

        <Text style={styles.blockTitle}>Safety tips</Text>
        <View style={styles.block}>
          <Text style={styles.blockBody}>
            Always confirm the vehicle and driver match what you see in the app before you get in. Share trip
            status with someone you trust when riding at night. For food delivery, check that sealed packaging
            looks intact at handoff.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xl * 2,
  },
  menuCard: {
    marginTop: spacing.md,
    marginHorizontal: spacing.lg,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  blockTitle: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  block: {
    marginTop: spacing.md,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  blockBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
});
