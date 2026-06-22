import { useEffect, useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MAX = 20;

/**
 * Persisted ring buffer of recently-viewed product ids.
 *
 * - Most recent first.
 * - Duplicates are removed before insertion so re-visiting a product simply
 *   moves it to the front, never bloats the list.
 * - Cleared on logout? No — kept across sessions. Users expect "recently
 *   viewed" to survive sign-out (it's not sensitive data).
 */
export const useHistoryStore = create(
  persist(
    (set, get) => ({
      ids: [],
      push: (id) => {
        const n = Number(id);
        if (!Number.isFinite(n)) return;
        const cur = get().ids.filter((x) => x !== n);
        set({ ids: [n, ...cur].slice(0, MAX) });
      },
      clear: () => set({ ids: [] }),
    }),
    { name: 'browsing-history' },
  ),
);

/** Push the given product id onto the history once when this component mounts. */
export function useTrackProductView(productId) {
  const push = useHistoryStore((s) => s.push);
  useEffect(() => {
    if (productId == null) return;
    push(productId);
  }, [productId, push]);
}

/** Returns the recent ids, excluding the current product. Selector memoizes
 *  the array so consumers don't re-render on identity-only changes. */
export function useHistoryIds({ excludeId, limit = 12 } = {}) {
  const ids = useHistoryStore((s) => s.ids);
  return useMemo(() => {
    const exclude = excludeId == null ? null : Number(excludeId);
    return ids.filter((id) => id !== exclude).slice(0, limit);
  }, [ids, excludeId, limit]);
}
