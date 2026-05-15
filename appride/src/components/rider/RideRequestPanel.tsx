import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../ui/AppButton';
import { AppTextField } from '../ui/AppTextField';
import { useAuth } from '../../context/AuthContext';
import { runPaymentGate } from '../../services/payments/runPaymentGate';
import { createRideRequest } from '../../services/rides/rideService';
import { usePaymentMethodsStore } from '../../store/paymentMethodsStore';
import { useWalletStore } from '../../store/walletStore';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { MainTabParamList } from '../../navigation/types';
import type { GeoPoint } from '../../types/geo';
import type { RideServiceCategory } from '../../types/rideServiceCategory';
import { RIDE_SERVICE_LABELS } from '../../types/rideServiceCategory';
import { estimateFareWithCategory } from '../../utils/fareEstimate';
import { formatDemandLabel, getDemandMultiplier } from '../../utils/demandPricing';
import { ensureCustomerPaymentMethod } from '../../utils/paymentMethodGate';

type Props = {
  riderId: string;
  pickup: GeoPoint;
  destination: GeoPoint;
  rideCategory: RideServiceCategory;
  pickupLabelText: string;
  destinationLabelText: string;
  nearbyLiveDriverCount: number;
  onRideCreated: (rideId: string) => void;
};

/**
 * Bottom-sheet style panel (Phase 2). Requires a saved payment method in Firestore before requesting.
 */
export function RideRequestPanel({
  riderId,
  pickup,
  destination,
  rideCategory,
  pickupLabelText,
  destinationLabelText,
  nearbyLiveDriverCount,
  onRideCreated,
}: Props) {
  const tabNav = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { user, profile } = useAuth();
  const [pickupLabel, setPickupLabel] = useState(pickupLabelText);
  const [destinationLabel, setDestinationLabel] = useState(destinationLabelText);
  const [busy, setBusy] = useState(false);

  const ridePromoPercent = useWalletStore((s) => s.ridePromoPercent);
  const discountedRideFare = useWalletStore((s) => s.discountedRideFare);
  const defaultMethod = usePaymentMethodsStore((s) => s.methods.find((m) => m.isDefault) ?? s.methods[0]);

  useEffect(() => {
    setPickupLabel(pickupLabelText);
  }, [pickupLabelText]);

  useEffect(() => {
    setDestinationLabel(destinationLabelText);
  }, [destinationLabelText]);

  const demandMult = useMemo(
    () => getDemandMultiplier(new Date(), nearbyLiveDriverCount),
    [nearbyLiveDriverCount],
  );

  const baseFare = useMemo(
    () => estimateFareWithCategory(pickup, destination, rideCategory),
    [pickup, destination, rideCategory],
  );

  const demandAdjustedFare = useMemo(
    () => Math.round(baseFare * demandMult * 100) / 100,
    [baseFare, demandMult],
  );

  const { fare: finalFare, discount } = useMemo(
    () => discountedRideFare(demandAdjustedFare),
    [demandAdjustedFare, discountedRideFare, ridePromoPercent],
  );

  async function onRequest() {
    if (!ensureCustomerPaymentMethod(tabNav)) {
      return;
    }
    setBusy(true);
    try {
      if (!user) {
        return;
      }
      const paid = await runPaymentGate({
        uid: user.uid,
        email: user.email,
        amount: finalFare,
        context: 'ride_request',
        metadata: { paymentMethodId: defaultMethod?.id, rideCategory },
      });
      if (!paid) {
        return;
      }

      const rideId = await createRideRequest({
        riderId,
        pickup,
        destination,
        fareEstimate: finalFare,
        rideCategory,
        pickupLabel,
        destinationLabel,
        paymentMethodId: defaultMethod?.id,
      });
      onRideCreated(rideId);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not request ride.';
      Alert.alert('Request failed', message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Request ride</Text>
      <Text style={styles.caption}>
        {RIDE_SERVICE_LABELS[rideCategory]} · labels sync with search & map (editable).
      </Text>
      <AppTextField label="Pickup" value={pickupLabel} onChangeText={setPickupLabel} />
      <AppTextField label="Destination" value={destinationLabel} onChangeText={setDestinationLabel} />
      {defaultMethod ? (
        <Text style={styles.payLine}>
          Pay with ·{' '}
          <Text style={styles.payBold}>
            {defaultMethod.type === 'bank_account'
              ? `${defaultMethod.bankName ?? 'Bank'} •••• ${defaultMethod.last4}`
              : `${(defaultMethod.brand ?? 'card').toUpperCase()} •••• ${defaultMethod.last4}`}
          </Text>
        </Text>
      ) : (
        <Text style={styles.payWarn}>Add a payment method in Wallet before requesting.</Text>
      )}
      {discount > 0 ? (
        <Text style={styles.discountLine}>Promo · −${discount.toFixed(2)} on this ride</Text>
      ) : null}
      <Text style={styles.demandLine}>
        {formatDemandLabel(demandMult)} · ×{demandMult.toFixed(2)} on category fare
      </Text>
      <View style={styles.fareRow}>
        <Text style={styles.fareLabel}>Estimated fare</Text>
        <Text style={styles.fareValue}>${finalFare.toFixed(2)}</Text>
      </View>
      <Text style={styles.chargeNote}>
        Phase 5 — payment method required. Nearby drivers receive your request with accept/reject.
      </Text>
      <AppButton title="Request ride" loading={busy} onPress={() => void onRequest()} />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  caption: {
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    lineHeight: 18,
    fontSize: 13,
  },
  payLine: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  payBold: { color: colors.primary, fontWeight: '800' },
  payWarn: {
    fontSize: 13,
    color: colors.accentOrange,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  discountLine: {
    fontSize: 13,
    color: colors.success,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  demandLine: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: spacing.sm,
    lineHeight: 17,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
    paddingVertical: spacing.sm,
  },
  fareLabel: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  fareValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  chargeNote: {
    fontSize: 11,
    color: colors.textSubtle,
    marginBottom: spacing.md,
    lineHeight: 16,
  },
});
