import React from 'react';
import { StyleSheet, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  KEYBOARD_BOTTOM_EXTRA,
  KeyboardAwareScrollView,
  type KeyboardAwareScrollViewProps,
} from './keyboardComponents';

type Props = {
  children: React.ReactNode;
  style?: KeyboardAwareScrollViewProps['style'];
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
  scrollProps?: ScrollViewProps & KeyboardAwareScrollViewProps;
};

/** Keyboard-aware scroll for custom layouts (auth gradients, nested sheets). */
export function KeyboardFormScroll({ children, style, contentContainerStyle, scrollProps }: Props) {
  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom + KEYBOARD_BOTTOM_EXTRA;
  const { contentContainerStyle: extraContent, style: extraStyle, ...rest } = scrollProps ?? {};

  return (
    <KeyboardAwareScrollView
      style={[styles.flex, style, extraStyle]}
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      bottomOffset={bottomOffset}
      contentContainerStyle={[styles.content, contentContainerStyle, extraContent]}
      {...rest}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingBottom: 40,
  },
});
