/**
 * InMemHybridCache<K, V>
 *
 * A generic in-memory cache with:
 * - Maximum entry limit (evicts oldest when exceeded)
 * - Sliding expiration (timeout refreshed on access)
 * - Optional absolute max staleness (TTL) per entry
 *
 * This cache is suitable for scenarios where you want to keep hot data in memory,
 * but also want to ensure memory is bounded and stale data is eventually evicted.
 *
 * Usage Example:
 *
 * ```ts
 * // Create timeouts (in milliseconds) for sliding and absolute expiration
 * const slidingTimeout = 10 * 60 * 1000; // 10 minutes
 * const absoluteTimeout = 4 * 60 * 60 * 1000; // 4 hours
 *
 * // Create a cache for up to 100 campuses, 10 min sliding, 4 hr absolute TTL
 * const cache = new InMemHybridCache<string, string[]>(100, slidingTimeout, absoluteTimeout);
 *
 * // Set a value
 * cache.set('campusId', ['admin1', 'admin2']);
 *
 * // Get a value (refreshes sliding expiration)
 * const admins = cache.get('campusId');
 *
 * // Manually delete a value
 * cache.delete('campusId');
 *
 * // Clear the entire cache
 * cache.clear();
 * ```
 *
 * @template K - The type of the cache key
 * @template V - The type of the cache value
 */
export class InMemHybridCache<K, V> {
  /**
   * Internal cache map storing entries and their timers.
   */
  private cache = new Map<
    K,
    {
      value: V;
      addedAt: number;
      slidingTimeout?: NodeJS.Timeout;
      absoluteTimeout?: NodeJS.Timeout;
    }
  >();

  /**
   * @param maxEntries Maximum number of entries to keep in cache. Oldest is evicted when exceeded.
   * @param slidingMs Sliding expiration in milliseconds. Entry is evicted if not accessed within this time. (Set 0 to disable)
   * @param absoluteMs Optional absolute max staleness (TTL) in milliseconds. Entry is evicted after this time, regardless of access. (Set 0 or undefined to disable)
   */
  constructor(
    private readonly maxEntries: number,
    private readonly slidingMs: number,
    private readonly absoluteMs?: number,
  ) {}

  /**
   * Set a value in the cache. If the cache exceeds maxEntries, the oldest entry is evicted.
   * @param key The cache key
   * @param value The value to cache
   */
  set(key: K, value: V): void {
    // Evict oldest if over max entries
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      this.delete(oldestKey);
    }

    // Remove existing timers for this key
    this.delete(key);

    // Set absolute max TTL if provided
    let absoluteTimeout: NodeJS.Timeout | undefined;
    if (this.absoluteMs && this.absoluteMs > 0) {
      absoluteTimeout = setTimeout(() => this.delete(key), this.absoluteMs);
    }

    // Set sliding expiration if provided
    let slidingTimeout: NodeJS.Timeout | undefined;
    if (this.slidingMs > 0) {
      slidingTimeout = setTimeout(() => this.delete(key), this.slidingMs);
    }

    this.cache.set(key, {
      value,
      addedAt: Date.now(),
      slidingTimeout,
      absoluteTimeout,
    });
  }

  /**
   * Get a value from the cache. Refreshes the sliding expiration timer if enabled.
   * @param key The cache key
   * @returns The cached value, or undefined if not present or expired
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Refresh sliding expiration
    if (entry.slidingTimeout) {
      clearTimeout(entry.slidingTimeout);
      entry.slidingTimeout = setTimeout(() => this.delete(key), this.slidingMs);
    }

    return entry.value;
  }

  /**
   * Delete a value from the cache and clear its timers.
   * @param key The cache key
   */
  delete(key: K): void {
    const entry = this.cache.get(key);
    if (entry) {
      if (entry.slidingTimeout) clearTimeout(entry.slidingTimeout);
      if (entry.absoluteTimeout) clearTimeout(entry.absoluteTimeout);
      this.cache.delete(key);
    }
  }

  /**
   * Clear all entries from the cache and all timers.
   */
  clear(): void {
    for (const key of this.cache.keys()) {
      this.delete(key);
    }
  }

  /**
   * Get the number of entries currently in the cache.
   */
  size(): number {
    return this.cache.size;
  }
}
