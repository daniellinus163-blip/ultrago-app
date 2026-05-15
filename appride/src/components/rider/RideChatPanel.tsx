import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from '../ui/keyboardComponents';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '../ui/AppButton';
import { sendRideChatMessage, subscribeRideChat, type RideChatMessage } from '../../services/rides/rideChat';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = {
  visible: boolean;
  rideId: string;
  userId: string;
  displayName?: string;
  onClose: () => void;
};

export function RideChatPanel({ visible, rideId, userId, displayName, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<RideChatMessage[]>([]);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!visible || !rideId) {
      return;
    }
    const unsub = subscribeRideChat(rideId, setMessages);
    return unsub;
  }, [visible, rideId]);

  async function onSend() {
    const text = draft.trim();
    if (!text) {
      return;
    }
    setDraft('');
    try {
      await sendRideChatMessage({ rideId, uid: userId, displayName, text });
    } catch {
      setDraft(text);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <KeyboardAvoidingView behavior="padding" style={styles.keyboard}>
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <View style={styles.header}>
              <Text style={styles.title}>Trip chat</Text>
              <Pressable onPress={onClose} hitSlop={12}>
                <Ionicons name="close" size={26} color={colors.text} />
              </Pressable>
            </View>
            <Text style={styles.hint}>Messages sync live for you and your driver.</Text>
            <FlatList
              data={messages}
              keyExtractor={(item) => item.id}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const mine = item.uid === userId;
                return (
                  <View style={[styles.bubbleWrap, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                    <Text style={styles.bubbleMeta}>{mine ? 'You' : item.displayName ?? 'Driver'}</Text>
                    <Text style={styles.bubbleTxt}>{item.text}</Text>
                  </View>
                );
              }}
            />
            <View style={styles.inputRow}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Message…"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                multiline
              />
              <AppButton title="Send" onPress={() => void onSend()} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  keyboard: {
    width: '100%',
    maxHeight: '78%',
  },
  sheet: {
    maxHeight: '72%',
    backgroundColor: colors.backgroundMid,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  hint: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  list: { flexGrow: 0, maxHeight: 320 },
  listContent: { paddingVertical: spacing.sm, gap: spacing.sm },
  bubbleWrap: {
    maxWidth: '88%',
    padding: spacing.sm,
    borderRadius: 12,
    marginBottom: spacing.xs,
  },
  bubbleMine: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(250, 204, 21, 0.18)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleTheirs: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  bubbleMeta: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 2,
  },
  bubbleTxt: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: 15,
  },
});
