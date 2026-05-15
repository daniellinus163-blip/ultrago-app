import React from 'react';
import { StyleSheet, View, type ScrollViewProps, type ViewProps } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  KEYBOARD_BOTTOM_EXTRA,
  KeyboardAwareScrollView,
  type KeyboardAwareScrollViewProps,
} from './keyboardComponents';
import { colors } from '../../theme/colors';

type Props = ViewProps & {
  /** When false, skip SafeAreaView — useful inside modals or map fullscreen layers. */
  safe?: boolean;
  /** Scrolls focused inputs above the keyboard (enables scroll wrapper automatically). */
  keyboardAvoid?: boolean;
  /** Wrap children in a scroll view (on by default when keyboardAvoid is true). */
  scroll?: boolean;
  scrollProps?: ScrollViewProps & KeyboardAwareScrollViewProps;
};

/** Page shell with safe-area padding, keyboard-aware scrolling, and default background. */
export function Screen({
  children,
  style,
  safe = true,
  keyboardAvoid = false,
  scroll = false,
  scrollProps,
  ...rest
}: Props) {
  const insets = useSafeAreaInsets();
  const useScroll = scroll || keyboardAvoid;
  const bottomOffset = insets.bottom + KEYBOARD_BOTTOM_EXTRA;

  let body: React.ReactNode = children;

  if (useScroll) {
    const { contentContainerStyle, ...restScroll } = scrollProps ?? {};
    body = (
      <KeyboardAwareScrollView
        style={styles.flex}
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        bottomOffset={bottomOffset}
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
        {...restScroll}
      >
        {children}
      </KeyboardAwareScrollView>
    );
  }

  if (safe) {
    return (
      <SafeAreaView style={[styles.screen, style]} {...rest}>
        {body}
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.screen, style]} {...rest}>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
});
