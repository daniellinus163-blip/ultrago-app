import {
  Orbitron_700Bold,
  Orbitron_900Black,
  useFonts,
} from '@expo-google-fonts/orbitron';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from '../../components/ui/keyboardComponents';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KeyboardFormScroll } from '../../components/ui/KeyboardFormScroll';
import { LoadingOverlay } from '../../components/ui/LoadingOverlay';
import { useAuth } from '../../context/AuthContext';
import type { AppRole, UserLastKnownLocation } from '../../types/user';
import { colors, gradients } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { hasEnteredProfileBasics, PROFILE_PHOTO_LOCKED_MESSAGE } from '../../utils/profilePhotoGate';

const LOGO = require('../../../assets/uberlogo.png');

const GOOGLE_WEB_CLIENT_CONFIGURED = Boolean(
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim(),
);

/** Expo Go binary does not ship `RNGoogleSignin`; use `expo run:android` / an EAS dev build. */
const GOOGLE_SIGNIN_NATIVE_AVAILABLE =
  Platform.OS !== 'web' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

function googleSignInErrorMessage(e: unknown): string {
  if (e instanceof Error && e.message === 'SIGN_IN_CANCELLED') {
    return 'SIGN_IN_CANCELLED';
  }
  const code =
    typeof e === 'object' && e !== null && 'code' in e ? String((e as { code: unknown }).code) : '';
  if (code === '10' || code === '-5' || /cancel/i.test(String(e))) {
    return 'SIGN_IN_CANCELLED';
  }
  if (e instanceof Error) {
    return e.message;
  }
  return 'Google sign-in failed.';
}

type Mode = 'login' | 'signup';

export function UltraGoAuthScreen() {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({
    Orbitron_700Bold,
    Orbitron_900Black,
  });

  const { signInWithEmail, signUpWithEmail, signInWithGoogle, sendPasswordResetEmail } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [appRole, setAppRole] = useState<AppRole>('customer');
  const [signupPhotoUri, setSignupPhotoUri] = useState<string | null>(null);
  const [signupLocation, setSignupLocation] = useState<UserLastKnownLocation | null>(null);
  const [locBusy, setLocBusy] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotBusy, setForgotBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const float = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const formTranslate = useRef(new Animated.Value(36)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;

  const canAddSignupPhoto = useMemo(
    () =>
      hasEnteredProfileBasics({
        displayName: name,
        phone,
        hasLocation: Boolean(signupLocation),
      }),
    [name, phone, signupLocation],
  );

  const floatStyle = useMemo(
    () => ({
      transform: [
        {
          translateY: float.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -10],
          }),
        },
      ],
    }),
    [float],
  );

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [float]);

  const isFirstLayout = useRef(true);

  useEffect(() => {
    formTranslate.setValue(36);
    formOpacity.setValue(0);
    const revealForm = Animated.parallel([
      Animated.timing(formTranslate, {
        toValue: 0,
        duration: 540,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 540,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    if (isFirstLayout.current) {
      isFirstLayout.current = false;
      Animated.sequence([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 720,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        revealForm,
      ]).start();
    } else {
      revealForm.start();
    }
  }, [mode]);

  async function captureSignupLocation() {
    setLocBusy(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Location', 'Allow location access so we can save your position to Firebase.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setSignupLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy ?? undefined,
        capturedAt: Date.now(),
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not read location.';
      Alert.alert('Location', message);
    } finally {
      setLocBusy(false);
    }
  }

  async function pickSignupPhoto() {
    if (!canAddSignupPhoto) {
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
      setSignupPhotoUri(r.assets[0].uri);
    }
  }

  async function submitForgot() {
    const addr = forgotEmail.trim() || email.trim();
    if (!addr) {
      Alert.alert('Email', 'Enter the email for your account.');
      return;
    }
    setForgotBusy(true);
    try {
      await sendPasswordResetEmail(addr);
      Alert.alert('Check your email', 'If an account exists for that address, Firebase sent a reset link.');
      setForgotOpen(false);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not send reset email.';
      Alert.alert('Reset failed', message);
    } finally {
      setForgotBusy(false);
    }
  }

  async function onSubmit() {
    if (mode === 'signup') {
      if (!name.trim()) {
        Alert.alert('Name', 'Enter your full name.');
        return;
      }
      if (phone.trim().length < 8) {
        Alert.alert('Phone', 'Enter a valid phone number (at least 8 digits).');
        return;
      }
      if (!signupLocation) {
        Alert.alert('Location', 'Tap “Save live location” so we can store your coordinates in Firestore.');
        return;
      }
    }
    if (mode === 'signup' && password.length < 6) {
      Alert.alert('Password too short', 'Use at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail({
          email: email.trim(),
          password,
          displayName: name.trim(),
          phoneNumber: phone.trim(),
          appRole,
          photoUri: canAddSignupPhoto ? signupPhotoUri : null,
          lastKnownLocation: signupLocation!,
        });
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Something went wrong.';
      Alert.alert(mode === 'login' ? 'Sign in failed' : 'Sign up failed', message);
    } finally {
      setBusy(false);
    }
  }

  async function onGooglePress() {
    if (!GOOGLE_SIGNIN_NATIVE_AVAILABLE) {
      Alert.alert(
        'Google sign-in unavailable here',
        'You are running in Expo Go or web preview. Use a native build (`npx expo run:android` or EAS build) to sign in with Google.',
      );
      return;
    }
    if (!GOOGLE_WEB_CLIENT_CONFIGURED) {
      Alert.alert(
        'Google sign-in',
        'Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to appride/.env (Firebase → Authentication → Google → Web client ID), then restart Expo.',
      );
      return;
    }
    setGoogleBusy(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      const msg = googleSignInErrorMessage(e);
      if (msg === 'SIGN_IN_CANCELLED') {
        return;
      }
      Alert.alert('Google sign-in failed', msg);
    } finally {
      setGoogleBusy(false);
    }
  }

  if (!fontsLoaded) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={gradients.screenGold}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={gradients.authWash}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <KeyboardFormScroll
        scrollProps={{
          contentContainerStyle: [styles.scroll, { paddingTop: insets.top + spacing.md }],
        }}
      >
          <View style={styles.header}>
            <Animated.View style={[styles.logoGlowOuter, floatStyle]}>
              <View style={styles.logoGlowInner}>
                <Image source={LOGO} style={styles.logo} resizeMode="contain" accessibilityLabel="UltraGo logo" />
              </View>
            </Animated.View>

            <Animated.View style={{ opacity: titleOpacity }}>
              <Text style={styles.brand}>UltraGo</Text>
              <Text style={styles.tagline}>Fast delivery. Beautiful experience.</Text>
            </Animated.View>
          </View>

          <Animated.View
            style={[
              styles.formCard,
              {
                opacity: formOpacity,
                transform: [{ translateY: formTranslate }],
              },
            ]}
          >
            <View style={styles.modeRow}>
              <Pressable
                onPress={() => setMode('login')}
                style={[styles.modeChip, mode === 'login' && styles.modeChipActive]}
              >
                <Text style={[styles.modeText, mode === 'login' && styles.modeTextActive]}>Log in</Text>
              </Pressable>
              <Pressable
                onPress={() => setMode('signup')}
                style={[styles.modeChip, mode === 'signup' && styles.modeChipActive]}
              >
                <Text style={[styles.modeText, mode === 'signup' && styles.modeTextActive]}>Sign up</Text>
              </Pressable>
            </View>

            {mode === 'signup' ? (
              <>
                <GlassField label="Full name" value={name} onChangeText={setName} placeholder="Your full name" />
                <GlassField
                  label="Phone"
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+234 …"
                  keyboardType="phone-pad"
                />
              </>
            ) : null}
            <GlassField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <GlassField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
            />

            {mode === 'signup' ? (
              <>
                <Text style={styles.regHint}>Choose your role (saved to Firebase)</Text>
                <View style={styles.roleRow}>
                  {(
                    [
                      { id: 'customer' as const, label: 'Customer' },
                      { id: 'driver' as const, label: 'Driver' },
                      { id: 'delivery_rider' as const, label: 'Delivery' },
                    ] as const
                  ).map((r) => (
                    <Pressable
                      key={r.id}
                      onPress={() => setAppRole(r.id)}
                      style={[styles.roleChip, appRole === r.id && styles.roleChipOn]}
                    >
                      <Text style={[styles.roleChipTxt, appRole === r.id && styles.roleChipTxtOn]}>{r.label}</Text>
                    </Pressable>
                  ))}
                </View>
                <Pressable
                  onPress={() => void captureSignupLocation()}
                  disabled={locBusy}
                  style={[styles.auxBtn, locBusy && styles.auxBtnDisabled]}
                >
                  {locBusy ? (
                    <ActivityIndicator color={colors.primary} size="small" />
                  ) : (
                    <Text style={styles.auxBtnTxt}>
                      {signupLocation ? 'Live location saved ✓' : 'Save live location'}
                    </Text>
                  )}
                </Pressable>
                <Pressable
                  onPress={() => void pickSignupPhoto()}
                  disabled={!canAddSignupPhoto}
                  style={[styles.auxBtn, !canAddSignupPhoto && styles.auxBtnDisabled]}
                >
                  <Text style={[styles.auxBtnTxt, !canAddSignupPhoto && styles.auxBtnTxtDisabled]}>
                    {canAddSignupPhoto
                      ? signupPhotoUri
                        ? 'Profile photo added ✓'
                        : 'Add profile photo (optional)'
                      : 'Photo unlocks after name, phone & location'}
                  </Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                onPress={() => {
                  setForgotEmail(email);
                  setForgotOpen(true);
                }}
                style={styles.forgotWrap}
              >
                <Text style={styles.forgotTxt}>Forgot password?</Text>
              </Pressable>
            )}

            <GradientPrimaryButton title={mode === 'login' ? 'Sign in' : 'Create account'} loading={busy} onPress={onSubmit} />

            <>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={onGooglePress}
                disabled={googleBusy || busy}
                style={({ pressed }) => [
                  styles.googleBtn,
                  (googleBusy || busy) && styles.googleBtnDisabled,
                  pressed && !(googleBusy || busy) && styles.googleBtnPressed,
                ]}
              >
                {googleBusy ? (
                  <ActivityIndicator color={colors.text} />
                ) : (
                  <Text style={styles.googleBtnLabel}>Continue with Google</Text>
                )}
              </Pressable>
              {!GOOGLE_SIGNIN_NATIVE_AVAILABLE ? (
                <Text style={styles.expoGoHint}>
                  Google sign-in works in a native development build (`npx expo run:android`) or production build.
                  Expo Go and web preview do not include the native Google Sign-In module.
                </Text>
              ) : null}
            </>

            <Pressable
              onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}
              style={({ pressed }) => [styles.switchLink, pressed && { opacity: 0.75 }]}
            >
              <Text style={styles.switchLinkText}>
                {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Log in'}
              </Text>
            </Pressable>
          </Animated.View>
      </KeyboardFormScroll>

      <Modal visible={forgotOpen} transparent animationType="fade" onRequestClose={() => setForgotOpen(false)}>
        <KeyboardAvoidingView behavior="padding" style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setForgotOpen(false)} />
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Reset password</Text>
            <Text style={styles.modalSub}>We will email you a link from Firebase.</Text>
            <TextInput
              value={forgotEmail}
              onChangeText={setForgotEmail}
              placeholder="Your account email"
              placeholderTextColor={colors.textSubtle}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.modalInput}
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setForgotOpen(false)} style={styles.modalCancel}>
                <Text style={styles.modalCancelTxt}>Cancel</Text>
              </Pressable>
              <Pressable
                disabled={forgotBusy}
                onPress={() => void submitForgot()}
                style={[styles.modalSend, forgotBusy && styles.auxBtnDisabled]}
              >
                {forgotBusy ? (
                  <ActivityIndicator color={colors.textOnPrimary} />
                ) : (
                  <Text style={styles.modalSendTxt}>Send link</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <LoadingOverlay
        visible={busy || googleBusy}
        message={googleBusy ? 'Signing in with Google…' : mode === 'login' ? 'Signing in…' : 'Creating account…'}
      />
    </View>
  );
}

function GlassField({
  label,
  ...inputProps
}: {
  label: string;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textSubtle}
        style={styles.fieldInput}
        {...inputProps}
      />
    </View>
  );
}

function GradientPrimaryButton({
  title,
  loading,
  onPress,
}: {
  title: string;
  loading?: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={loading}
      onPress={onPress}
      onPressIn={() => {
        Animated.spring(scale, {
          toValue: 0.96,
          friction: 5,
          tension: 320,
          useNativeDriver: true,
        }).start();
      }}
      onPressOut={() => {
        Animated.spring(scale, {
          toValue: 1,
          friction: 4,
          tension: 280,
          useNativeDriver: true,
        }).start();
      }}
      style={styles.ctaWrap}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient
          colors={[...gradients.ctaGold]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ctaGradient}
        >
          {loading ? (
            <ActivityIndicator color={colors.textOnPrimary} />
          ) : (
            <Text style={styles.ctaLabel}>{title}</Text>
          )}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FACC15',
  },
  boot: {
    flex: 1,
    backgroundColor: '#FACC15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  gradientSpin: {
    position: 'absolute',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoGlowOuter: {
    marginBottom: spacing.lg,
    shadowColor: colors.primaryBright,
    shadowOpacity: 0.55,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 0 },
    elevation: 22,
  },
  logoGlowInner: {
    borderRadius: 36,
    padding: 10,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logo: {
    width: 132,
    height: 132,
  },
  brand: {
    fontFamily: 'Orbitron_900Black',
    fontSize: 38,
    letterSpacing: 2,
    textAlign: 'center',
    color: colors.textOnGold,
    textShadowColor: 'rgba(255,255,255,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  tagline: {
    marginTop: spacing.sm,
    textAlign: 'center',
    fontSize: 15,
    letterSpacing: 0.3,
    color: colors.textMuted,
    fontWeight: '600',
    maxWidth: 320,
    alignSelf: 'center',
  },
  formCard: {
    marginTop: spacing.md,
    borderRadius: 22,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    backgroundColor: colors.secondary,
    borderRadius: 14,
    padding: 4,
  },
  modeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  modeChipActive: {
    backgroundColor: colors.goldTint,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 14,
    color: colors.textSubtle,
    letterSpacing: 0.5,
  },
  modeTextActive: {
    color: colors.text,
  },
  fieldWrap: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.xs + 2,
    letterSpacing: 0.4,
  },
  fieldInput: {
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  ctaWrap: {
    marginTop: spacing.sm,
  },
  ctaGradient: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  ctaLabel: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 16,
    color: colors.background,
    letterSpacing: 0.8,
  },
  switchLink: {
    marginTop: spacing.lg,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  switchLinkText: {
    color: colors.primaryBright,
    fontSize: 15,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderSubtle,
  },
  dividerText: {
    color: colors.textSubtle,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'lowercase',
    paddingHorizontal: spacing.sm,
  },
  googleBtn: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  googleBtnPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  googleBtnDisabled: {
    opacity: 0.55,
  },
  googleBtnLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.2,
  },
  expoGoHint: {
    marginTop: spacing.xs,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    textAlign: 'center',
  },
  regHint: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
  },
  roleChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  roleChipOn: {
    borderColor: colors.primary,
    backgroundColor: colors.goldTint,
  },
  roleChipTxt: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
  },
  roleChipTxtOn: {
    color: colors.primaryBright,
  },
  auxBtn: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
  },
  auxBtnDisabled: {
    opacity: 0.6,
  },
  auxBtnTxt: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  auxBtnTxtDisabled: {
    color: colors.textMuted,
  },
  forgotWrap: {
    alignSelf: 'flex-end',
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
  },
  forgotTxt: {
    color: colors.primaryBright,
    fontSize: 14,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    borderRadius: 18,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
  },
  modalSub: {
    marginTop: spacing.xs,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  modalInput: {
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    alignItems: 'center',
  },
  modalCancel: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  modalCancelTxt: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 15,
  },
  modalSend: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  modalSendTxt: {
    color: colors.background,
    fontWeight: '800',
    fontSize: 15,
  },
});
