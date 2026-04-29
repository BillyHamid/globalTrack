/**
 * Lignes d'appareils gérées dans l'app (stock / saisie).
 * Apple est ventilé par type ; Android ciblé sur Samsung.
 */
export type AppDeviceLine = "iPhone" | "iPad" | "Watch" | "MacBook" | "Samsung"

export const APP_DEVICE_LINES: AppDeviceLine[] = [
  "iPhone",
  "iPad",
  "Watch",
  "MacBook",
  "Samsung",
]

/** Déduit la ligne Apple à partir du libellé marketing ou du modèle TAC. */
export function inferAppleLineFromMarketingName(name: string): "iPhone" | "iPad" | "Watch" | "MacBook" {
  const n = name.toLowerCase()
  if (
    n.includes("macbook")
    || n.includes("imac")
    || n.includes("mac mini")
    || n.includes("mac studio")
    || n.includes("mac pro")
  ) {
    return "MacBook"
  }
  if (n.includes("ipad")) return "iPad"
  if (n.includes("watch")) return "Watch"
  return "iPhone"
}
