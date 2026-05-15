import React, { useEffect } from 'react';

import { subscribeFoodCatalog } from '../../services/food/foodCatalogFirestore';
import { useFoodCatalogStore } from '../../store/foodCatalogStore';

/**
 * Subscribes to `foodRestaurants` and hydrates `useFoodCatalogStore`.
 * Mount once under the Food stack so detail/cart screens share the same catalog.
 */
export function FoodCatalogSync() {
  const setCatalog = useFoodCatalogStore((s) => s.setCatalog);
  const setError = useFoodCatalogStore((s) => s.setError);

  useEffect(() => {
    const unsub = subscribeFoodCatalog(
      (rows, source) => setCatalog(rows, source),
      (msg) => setError(msg),
    );
    return unsub;
  }, [setCatalog, setError]);

  return null;
}
