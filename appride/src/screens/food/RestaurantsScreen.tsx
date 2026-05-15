import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { FoodMarketCard } from '../../components/food/FoodMarketCard';
import { Screen } from '../../components/ui/Screen';
import {
  FOOD_MARKET_CATEGORIES,
  FOOD_MARKET_CATEGORY_LABELS,
  getLocalFoodItemsByCategory,
  searchLocalFoodCatalog,
  type FoodMarketCategory,
} from '../../data/localFoodCatalog';
import { useFoodCartStore } from '../../store/foodCartStore';
import { colors, gradients } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { FoodStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<FoodStackParamList, 'FoodRestaurants'>;

export function RestaurantsScreen() {
  const navigation = useNavigation<Nav>();
  const lines = useFoodCartStore((s) => s.lines);
  const count = useMemo(() => lines.reduce((n, l) => n + l.qty, 0), [lines]);
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<FoodMarketCategory | 'all'>('all');

  const data = useMemo(() => {
    const searched = searchLocalFoodCatalog(query);
    if (cat === 'all') {
      return searched;
    }
    return searched.filter((i) => i.category === cat);
  }, [query, cat]);

  const counts = useMemo(() => {
    const map: Record<FoodMarketCategory, number> = {
      junk_food: getLocalFoodItemsByCategory('junk_food').length,
      nourishing_food: getLocalFoodItemsByCategory('nourishing_food').length,
      desserts: getLocalFoodItemsByCategory('desserts').length,
    };
    return map;
  }, []);

  return (
    <Screen>
      <LinearGradient colors={[...gradients.screenGold]} style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroPhase}>Phase 6 · Local menu</Text>
            <Text style={styles.heroTitle}>Premium bites,{'\n'}delivered fast</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('FoodCart')} style={styles.cartBtn} hitSlop={10}>
            <Ionicons name="bag-handle" size={26} color={colors.text} />
            {count > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeTxt}>{count > 9 ? '9+' : count}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>
        <Text style={styles.heroSub}>35 dishes from your on-device gallery — Junk, Nourishing & Desserts.</Text>
      </LinearGradient>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search dishes"
          placeholderTextColor={colors.textSubtle}
          style={styles.search}
          returnKeyType="search"
        />
      </View>

      <View style={styles.chips}>
        <Pressable
          onPress={() => setCat('all')}
          style={[styles.chip, cat === 'all' && styles.chipOn]}
        >
          <Text style={[styles.chipTxt, cat === 'all' && styles.chipTxtOn]}>All · 35</Text>
        </Pressable>
        {FOOD_MARKET_CATEGORIES.map((c) => {
          const on = cat === c;
          return (
            <Pressable key={c} onPress={() => setCat(c)} style={[styles.chip, on && styles.chipOn]}>
              <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>
                {FOOD_MARKET_CATEGORY_LABELS[c]} · {counts[c]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListEmptyComponent={<Text style={styles.empty}>No dishes match your search.</Text>}
        renderItem={({ item, index }) => (
          <FoodMarketCard
            item={item}
            index={index}
            onPress={() => navigation.navigate('FoodItemDetail', { itemId: item.id })}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(180, 134, 11, 0.45)',
  },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  cartBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroPhase: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textOnGold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroTitle: {
    marginTop: spacing.xs,
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    lineHeight: 34,
  },
  heroSub: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: colors.textOnGold,
    lineHeight: 20,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    right: -2,
    top: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.accentOrange,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeTxt: { color: colors.background, fontSize: 10, fontWeight: '800' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 8,
  },
  search: { flex: 1, paddingVertical: 12, fontSize: 16, color: colors.text },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1C1917',
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 10, 0.25)',
  },
  chipOn: {
    borderColor: colors.primaryBright,
    backgroundColor: colors.goldTintStrong,
  },
  chipTxt: { color: 'rgba(255,255,255,0.75)', fontWeight: '700', fontSize: 13 },
  chipTxtOn: { color: colors.text },
  list: { padding: spacing.lg, paddingBottom: spacing.xl * 3 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
});
