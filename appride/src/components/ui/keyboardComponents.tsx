import React, { forwardRef } from 'react';
import {
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  Platform,
  ScrollView,
  type KeyboardAvoidingViewProps,
  type ScrollViewProps,
} from 'react-native';

/** Works in Expo Go — no native keyboard-controller module required. */
export const KEYBOARD_BOTTOM_EXTRA = 24;

export type KeyboardAwareScrollViewProps = ScrollViewProps & {
  bottomOffset?: number;
};

export const KeyboardAwareScrollView = forwardRef<ScrollView, KeyboardAwareScrollViewProps>(
  function KeyboardAwareScrollView(
    { bottomOffset = 0, contentContainerStyle, keyboardShouldPersistTaps = 'handled', ...rest },
    ref,
  ) {
    return (
      <ScrollView
        ref={ref}
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        contentContainerStyle={[
          { paddingBottom: bottomOffset + KEYBOARD_BOTTOM_EXTRA },
          contentContainerStyle,
        ]}
        {...rest}
      />
    );
  },
);

export function KeyboardAvoidingView({
  behavior,
  children,
  ...rest
}: KeyboardAvoidingViewProps) {
  const resolvedBehavior =
    behavior ?? (Platform.OS === 'ios' ? 'padding' : 'height');

  return (
    <RNKeyboardAvoidingView behavior={resolvedBehavior} {...rest}>
      {children}
    </RNKeyboardAvoidingView>
  );
}

/** No-op wrapper — keeps App.tsx structure; RN ScrollView handles insets. */
export function KeyboardProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
