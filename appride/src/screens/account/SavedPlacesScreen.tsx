import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from '../../components/ui/keyboardComponents';

import { AppButton } from '../../components/ui/AppButton';
import { AppTextField } from '../../components/ui/AppTextField';
import { Screen } from '../../components/ui/Screen';
import type { AccountStackParamList } from '../../navigation/types';
import { useSavedPlacesStore } from '../../store/savedPlacesStore';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<AccountStackParamList, 'SavedPlaces'>;

export function SavedPlacesScreen({}: Props) {
  const places = useSavedPlacesStore((s) => s.places);
  const addPlace = useSavedPlacesStore((s) => s.addPlace);
  const removePlace = useSavedPlacesStore((s) => s.removePlace);
  const toggleStar = useSavedPlacesStore((s) => s.toggleStar);

  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');

  function closeModal() {
    setOpen(false);
    setLabel('');
    setAddress('');
  }

  function saveNew() {
    const l = label.trim();
    const a = address.trim();
    if (!l || !a) {
      return;
    }
    addPlace({ label: l, address: a, starred: false });
    closeModal();
  }

  return (
    <Screen>
      <Pressable style={styles.addBar} onPress={() => setOpen(true)}>
        <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
        <Text style={styles.addBarTxt}>Add a place</Text>
      </Pressable>

      <FlatList
        data={places}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={styles.empty}>No saved places yet. Add home, work, or a frequent stop.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Pressable onPress={() => toggleStar(item.id)} hitSlop={8} style={styles.starHit}>
              <Ionicons
                name={item.starred ? 'star' : 'star-outline'}
                size={22}
                color={item.starred ? colors.primary : colors.textSubtle}
              />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={styles.placeLabel}>{item.label}</Text>
              <Text style={styles.placeAddr}>{item.address}</Text>
            </View>
            <Pressable onPress={() => removePlace(item.id)} hitSlop={8}>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </Pressable>
          </View>
        )}
      />

      <Modal visible={open} animationType="slide" transparent onRequestClose={closeModal}>
        <KeyboardAvoidingView behavior="padding" style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New saved place</Text>
            <AppTextField label="Label" value={label} onChangeText={setLabel} placeholder="e.g. Home" />
            <AppTextField
              label="Address"
              value={address}
              onChangeText={setAddress}
              placeholder="Street, city"
            />
            <AppButton title="Save" variant="primary" onPress={saveNew} />
            <AppButton title="Cancel" variant="secondary" onPress={closeModal} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  addBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addBarTxt: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  list: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  empty: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  starHit: {
    padding: spacing.xs,
  },
  placeLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  placeAddr: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.backgroundMid,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.md,
  },
});
