import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useLayoutEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../components/ui/AppButton';
import { Screen } from '../../components/ui/Screen';
import { FOOD_CATEGORY_LABELS, getRestaurantById } from '../../data/mockRestaurants';
import { useFoodCartStore } from '../../store/foodCartStore';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { FoodCategoryId } from '../../types/food';
import type { FoodStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<FoodStackParamList, 'RestaurantDetail'>;

const MENU_FILTER: (FoodCategoryId | 'all')[] = ['all', 'burgers', 'asian', 'healthy', 'dessert', 'drinks'];

export function RestaurantDetailScreen({ route, navigation }: Props) {
  const { restaurantId } = route.params;
  const restaurant = getRestaurantById(restaurantId);
  const lines = useFoodCartStore((s) => s.lines);
  const count = useMemo(() => lines.reduce((n, l) => n + l.qty, 0), [lines]);
  const [cat, setCat] = useState<FoodCategoryId | 'all'>('all');

  useLayoutEffect(() => {
    navigation.setOptions({
      title: restaurant?.name ?? 'Restaurant',
      headerRight: () => (
        <View style={styles.cartWrap}>
          <Pressable onPress={() => navigation.navigate('FoodCart')} hitSlop={12}>
            <Ionicons name="bag-handle-outline" size={22} color={colors.primary} />
          </Pressable>
          {count > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeTxt}>{count > 9 ? '9+' : count}</Text>
            </View>
          ) : null}
        </View>
      ),
    });
  }, [navigation, restaurant?.name, count]);

  const items = useMemo(() => {
    if (!restaurant) {
      return [];
    }
    if (cat === 'all') {
      return restaurant.menu;
    }
    return restaurant.menu.filter((m) => m.category === cat);
  }, [restaurant, cat]);

  if (!restaurant) {
    return (
      <Screen>
        <Text style={styles.miss}>Restaurant not found.</Text>
        <AppButton title="Back" onPress={() => navigation.goBack()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>{restaurant.heroEmoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>{restaurant.name}</Text>
          <Text style={styles.heroSub}>{restaurant.tagline}</Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {MENU_FILTER.map((c) => {
          const on = cat === c;
          return (
            <Pressable key={c} onPress={() => setCat(c)} style={[styles.chip, on && styles.chipOn]}>
              <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>{FOOD_CATEGORY_LABELS[c]}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <FlatList
        data={items}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate('FoodItemDetail', { restaurantId, itemId: item.id })}
          >
            <Text style={styles.itemEmoji}>{item.imageEmoji ?? '🍽️'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDesc} numberOfLines={2}>
                {item.description}
              </Text>
              <Text style={styles.price}>${item.price.toFixed(2)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  cartWrap: { marginRight: spacing.md, position: 'relative', padding: 4 },
  badge: {
    position: 'absolute',
    right: -4,
    top: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.accentOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTxt: { color: colors.background, fontSize: 10, fontWeight: '800' },
  miss: { color: colors.textMuted, margin: spacing.lg },
  hero: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    alignItems: 'center',
  },
  heroEmoji: { fontSize: 52 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  heroSub: { marginTop: 4, color: colors.textMuted, lineHeight: 20 },
  chips: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginRight: 8,
  },
  chipOn: { borderColor: colors.primary, backgroundColor: 'rgba(250, 204, 21, 0.1)' },
  chipTxt: { color: colors.textMuted, fontWeight: '700', fontSize: 12 },
  chipTxtOn: { color: colors.primary },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl * 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
    gap: spacing.md,
  },
  itemEmoji: { fontSize: 36 },
  itemName: { fontSize: 16, fontWeight: '800', color: colors.text },
  itemDesc: { marginTop: 4, color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  price: { marginTop: 6, fontWeight: '800', color: colors.primary, fontSize: 15 },
});
