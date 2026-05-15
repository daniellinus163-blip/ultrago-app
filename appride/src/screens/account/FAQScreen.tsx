import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';

import { Screen } from '../../components/ui/Screen';
import { FAQ_ITEMS } from '../../data/faqContent';
import type { AccountStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = NativeStackScreenProps<AccountStackParamList, 'FAQ'>;

export function FAQScreen({}: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  function toggle(id: string) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenId((cur) => (cur === id ? null : id));
  }

  return (
    <Screen>
      <View style={styles.list}>
        {FAQ_ITEMS.map((item) => {
          const expanded = openId === item.id;
          return (
            <View key={item.id} style={styles.card}>
              <Pressable
                onPress={() => toggle(item.id)}
                style={({ pressed }) => [styles.qRow, pressed && styles.pressed]}
              >
                <Text style={styles.q}>{item.q}</Text>
                <Ionicons
                  name={expanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.primary}
                />
              </Pressable>
              {expanded ? <Text style={styles.a}>{item.a}</Text> : null}
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  qRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  pressed: {
    backgroundColor: 'rgba(250, 204, 21, 0.06)',
  },
  q: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 22,
  },
  a: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 21,
  },
});
