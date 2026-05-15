import { Image } from 'expo-image';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../components/ui/AppButton';
import { Screen } from '../../components/ui/Screen';
import { FOOD_ASSET_MANIFEST, resolveFoodAsset, type FoodAssetKey } from '../../data/foodAssetRegistry';
import { cartSubtotal, useFoodCartStore } from '../../store/foodCartStore';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { FoodStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<FoodStackParamList, 'FoodCart'>;

function CartThumb({ imageKey }: { imageKey?: string }) {
  if (!imageKey || !(imageKey in FOOD_ASSET_MANIFEST)) {
    return <View style={styles.thumbPlaceholder} />;
  }
  return (
    <Image
      source={resolveFoodAsset(imageKey as FoodAssetKey)}
      style={styles.thumb}
      contentFit="cover"
    />
  );
}

export function FoodCartScreen({ navigation }: Props) {
  const lines = useFoodCartStore((s) => s.lines);
  const setQty = useFoodCartStore((s) => s.setQty);
  const sub = cartSubtotal(lines);

  return (
    <Screen>
      <FlatList
        data={lines}
        keyExtractor={(l) => `${l.restaurantId}-${l.itemId}`}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          lines.length > 0 ? (
            <Text style={styles.header}>Phase 6 cart · Add payment method at checkout</Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.empty}>Your cart is empty</Text>
            <AppButton title="Browse menu" onPress={() => navigation.navigate('FoodRestaurants')} />
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <CartThumb imageKey={item.imageAssetKey} />
            <View style={styles.rowBody}>
              <Text style={styles.cat}>{item.restaurantName}</Text>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.unit}>${item.unitPrice.toFixed(2)} each</Text>
            </View>
            <View style={styles.qtyBox}>
              <Pressable onPress={() => setQty(item.itemId, item.restaurantId, item.qty - 1)} hitSlop={8}>
                <Text style={styles.qtyBtn}>−</Text>
              </Pressable>
              <Text style={styles.qty}>{item.qty}</Text>
              <Pressable onPress={() => setQty(item.itemId, item.restaurantId, item.qty + 1)} hitSlop={8}>
                <Text style={styles.qtyBtn}>+</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
      {lines.length > 0 ? (
        <View style={styles.footer}>
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.total}>${sub.toFixed(2)}</Text>
          </View>
          <AppButton title="Checkout" onPress={() => navigation.navigate('FoodCheckout')} />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, paddingBottom: 140 },
  header: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  emptyWrap: { alignItems: 'center', marginTop: spacing.xl * 2, gap: spacing.lg },
  empty: { textAlign: 'center', color: colors.textMuted, fontSize: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 16,
    paddingHorizontal: spacing.sm,
    backgroundColor: '#1C1917',
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 10, 0.25)',
  },
  thumb: { width: 72, height: 72, borderRadius: 12 },
  thumbPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#292524',
  },
  rowBody: { flex: 1 },
  cat: { fontSize: 11, fontWeight: '800', color: colors.primaryBright, textTransform: 'uppercase' },
  name: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', marginTop: 2 },
  unit: { marginTop: 4, color: 'rgba(255,255,255,0.65)', fontSize: 13 },
  qtyBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: { fontSize: 22, fontWeight: '700', color: colors.primaryBright, minWidth: 28, textAlign: 'center' },
  qty: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', minWidth: 24, textAlign: 'center' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    gap: spacing.sm,
  },
  totalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.goldTint,
  },
  totalLabel: { fontWeight: '700', color: colors.textMuted },
  total: { fontSize: 22, fontWeight: '900', color: colors.text },
});
