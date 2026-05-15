import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Screen } from '../../components/ui/Screen';
import { useAuth } from '../../context/AuthContext';
import type { AccountStackParamList } from '../../navigation/types';
import { setUserAppRole } from '../../services/users/userProfile';
import type { AppRole } from '../../types/user';
import { colors, gradients } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type IonName = ComponentProps<typeof Ionicons>['name'];
type Props = NativeStackScreenProps<AccountStackParamList, 'AppRole'>;

const OPTIONS: {
  id: AppRole;
  title: string;
  sub: string;
  icon: IonName;
}[] = [
  { id: 'customer', title: 'Customer', sub: 'Book rides and order food.', icon: 'person-outline' },
  { id: 'driver', title: 'Driver', sub: 'Accept ride requests and manage trips.', icon: 'car-sport-outline' },
  {
    id: 'delivery_rider',
    title: 'Delivery rider',
    sub: 'Pick up and deliver food orders.',
    icon: 'bicycle-outline',
  },
];

export function AppRoleScreen({ navigation }: Props) {
  const { user, profile, refreshProfile } = useAuth();
  const [busy, setBusy] = useState(false);

  async function pick(role: AppRole) {
    if (!user) {
      return;
    }
    if (profile?.appRole === role) {
      navigation.goBack();
      return;
    }
    setBusy(true);
    try {
      await setUserAppRole(user.uid, role);
      await refreshProfile();
      navigation.goBack();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not update role.';
      Alert.alert('App role', message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen style={{ backgroundColor: 'transparent' }}>
      <LinearGradient colors={gradients.screenGold} style={StyleSheet.absoluteFill} />
      <View style={styles.inner}>
        <Text style={styles.title}>Switch app role</Text>
        <Text style={styles.sub}>Saved to your account in Firestore. Tabs update to match your role.</Text>
        {OPTIONS.map((o) => (
          <Pressable
            key={o.id}
            disabled={busy}
            onPress={() => void pick(o.id)}
            style={({ pressed }) => [
              styles.card,
              profile?.appRole === o.id && styles.cardSelected,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.iconRing}>
              <Ionicons name={o.icon} size={26} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{o.title}</Text>
              <Text style={styles.cardSub}>{o.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  inner: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textOnGold,
    marginBottom: spacing.sm,
  },
  sub: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardSelected: {
    borderColor: colors.primaryBright,
    borderWidth: 2,
  },
  cardPressed: { opacity: 0.92 },
  iconRing: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldTint,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  cardSub: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
