import { Image } from 'expo-image';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { resolveFoodAsset } from '../../data/foodAssetRegistry';
import type { LocalFoodItem } from '../../data/localFoodCatalog';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = {
  item: LocalFoodItem;
  index: number;
  onPress: () => void;
};

export function FoodMarketCard({ item, index, onPress }: Props) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 420,
        delay: Math.min(index * 55, 400),
        useNativeDriver: true,
      }),
      Animated.spring(slide, {
        toValue: 0,
        friction: 8,
        tension: 60,
        delay: Math.min(index * 55, 400),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, slide, index]);

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        <Image source={resolveFoodAsset(item.imageKey)} style={styles.image} contentFit="cover" transition={200} />
        <View style={styles.darkPanel}>
          {item.badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeTxt}>{item.badge}</Text>
            </View>
          ) : null}
          <Text style={styles.name} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.desc} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>${item.price.toFixed(2)}</Text>
            <Text style={styles.add}>View</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    backgroundColor: '#1C1917',
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 10, 0.35)',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: '#292524',
  },
  darkPanel: {
    padding: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: '#1C1917',
    gap: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.primary,
    marginBottom: 4,
  },
  badgeTxt: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textOnGold,
    textTransform: 'uppercase',
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 26,
  },
  desc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  price: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primaryBright,
  },
  add: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryBright,
  },
});
