import type { FoodAssetKey } from './foodAssetRegistry';

export type FoodMarketCategory = 'junk_food' | 'nourishing_food' | 'desserts';

export type LocalFoodItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: FoodMarketCategory;
  imageKey: FoodAssetKey;
  /** Merchandising badge on cards */
  badge?: string;
};

export const FOOD_MARKET_CATEGORY_LABELS: Record<FoodMarketCategory, string> = {
  junk_food: 'Junk Food',
  nourishing_food: 'Nourishing Food',
  desserts: 'Desserts',
};

export const ULTRAGO_FOOD_VENDOR_ID = 'ultrago-food';

const JUNK_ITEMS: Omit<LocalFoodItem, 'category'>[] = [
  { id: 'junk-neon-crunch', name: 'Neon Crunch Burger', description: 'Double patty, melted cheddar, secret gold sauce.', price: 12.99, imageKey: 'junk1', badge: 'Popular' },
  { id: 'junk-triple-melt', name: 'Triple Stack Melt', description: 'Three beef layers, grilled onions, brioche bun.', price: 14.5, imageKey: 'junk2' },
  { id: 'junk-crispy-box', name: 'Crispy Chicken Box', description: 'Crunchy tenders with fries and smoky dip.', price: 11.25, imageKey: 'junk3' },
  { id: 'junk-fry-mountain', name: 'Loaded Fry Mountain', description: 'Seasoned fries, bacon bits, cheese flood.', price: 8.99, imageKey: 'junk4' },
  { id: 'junk-midnight-slice', name: 'Midnight Pizza Slice', description: 'Pepperoni, mozzarella pull, garlic crust.', price: 9.5, imageKey: 'junk5' },
  { id: 'junk-wing-bucket', name: 'Spicy Wing Bucket', description: 'Eight wings tossed in hot honey glaze.', price: 13.75, imageKey: 'junk6', badge: 'Spicy' },
  { id: 'junk-bbq-sub', name: 'BBQ Bacon Sub', description: 'Smoky pulled pork, crispy bacon, pickles.', price: 10.99, imageKey: 'junk7' },
  { id: 'junk-nacho-blast', name: 'Cheesy Nacho Blast', description: 'Tortilla chips, queso, jalapeños, salsa.', price: 7.99, imageKey: 'junk8' },
  { id: 'junk-mega-dog', name: 'Mega Hot Dog', description: 'Foot-long frank, mustard zigzag, onion crunch.', price: 6.5, imageKey: 'junk9' },
  { id: 'junk-double-tacos', name: 'Double Decker Tacos', description: 'Soft + hard shell, seasoned beef, lime crema.', price: 11.99, imageKey: 'junk10' },
  { id: 'junk-golden-bites', name: 'Golden Bite Sliders', description: 'Three mini burgers, pickle chips, special sauce.', price: 10.49, imageKey: 'junk1' },
  { id: 'junk-cheese-fries', name: 'Ultra Cheese Fries', description: 'Shoestring fries drowned in cheddar fondue.', price: 7.25, imageKey: 'junk2' },
  { id: 'junk-spicy-sandwich', name: 'Firecracker Sandwich', description: 'Crispy chicken, cayenne mayo, slaw crunch.', price: 11.75, imageKey: 'junk3' },
  { id: 'junk-onion-rings', name: 'Ring Tower Combo', description: 'Beer-battered rings with ranch dip cup.', price: 6.99, imageKey: 'junk4' },
  { id: 'junk-combo-feast', name: 'Weekend Combo Feast', description: 'Burger, fries, drink — built for sharing.', price: 15.99, imageKey: 'junk5', badge: 'Combo' },
];

const NOURISH_ITEMS: Omit<LocalFoodItem, 'category'>[] = [
  { id: 'nour-garden-glow', name: 'Garden Glow Bowl', description: 'Mixed greens, roasted chickpeas, lemon tahini.', price: 13.99, imageKey: 'nourish1', badge: 'Fresh' },
  { id: 'nour-quinoa-power', name: 'Quinoa Power Plate', description: 'Tri-color quinoa, avocado, herb dressing.', price: 14.5, imageKey: 'nourish2' },
  { id: 'nour-harvest-wrap', name: 'Avocado Harvest Wrap', description: 'Whole-wheat wrap, hummus, crunchy veg.', price: 12.25, imageKey: 'nourish3' },
  { id: 'nour-salmon-greens', name: 'Steamed Salmon Greens', description: 'Omega-rich fillet, asparagus, dill yogurt.', price: 16.99, imageKey: 'nourish4' },
  { id: 'nour-buddha-bowl', name: 'Protein Buddha Bowl', description: 'Brown rice, tofu, edamame, sesame seeds.', price: 15.5, imageKey: 'nourish5' },
  { id: 'nour-lean-chicken', name: 'Lean Chicken & Rice', description: 'Grilled breast, jasmine rice, ginger glaze.', price: 13.25, imageKey: 'nourish6' },
  { id: 'nour-mezze-box', name: 'Mediterranean Mezze Box', description: 'Falafel, tabbouleh, olives, pita wedges.', price: 12.99, imageKey: 'nourish7' },
  { id: 'nour-berry-oat', name: 'Fresh Berry Oat Cup', description: 'Steel-cut oats, blueberries, almond butter.', price: 9.99, imageKey: 'nourish8' },
  { id: 'nour-detox-smoothie', name: 'Green Detox Smoothie Bowl', description: 'Spinach, banana, chia, coconut flakes.', price: 11.5, imageKey: 'nourish9' },
  { id: 'nour-veggie-plate', name: 'Grilled Veggie Plate', description: 'Seasonal vegetables, olive oil, herbs.', price: 12.75, imageKey: 'nourish10' },
  { id: 'nour-sunrise-bowl', name: 'Sunrise Acai Bowl', description: 'Acai base, granola, honey drizzle.', price: 10.99, imageKey: 'nourish1' },
  { id: 'nour-turkey-avocado', name: 'Turkey Avocado Plate', description: 'Lean turkey, avocado roses, microgreens.', price: 14.25, imageKey: 'nourish2' },
  { id: 'nour-lentil-soup', name: 'Hearty Lentil Soup', description: 'Red lentils, cumin, warm whole-grain roll.', price: 9.5, imageKey: 'nourish3' },
  { id: 'nour-citrus-salad', name: 'Citrus Kale Salad', description: 'Kale, orange segments, pumpkin seeds.', price: 11.99, imageKey: 'nourish4' },
  { id: 'nour-grain-bowl', name: 'Ancient Grain Bowl', description: 'Farro, roasted beets, goat cheese crumble.', price: 13.75, imageKey: 'nourish5' },
];

const DESSERT_ITEMS: Omit<LocalFoodItem, 'category'>[] = [
  { id: 'dess-lava-cake', name: 'Golden Lava Cake', description: 'Warm chocolate center, vanilla bean scoop.', price: 6.99, imageKey: 'dessert1', badge: 'Chef pick' },
  { id: 'dess-cheesecake', name: 'Berry Cheesecake Slice', description: 'Cream cheese filling, mixed berry coulis.', price: 7.5, imageKey: 'dessert2' },
  { id: 'dess-mousse', name: 'Chocolate Mousse Cup', description: 'Silky dark chocolate, gold leaf flake.', price: 5.99, imageKey: 'dessert3' },
  { id: 'dess-brulee', name: 'Caramel Crème Brûlée', description: 'Torched sugar crust, Madagascar vanilla.', price: 7.25, imageKey: 'dessert4' },
  { id: 'dess-kulfi', name: 'Pistachio Kulfi Scoop', description: 'Cardamom notes, crushed pistachios.', price: 5.5, imageKey: 'dessert5' },
];

export const LOCAL_FOOD_CATALOG: LocalFoodItem[] = [
  ...JUNK_ITEMS.map((i) => ({ ...i, category: 'junk_food' as const })),
  ...NOURISH_ITEMS.map((i) => ({ ...i, category: 'nourishing_food' as const })),
  ...DESSERT_ITEMS.map((i) => ({ ...i, category: 'desserts' as const })),
];

export const FOOD_MARKET_CATEGORIES: FoodMarketCategory[] = ['junk_food', 'nourishing_food', 'desserts'];

export function getLocalFoodItemById(id: string): LocalFoodItem | undefined {
  return LOCAL_FOOD_CATALOG.find((i) => i.id === id);
}

export function getLocalFoodItemsByCategory(category: FoodMarketCategory | 'all'): LocalFoodItem[] {
  if (category === 'all') {
    return LOCAL_FOOD_CATALOG;
  }
  return LOCAL_FOOD_CATALOG.filter((i) => i.category === category);
}

export function searchLocalFoodCatalog(query: string): LocalFoodItem[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return LOCAL_FOOD_CATALOG;
  }
  return LOCAL_FOOD_CATALOG.filter(
    (i) =>
      i.name.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      FOOD_MARKET_CATEGORY_LABELS[i.category].toLowerCase().includes(q),
  );
}
