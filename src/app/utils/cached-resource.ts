import { signal, Signal } from '@angular/core';
import { Observable, of, finalize, shareReplay, tap } from 'rxjs';

/**
 * In-memory cache for a single resource with TTL and mutation helpers.
 *
 * Usage in a service:
 *   private readonly _cache = new CachedResource<Foo[]>(10 * 60 * 1000);
 *   readonly items: Signal<Foo[]> = computed(() => this._cache.value() ?? []);
 *
 *   list(force = false): Observable<Foo[]> {
 *     return this._cache.load(() => this.api.get('/api/foos'), force);
 *   }
 *   create(f: Foo) { return this.api.post(...).pipe(tap(c => this._cache.update(list => [...(list ?? []), c]))); }
 */
export class CachedResource<T> {
  private readonly _value = signal<T | null>(null);
  private lastFetch = 0;
  private inFlight: Observable<T> | null = null;

  /** Readonly signal — consume in templates or computed. */
  readonly value: Signal<T | null> = this._value.asReadonly();

  constructor(private readonly ttlMs: number = 5 * 60 * 1000) {}

  /**
   * Returns cached data if fresh; otherwise fetches via `fetcher`.
   * Concurrent calls share the in-flight request.
   * `force = true` bypasses TTL.
   */
  load(fetcher: () => Observable<T>, force = false): Observable<T> {
    const cached = this._value();
    if (!force && cached !== null && Date.now() - this.lastFetch < this.ttlMs) {
      return of(cached);
    }
    if (this.inFlight) return this.inFlight;

    this.inFlight = fetcher().pipe(
      tap((data) => {
        this._value.set(data);
        this.lastFetch = Date.now();
      }),
      finalize(() => { this.inFlight = null; }),
      shareReplay(1),
    );

    return this.inFlight;
  }

  /** Overwrite cache with a known value (e.g. POST response). Refreshes TTL. */
  set(data: T): void {
    this._value.set(data);
    this.lastFetch = Date.now();
  }

  /** Transform cached value in-place (e.g. splice an updated item into a list). */
  update(fn: (current: T | null) => T): void {
    this.set(fn(this._value()));
  }

  /** Expire the TTL so the next `load()` re-fetches. Cached value is kept until replaced. */
  invalidate(): void {
    this.lastFetch = 0;
  }
}

/**
 * Map of CachedResource keyed by a string (e.g. query params).
 * Useful for parameterized list endpoints like /api/timbrado?anio=&mes=.
 */
export class KeyedCachedResource<T> {
  private readonly buckets = new Map<string, CachedResource<T>>();

  constructor(private readonly ttlMs: number = 5 * 60 * 1000) {}

  load(key: string, fetcher: () => Observable<T>, force = false): Observable<T> {
    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = new CachedResource<T>(this.ttlMs);
      this.buckets.set(key, bucket);
    }
    return bucket.load(fetcher, force);
  }

  /** Expire TTL on every cached key — call after a mutation that affects all filters. */
  invalidateAll(): void {
    this.buckets.forEach((b) => b.invalidate());
  }

  invalidate(key: string): void {
    this.buckets.get(key)?.invalidate();
  }
}
