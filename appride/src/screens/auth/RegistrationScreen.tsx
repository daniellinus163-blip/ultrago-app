import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { updateProfile } from 'firebase/auth';

import { AppButton } from '../../components/ui/AppButton';
import { Screen } from '../../components/ui/Screen';
import { useAuth } from '../../context/AuthContext';
import { getFirebaseAuth } from '../../services/firebase/auth';
import { uploadUserProfilePhotoFromUri } from '../../services/firebase/storage';
import { mergeRegistrationProfile } from '../../services/users/userProfile';
import type { AppRole } from '../../types/user';
import { hasEnteredProfileBasics, PROFILE_PHOTO_LOCKED_MESSAGE } from '../../utils/profilePhotoGate';
import { colors, gradients } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type IonName = ComponentProps<typeof Ionicons>['name'];

const ROLE_OPTIONS: {
  id: AppRole;
  title: string;
  sub: string;
  icon: IonName;
}[] = [
  {
    id: 'customer',
    title: 'Customer',
    sub: 'Book rides and order food.',
    icon: 'person-outline',
  },
  {
    id: 'driver',
    title: 'Driver',
    sub: 'Accept ride requests and manage trips.',
    icon: 'car-sport-outline',
  },
  {
    id: 'delivery_rider',
    title: 'Delivery rider',
    sub: 'Pick up and deliver food orders.',
    icon: 'bicycle-outline',
  },
];

/** Google / minimal Firestore profiles: finish Phase 1 registration in Firebase. */
export function RegistrationScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const [appRole, setAppRole] = useState<AppRole>(profile?.appRole ?? 'customer');
  const [phone, setPhone] = useState(profile?.phoneNumber ?? '');
  const [displayName, setDisplayName] = useState(profile?.displayName ?? user?.displayName ?? '');
  const [photoUri, setPhotoUri] = useState<string | null>(() => profile?.photoUrl ?? user?.photoURL ?? null);
  const [locLabel, setLocLabel] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(() => {
    const l = profile?.lastKnownLocation;
    if (l && typeof l.lat === 'number' && typeof l.lng === 'number') {
      return { lat: l.lat, lng: l.lng, accuracy: l.accuracy };
    }
    return null;
  });
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [busy, setBusy] = useState(false);

  const needsVehicle = appRole === 'driver' || appRole === 'delivery_rider';

  const canAddProfilePhoto = useMemo(
    () =>
      hasEnteredProfileBasics({
        displayName,
        phone,
        hasLocation: Boolean(coords),
      }),
    [displayName, phone, coords],
  );

  async function pickPhoto() {
    if (!canAddProfilePhoto) {
      Alert.alert('Profile photo', PROFILE_PHOTO_LOCKED_MESSAGE);
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photos', 'Allow photo library access to add a profile picture.');
      return;
    }
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!r.canceled && r.assets[0]?.uri) {
      setPhotoUri(r.assets[0].uri);
    }
  }

  async function captureLocation() {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Location', 'Allow location access so we can save your live position to your profile.');
      return;
    }
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    setCoords({ lat, lng, accuracy: pos.coords.accuracy ?? undefined });
    setLocLabel(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  }

  async function submit() {
    if (!user) {
      return;
    }
    const phoneOk = phone.trim().length >= 8;
    if (!phoneOk) {
      Alert.alert('Phone', 'Enter a valid phone number (at least 8 digits).');
      return;
    }
    if (!coords) {
      Alert.alert('Location', 'Tap “Save live location” so we can store your coordinates in Firestore.');
      return;
    }
    setBusy(true);
    try {
      let photoUrl: string | null | undefined = profile?.photoUrl ?? user?.photoURL ?? undefined;
      if (
        canAddProfilePhoto &&
        photoUri &&
        photoUri !== profile?.photoUrl &&
        photoUri !== user?.photoURL
      ) {
        photoUrl = await uploadUserProfilePhotoFromUri(user.uid, photoUri, 'image/jpeg');
        const auth = getFirebaseAuth();
        const u = auth.currentUser;
        if (u) {
          await updateProfile(u, { photoURL: photoUrl });
        }
      }

      await mergeRegistrationProfile({
        uid: user.uid,
        phoneNumber: phone.trim(),
        appRole,
        lastKnownLocation: {
          lat: coords.lat,
          lng: coords.lng,
          accuracy: coords.accuracy,
          capturedAt: Date.now(),
        },
        photoUrl: photoUrl ?? user.photoURL ?? null,
        displayName: displayName.trim() || undefined,
        vehicleMake: needsVehicle ? vehicleMake : undefined,
        vehicleModel: needsVehicle ? vehicleModel : undefined,
        vehiclePlate: needsVehicle ? vehiclePlate : undefined,
      });
      await refreshProfile();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Registration failed.';
      Alert.alert('Complete profile', message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen keyboardAvoid style={{ backgroundColor: 'transparent' }} scrollProps={{ contentContainerStyle: styles.scroll }}>
      <LinearGradient colors={gradients.screenGold} style={StyleSheet.absoluteFill} />
          <Text style={styles.title}>Complete your account</Text>
          <Text style={styles.sub}>
            Enter your details and live location first. Profile photo unlocks after name, phone, and location are set.
          </Text>

          <Text style={styles.section}>Full name</Text>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your full name"
            placeholderTextColor={colors.textSubtle}
            style={styles.input}
          />

          <Text style={styles.section}>Phone</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+234 …"
            placeholderTextColor={colors.textSubtle}
            keyboardType="phone-pad"
            style={styles.input}
          />

          <Text style={styles.section}>Live location</Text>
          <Pressable onPress={() => void captureLocation()} style={styles.locBtn}>
            <Ionicons name="navigate" size={18} color={colors.primary} />
            <Text style={styles.locBtnTxt}>{coords ? 'Update location' : 'Save live location'}</Text>
          </Pressable>
          {locLabel ? <Text style={styles.locHint}>{locLabel}</Text> : null}

          <Text style={[styles.section, { marginTop: spacing.md }]}>I am a</Text>
          {ROLE_OPTIONS.map((o) => {
            const on = appRole === o.id;
            return (
              <Pressable
                key={o.id}
                disabled={busy}
                onPress={() => setAppRole(o.id)}
                style={({ pressed }) => [styles.card, on && styles.cardOn, pressed && styles.cardPressed]}
              >
                <View style={styles.iconRing}>
                  <Ionicons name={o.icon} size={26} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{o.title}</Text>
                  <Text style={styles.cardSub}>{o.sub}</Text>
                </View>
                <Ionicons name={on ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={on ? colors.primary : colors.textSubtle} />
              </Pressable>
            );
          })}

          {needsVehicle ? (
            <>
              <Text style={[styles.section, { marginTop: spacing.md }]}>Vehicle (shown to customers)</Text>
              <TextInput
                value={vehicleMake}
                onChangeText={setVehicleMake}
                placeholder="Make (e.g. Toyota)"
                placeholderTextColor={colors.textSubtle}
                style={styles.input}
              />
              <TextInput
                value={vehicleModel}
                onChangeText={setVehicleModel}
                placeholder="Model (e.g. Corolla)"
                placeholderTextColor={colors.textSubtle}
                style={[styles.input, { marginTop: spacing.sm }]}
              />
              <TextInput
                value={vehiclePlate}
                onChangeText={setVehiclePlate}
                placeholder="Plate number"
                placeholderTextColor={colors.textSubtle}
                style={[styles.input, { marginTop: spacing.sm }]}
              />
            </>
          ) : null}

          <Text style={[styles.section, { marginTop: spacing.md }]}>Profile photo</Text>
          {!canAddProfilePhoto ? (
            <Text style={styles.photoLocked}>{PROFILE_PHOTO_LOCKED_MESSAGE}</Text>
          ) : null}
          <View style={[styles.photoRow, !canAddProfilePhoto && styles.photoRowDisabled]}>
            {photoUri && canAddProfilePhoto ? (
              <Image source={{ uri: photoUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPh]}>
                <Ionicons name="person" size={32} color={colors.textMuted} />
              </View>
            )}
            <Pressable
              onPress={() => void pickPhoto()}
              disabled={!canAddProfilePhoto || busy}
              style={[styles.photoBtn, !canAddProfilePhoto && styles.photoBtnDisabled]}
            >
              <Text style={[styles.photoBtnTxt, !canAddProfilePhoto && styles.photoBtnTxtDisabled]}>
                {canAddProfilePhoto
                  ? photoUri
                    ? 'Change photo'
                    : 'Choose photo'
                  : 'Complete fields above first'}
              </Text>
            </Pressable>
          </View>

          <AppButton title="Save & continue" onPress={() => void submit()} loading={busy} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 3,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.textOnGold,
    marginBottom: spacing.sm,
  },
  sub: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  section: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textSubtle,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  photoLocked: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  photoRowDisabled: {
    opacity: 0.55,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  avatarPh: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  photoBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoBtnTxt: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  photoBtnDisabled: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderSubtle,
  },
  photoBtnTxtDisabled: {
    color: colors.textSubtle,
  },
  locBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locBtnTxt: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  locHint: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 16,
    marginBottom: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  cardOn: {
    borderColor: colors.primary,
    backgroundColor: colors.card,
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
