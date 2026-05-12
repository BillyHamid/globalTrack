/**
 * Flags module-level : survivent au remount StrictMode, reset au logout.
 * Évite les doubles POST /alerts/refresh au chargement.
 */
export let bundleAlertRefreshDone = false

export function resetBundleAlertRefreshFlag() {
  bundleAlertRefreshDone = false
}

/** Retourne true une seule fois par session après le premier bundle chargé. */
export function consumeInitialBundleAlertRefresh(): boolean {
  if (bundleAlertRefreshDone) return false
  bundleAlertRefreshDone = true
  return true
}
