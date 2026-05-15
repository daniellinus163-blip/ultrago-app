import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../components/ui/Screen';
import { PAYMENT_PROVIDER_CATALOG } from '../../services/payments/paymentProviderConfig';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { WalletStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<WalletStackParamList, 'AddPaymentMethodHub'>;

export function AddPaymentMethodHubScreen({ navigation }: Props) {
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Add a payment method to your Firebase profile. Live charges connect later via your secure backend — no card
          numbers are charged in this build.
        </Text>

        <Pressable
          style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
          onPress={() => navigation.navigate('AddDebitCard')}
        >
          <Ionicons name="card-outline" size={28} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.optionTitle}>Debit or credit card</Text>
            <Text style={styles.optionSub}>Save last 4 digits & expiry — tokenize with Stripe / Paystack later</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
          onPress={() => navigation.navigate('AddBankAccount')}
        >
          <Ionicons name="business-outline" size={28} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.optionTitle}>Bank account</Text>
            <Text style={styles.optionSub}>For direct debit / bank transfer when your payout rail is live</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />
        </Pressable>

        <Text style={styles.section}>Future integrations</Text>
        {PAYMENT_PROVIDER_CATALOG.map((p) => (
          <View key={p.id} style={styles.providerRow}>
            <Text style={styles.providerName}>{p.label}</Text>
            <Text style={styles.providerMeta}>{p.regions} · server env: {p.serverSecretEnv}</Text>
            <Text style={styles.providerStatus}>
              {p.status === 'ready_for_integration' ? 'Architecture ready' : 'Coming soon'}
            </Text>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  intro: {
    color: colors.textMuted,
    lineHeight: 20,
    fontSize: 14,
    marginBottom: spacing.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.md,
  },
  optionPressed: { opacity: 0.92 },
  optionTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  optionSub: { marginTop: 4, fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  section: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  providerRow: {
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.sm,
  },
  providerName: { fontWeight: '800', color: colors.text, fontSize: 15 },
  providerMeta: { marginTop: 4, fontSize: 12, color: colors.textMuted },
  providerStatus: { marginTop: 4, fontSize: 12, fontWeight: '700', color: colors.primary },
});
