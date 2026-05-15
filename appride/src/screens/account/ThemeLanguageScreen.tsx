import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../components/ui/AppButton';
import { Screen } from '../../components/ui/Screen';
import { useAuth } from '../../context/AuthContext';
import type { AccountStackParamList } from '../../navigation/types';
import { updateUserProfileFields } from '../../services/users/userProfile';
import type { ThemePreference } from '../../types/user';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<AccountStackParamList, 'ThemeLanguage'>;

const THEMES: { id: ThemePreference; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

const LOCALES: { id: string; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'es', label: 'Español' },
  { id: 'fr', label: 'Français' },
];

export function ThemeLanguageScreen({ navigation }: Props) {
  const { user, profile, refreshProfile } = useAuth();
  const [theme, setTheme] = useState<ThemePreference>(profile?.themePreference ?? 'system');
  const [locale, setLocale] = useState(profile?.locale ?? 'en');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile?.themePreference) {
      setTheme(profile.themePreference);
    }
    if (profile?.locale) {
      setLocale(profile.locale);
    }
  }, [profile?.themePreference, profile?.locale]);

  async function onSave() {
    if (!user) {
      return;
    }
    setBusy(true);
    try {
      await updateUserProfileFields(user.uid, { themePreference: theme, locale });
      await refreshProfile();
      navigation.goBack();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not save.';
      Alert.alert('Save failed', message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Text style={styles.intro}>Saved to your Firestore profile. App-wide theming can read these fields next.</Text>
      <Text style={styles.section}>Theme</Text>
      <View style={styles.rowWrap}>
        {THEMES.map((t) => {
          const on = theme === t.id;
          return (
            <Pressable key={t.id} onPress={() => setTheme(t.id)} style={[styles.chip, on && styles.chipOn]}>
              <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.section}>Language</Text>
      <View style={styles.rowWrap}>
        {LOCALES.map((l) => {
          const on = locale === l.id;
          return (
            <Pressable key={l.id} onPress={() => setLocale(l.id)} style={[styles.chip, on && styles.chipOn]}>
              <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>{l.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <AppButton title="Save" onPress={() => void onSave()} loading={busy} style={styles.btn} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    fontSize: 13,
    fontWeight: '800',
    color: colors.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceElevated,
  },
  chipOn: {
    borderColor: colors.primary,
    backgroundColor: colors.goldTint,
  },
  chipTxt: { color: colors.textMuted, fontWeight: '700' },
  chipTxtOn: { color: colors.primary },
  btn: { marginHorizontal: spacing.lg, marginTop: spacing.md },
});
