import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../components/ui/AppButton';
import { Screen } from '../../components/ui/Screen';
import { resolveFoodAsset } from '../../data/foodAssetRegistry';
import {
  FOOD_MARKET_CATEGORY_LABELS,
  getLocalFoodItemById,
  ULTRAGO_FOOD_VENDOR_ID,
} from '../../data/localFoodCatalog';
import { useFoodCartStore } from '../../store/foodCartStore';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { FoodStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<FoodStackParamList, 'FoodItemDetail'>;

export function FoodItemDetailScreen({ route, navigation }: Props) {
  const itemId = route.params.itemId;
  const item = getLocalFoodItemById(itemId);
  const addItem = useFoodCartStore((s) => s.addItem);
  const [qty, setQty] = useState(1);
  const scale = useRef(new Animated.Value(1)).current;

  const line = useMemo(() => {
    if (!item) {
      return null;
    }
    return {
      restaurantId: ULTRAGO_FOOD_VENDOR_ID,
      restaurantName: FOOD_MARKET_CATEGORY_LABELS[item.category],
      itemId: item.id,
      name: item.name,
      unitPrice: item.price,
      imageAssetKey: item.imageKey,
      qty,
    };
  }, [item, qty]);

  function pulseAdd() {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
  }

  if (!item) {
    return (
      <Screen>
        <Text style={styles.miss}>Item unavailable.</Text>
        <AppButton title="Back to menu" onPress={() => navigation.goBack()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        <Image source={resolveFoodAsset(item.imageKey)} style={styles.hero} contentFit="cover" />
        <LinearGradient colors={['transparent', 'rgba(28,25,23,0.95)']} style={styles.heroFade} />
        <Animated.View style={[styles.sheet, { transform: [{ scale }] }]}>
          <Text style={styles.category}>{FOOD_MARKET_CATEGORY_LABELS[item.category]}</Text>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.desc}>{item.description}</Text>
          <Text style={styles.price}>${item.price.toFixed(2)}</Text>
          <View style={styles.qtyRow}>
            <AppButton
              title="−"
              variant="secondary"
              onPress={() => setQty((q) => Math.max(1, q - 1))}
              style={styles.qtyBtn}
            />
            <Text style={styles.qty}>{qty}</Text>
            <AppButton
              title="+"
              variant="secondary"
              onPress={() => setQty((q) => q + 1)}
              style={styles.qtyBtn}
            />
          </View>
          <AppButton
            title="Add to cart"
            onPress={() => {
              if (line) {
                pulseAdd();
                addItem(line);
              }
              navigation.navigate('FoodCart');
            }}
          />
          <AppButton title="Keep browsing" variant="secondary" onPress={() => navigation.goBack()} />
        </Animated.View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  miss: { color: colors.textMuted, margin: spacing.lg },
  hero: { width: '100%', height: 320, backgroundColor: '#292524' },
  heroFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 200,
    height: 140,
  },
  sheet: {
    marginTop: -spacing.xl,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: 24,
    backgroundColor: '#1C1917',
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 10, 0.4)',
    gap: spacing.sm,
    marginBottom: spacing.xl * 2,
  },
  category: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryBright,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  name: { fontSize: 26, fontWeight: '900', color: '#FFFFFF', lineHeight: 32 },
  desc: { color: 'rgba(255,255,255,0.78)', lineHeight: 22, fontSize: 15 },
  price: { fontSize: 24, fontWeight: '800', color: colors.primaryBright, marginTop: spacing.xs },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.sm,
  },
  qtyBtn: { minWidth: 52, paddingHorizontal: spacing.sm },
  qty: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', minWidth: 36, textAlign: 'center' },
});
