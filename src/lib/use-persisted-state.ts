import { useState, useEffect, useRef, type Dispatch, type SetStateAction } from "react"

const PREFIX = "globaltrack:draft:"

/**
 * useState qui se synchronise automatiquement avec localStorage.
 * Permet de conserver un brouillon de formulaire entre les sessions.
 *
 * @param key — clé unique pour ce champ (sera préfixée automatiquement)
 * @param initial — valeur initiale si rien n'est stocké
 */
export function usePersistedState<T>(
  key: string,
  initial: T,
): [T, Dispatch<SetStateAction<T>>] {
  const fullKey = PREFIX + key

  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return initial
    try {
      const stored = window.localStorage.getItem(fullKey)
      if (stored !== null) return JSON.parse(stored) as T
    } catch {
      /* parse error — fallback to initial */
    }
    return initial
  })

  // Skip the first persist (hydration)
  const isFirst = useRef(true)
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false
      return
    }
    try {
      window.localStorage.setItem(fullKey, JSON.stringify(state))
    } catch {
      /* quota exceeded or serialization error — silent fail */
    }
  }, [fullKey, state])

  return [state, setState]
}

/**
 * Supprime tous les brouillons commençant par le préfixe donné.
 * À appeler après confirmation/succès d'un formulaire.
 */
export function clearDraft(keyPrefix: string): void {
  if (typeof window === "undefined") return
  const fullPrefix = PREFIX + keyPrefix
  try {
    const keys: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i)
      if (k && k.startsWith(fullPrefix)) keys.push(k)
    }
    keys.forEach((k) => window.localStorage.removeItem(k))
  } catch {
    /* silent fail */
  }
}

/**
 * Vérifie si un brouillon existe pour ce préfixe.
 */
export function hasDraft(keyPrefix: string): boolean {
  if (typeof window === "undefined") return false
  const fullPrefix = PREFIX + keyPrefix
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i)
      if (k && k.startsWith(fullPrefix)) return true
    }
  } catch {
    /* silent fail */
  }
  return false
}
