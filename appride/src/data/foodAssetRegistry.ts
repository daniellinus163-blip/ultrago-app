import type { ImageSourcePropType } from 'react-native';

/**
 * Phase 6 — local food images only (add a key here + a catalog row to ship new items).
 * Filenames match `assets/` on disk (including spaces).
 */
export const FOOD_ASSET_MANIFEST = {
  junk1: require('../../assets/junk1.jpg'),
  junk2: require('../../assets/junk2.jpg'),
  junk3: require('../../assets/junk3.jpg'),
  junk4: require('../../assets/junk food4.jpg'),
  junk5: require('../../assets/junk food 5.jpg'),
  junk6: require('../../assets/junk6.jpg'),
  junk7: require('../../assets/junk food7.jpg'),
  junk8: require('../../assets/junk food5.png'),
  junk9: require('../../assets/junk food6.pg.jpg'),
  junk10: require('../../assets/junk food10.jpg'),
  nourish1: require('../../assets/nourich food.jpg'),
  nourish2: require('../../assets/nourich dood2.jpg'),
  nourish3: require('../../assets/nourishfoor3.jpg'),
  nourish4: require('../../assets/nourish food4.jpg'),
  nourish5: require('../../assets/nourish food5.jpg'),
  nourish6: require('../../assets/nourishfood6.jpg'),
  nourish7: require('../../assets/nourish7.jpg'),
  nourish8: require('../../assets/nourish8.jpg'),
  nourish9: require('../../assets/nourish9.jpg'),
  nourish10: require('../../assets/nourish10.jpg'),
  dessert1: require('../../assets/desert.jpg'),
  dessert2: require('../../assets/desert2.jpg'),
  dessert3: require('../../assets/desert3.jpg'),
  dessert4: require('../../assets/desert4.jpg'),
  dessert5: require('../../assets/desert5.jpg'),
  dessert6: require('../../assets/desert6.jpg'),
  dessert7: require('../../assets/desert7.jpg'),
} as const;

export type FoodAssetKey = keyof typeof FOOD_ASSET_MANIFEST;

export function resolveFoodAsset(key: FoodAssetKey): ImageSourcePropType {
  return FOOD_ASSET_MANIFEST[key];
}

export function listFoodAssetKeys(): FoodAssetKey[] {
  return Object.keys(FOOD_ASSET_MANIFEST) as FoodAssetKey[];
}
