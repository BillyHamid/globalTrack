/** Petite pause entre deux tentatives (API externes souvent instables). */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

interface RetryOptions {
  /** Nombre de tentatives (défaut 3) */
  attempts?: number
  /** Délai avant chaque nouvelle tentative après la 1ère (ms). Ex: [400, 1200] */
  delaysMs?: number[]
}

/**
 * Réessaie tant que le résultat est `null` (échec réseau / 403 / timeout).
 * Utile pour IMEICheck et Reincubate qui répondent parfois au 2e ou 3e essai.
 */
export async function retryWhileNull<T>(
  fn: () => Promise<T | null>,
  options: RetryOptions = {},
): Promise<T | null> {
  const attempts = options.attempts ?? 3
  const delays = options.delaysMs ?? [400, 1200]

  let last: T | null = null
  for (let i = 0; i < attempts; i++) {
    if (i > 0) {
      const wait = delays[i - 1] ?? 2000
      await sleep(wait)
    }
    try {
      last = await fn()
    } catch {
      last = null
    }
    if (last !== null) return last
  }
  return last
}

type CacheEntry<T> = { exp: number; value: T | null }

const caches = new Map<string, CacheEntry<unknown>>()

/**
 * Cache court : succès long (évite de re-frapper l’API), échec court (permet de réessayer vite).
 */
export function getCached<T>(key: string): T | null | undefined {
  const e = caches.get(key) as CacheEntry<T> | undefined
  if (!e) return undefined
  if (Date.now() > e.exp) {
    caches.delete(key)
    return undefined
  }
  return e.value
}

export function setCached<T>(key: string, value: T | null, success: boolean): void {
  const ttlMs = success ? 5 * 60 * 1000 : 25 * 1000
  caches.set(key, { exp: Date.now() + ttlMs, value })
}
