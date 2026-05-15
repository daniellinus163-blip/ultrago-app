import {
  collection,
  getDocs,
  onSnapshot,
  writeBatch,
  doc,
  type DocumentData,
} from 'firebase/firestore';

import { COLLECTIONS } from '../../constants/firebaseCollections';
import { MOCK_RESTAURANTS } from '../../data/mockRestaurants';
import type { FoodCategoryId, FoodMenuItem, Restaurant } from '../../types/food';
import { getDb } from '../firebase/firestore';
import { getFirebaseApp } from '../firebase/app';

export type FoodCatalogSource = 'firestore' | 'local';

function stableHash(id: string, salt: number): number {
  let x = salt;
  for (let i = 0; i < id.length; i++) {
    x = (x * 31 + id.charCodeAt(i)) % 100000;
  }
  return x / 100000;
}

function normalizeRestaurant(id: string, raw: DocumentData): Restaurant | null {
  const name = typeof raw.name === 'string' ? raw.name : '';
  const tagline = typeof raw.tagline === 'string' ? raw.tagline : '';
  const rating = typeof raw.rating === 'number' ? raw.rating : Number(raw.rating) || 0;
  const etaMin = typeof raw.etaMin === 'number' ? raw.etaMin : Number(raw.etaMin) || 30;
  const deliveryFee =
    typeof raw.deliveryFee === 'number' ? raw.deliveryFee : Number(raw.deliveryFee) || 0;
  const heroEmoji = typeof raw.heroEmoji === 'string' ? raw.heroEmoji : '🍽️';
  const imageUrl = typeof raw.imageUrl === 'string' ? raw.imageUrl : undefined;
  const categories = Array.isArray(raw.categories) ? (raw.categories as FoodCategoryId[]) : [];
  const menu = Array.isArray(raw.menu) ? (raw.menu as FoodMenuItem[]) : [];
  const popularScore =
    typeof raw.popularScore === 'number'
      ? raw.popularScore
      : raw.popularScore != null
        ? Number(raw.popularScore)
        : undefined;
  const lat = typeof raw.lat === 'number' ? raw.lat : raw.lat != null ? Number(raw.lat) : undefined;
  const lng = typeof raw.lng === 'number' ? raw.lng : raw.lng != null ? Number(raw.lng) : undefined;

  if (!name || !menu.length) {
    return null;
  }

  const filteredCats = categories.filter((c): c is Exclude<FoodCategoryId, 'all'> => c !== 'all');
  const popular = popularScore ?? Math.min(100, Math.round(rating * 18));
  const latN = lat ?? 6.44 + stableHash(id, 3) * 0.1;
  const lngN = lng ?? 3.35 + stableHash(id, 7) * 0.14;

  return {
    id,
    name,
    tagline,
    rating,
    etaMin,
    deliveryFee,
    categories: filteredCats.length ? filteredCats : ['fast_food'],
    heroEmoji,
    imageUrl,
    popularScore: popular,
    lat: latN,
    lng: lngN,
    menu,
  };
}

function sortCatalog(rows: Restaurant[]): Restaurant[] {
  return [...rows].sort(
    (a, b) => (b.popularScore ?? b.rating * 18) - (a.popularScore ?? a.rating * 18),
  );
}

function restaurantToFirestoreDoc(r: Restaurant): DocumentData {
  const { id: _id, ...rest } = r;
  return JSON.parse(JSON.stringify(rest));
}

/**
 * One-time dev seed: writes bundled catalog when the collection is empty.
 * Enable with `EXPO_PUBLIC_FOOD_AUTO_SEED=1` (never ship wide-open writes in production).
 */
export async function tryAutoSeedFoodCatalog(): Promise<boolean> {
  if (process.env.EXPO_PUBLIC_FOOD_AUTO_SEED !== '1') {
    return false;
  }
  const db = getDb();
  const colRef = collection(db, COLLECTIONS.foodRestaurants);
  const snap = await getDocs(colRef);
  if (!snap.empty) {
    return false;
  }
  const batch = writeBatch(db);
  for (const r of MOCK_RESTAURANTS) {
    const ref = doc(db, COLLECTIONS.foodRestaurants, r.id);
    batch.set(ref, restaurantToFirestoreDoc(r));
  }
  await batch.commit();
  return true;
}

function mapSnapshot(snap: { docs: { id: string; data: () => DocumentData }[] }): Restaurant[] {
  const rows: Restaurant[] = [];
  for (const d of snap.docs) {
    const row = normalizeRestaurant(d.id, d.data());
    if (row) {
      rows.push(row);
    }
  }
  return sortCatalog(rows);
}

/**
 * Live marketplace catalog. Falls back to bundled seed when Firebase is off, rules block reads, or catalog is empty.
 */
export function subscribeFoodCatalog(
  onUpdate: (rows: Restaurant[], source: FoodCatalogSource) => void,
  onError?: (message: string) => void,
): () => void {
  let cancelled = false;

  try {
    getFirebaseApp();
  } catch {
    onUpdate(MOCK_RESTAURANTS, 'local');
    return () => {
      cancelled = true;
    };
  }

  const col = collection(getDb(), COLLECTIONS.foodRestaurants);

  const unsub = onSnapshot(
    col,
    (snap) => {
      void (async () => {
        if (cancelled) {
          return;
        }
        if (!snap.empty) {
          onUpdate(mapSnapshot(snap), 'firestore');
          return;
        }
        try {
          await tryAutoSeedFoodCatalog();
        } catch (e) {
          onError?.(e instanceof Error ? e.message : 'Food catalog seed failed');
        }
        if (cancelled) {
          return;
        }
        const again = await getDocs(col);
        if (!again.empty) {
          onUpdate(mapSnapshot(again), 'firestore');
        } else {
          onUpdate(MOCK_RESTAURANTS, 'local');
        }
      })();
    },
    (err) => {
      onError?.(err.message);
      if (!cancelled) {
        onUpdate(MOCK_RESTAURANTS, 'local');
      }
    },
  );

  return () => {
    cancelled = true;
    unsub();
  };
}
