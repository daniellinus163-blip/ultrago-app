import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = { children: ReactNode };
type State = { err: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { err: null };

  static getDerivedStateFromError(err: Error): State {
    return { err };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) {
      console.warn('[ErrorBoundary]', error.message, info.componentStack);
    }
  }

  render() {
    if (this.state.err) {
      return (
        <View style={styles.wrap}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.body}>{this.state.err.message}</Text>
          <Pressable style={styles.btn} onPress={() => this.setState({ err: null })}>
            <Text style={styles.btnTxt}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  body: { color: colors.textMuted, marginBottom: spacing.lg, lineHeight: 22 },
  btn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  btnTxt: { color: colors.background, fontWeight: '800' },
});
