export interface TACEntry {
  brand: string
  model: string
  type: "smartphone" | "tablet" | "feature_phone" | "wearable"
}

// TAC = Type Allocation Code (first 8 digits of IMEI)
// Maps TAC prefixes to device info. Longer prefixes are matched first.
const TAC_DATABASE: Record<string, TACEntry> = {
  // ── Apple iPhone ──
  "35332509": { brand: "Apple", model: "iPhone 6", type: "smartphone" },
  "35391508": { brand: "Apple", model: "iPhone 6s", type: "smartphone" },
  "35456789": { brand: "Apple", model: "iPhone 7", type: "smartphone" },
  "35556700": { brand: "Apple", model: "iPhone 7 Plus", type: "smartphone" },
  "35388209": { brand: "Apple", model: "iPhone 8", type: "smartphone" },
  "35397009": { brand: "Apple", model: "iPhone 8 Plus", type: "smartphone" },
  "35369480": { brand: "Apple", model: "iPhone X", type: "smartphone" },
  "35320010": { brand: "Apple", model: "iPhone XR", type: "smartphone" },
  "35384110": { brand: "Apple", model: "iPhone XS", type: "smartphone" },
  "35300811": { brand: "Apple", model: "iPhone 11", type: "smartphone" },
  "35390111": { brand: "Apple", model: "iPhone 11 Pro", type: "smartphone" },
  "35322311": { brand: "Apple", model: "iPhone 11 Pro Max", type: "smartphone" },
  "35407012": { brand: "Apple", model: "iPhone 12", type: "smartphone" },
  "35281412": { brand: "Apple", model: "iPhone 12 Mini", type: "smartphone" },
  "35376112": { brand: "Apple", model: "iPhone 12 Pro", type: "smartphone" },
  "35392112": { brand: "Apple", model: "iPhone 12 Pro Max", type: "smartphone" },
  "35432513": { brand: "Apple", model: "iPhone 13", type: "smartphone" },
  "35416013": { brand: "Apple", model: "iPhone 13 Mini", type: "smartphone" },
  "35415213": { brand: "Apple", model: "iPhone 13 Pro", type: "smartphone" },
  "35388113": { brand: "Apple", model: "iPhone 13 Pro Max", type: "smartphone" },
  "35449014": { brand: "Apple", model: "iPhone 14", type: "smartphone" },
  "35468014": { brand: "Apple", model: "iPhone 14 Plus", type: "smartphone" },
  "35459014": { brand: "Apple", model: "iPhone 14 Pro", type: "smartphone" },
  "35479014": { brand: "Apple", model: "iPhone 14 Pro Max", type: "smartphone" },
  "35901890": { brand: "Apple", model: "iPhone 15", type: "smartphone" },
  "35911890": { brand: "Apple", model: "iPhone 15 Plus", type: "smartphone" },
  "35921890": { brand: "Apple", model: "iPhone 15 Pro", type: "smartphone" },
  "35931890": { brand: "Apple", model: "iPhone 15 Pro Max", type: "smartphone" },
  "35940016": { brand: "Apple", model: "iPhone 16", type: "smartphone" },
  "35950016": { brand: "Apple", model: "iPhone 16 Plus", type: "smartphone" },
  "35960016": { brand: "Apple", model: "iPhone 16 Pro", type: "smartphone" },
  "35970016": { brand: "Apple", model: "iPhone 16 Pro Max", type: "smartphone" },
  "35320622": { brand: "Apple", model: "iPhone SE (2022)", type: "smartphone" },

  // ── Samsung ──
  "35345678": { brand: "Samsung", model: "Galaxy S24 Ultra", type: "smartphone" },
  "35285210": { brand: "Samsung", model: "Galaxy S23", type: "smartphone" },
  "35295210": { brand: "Samsung", model: "Galaxy S23 Ultra", type: "smartphone" },
  "35265110": { brand: "Samsung", model: "Galaxy S22", type: "smartphone" },
  "35275110": { brand: "Samsung", model: "Galaxy S22 Ultra", type: "smartphone" },
  "35254910": { brand: "Samsung", model: "Galaxy S21", type: "smartphone" },
  "35200808": { brand: "Samsung", model: "Galaxy S20", type: "smartphone" },
  "35490611": { brand: "Samsung", model: "Galaxy A54", type: "smartphone" },
  "35480611": { brand: "Samsung", model: "Galaxy A53", type: "smartphone" },
  "35470611": { brand: "Samsung", model: "Galaxy A34", type: "smartphone" },
  "35460611": { brand: "Samsung", model: "Galaxy A14", type: "smartphone" },
  "35440611": { brand: "Samsung", model: "Galaxy A15", type: "smartphone" },
  "35420611": { brand: "Samsung", model: "Galaxy M54", type: "smartphone" },
  "35520612": { brand: "Samsung", model: "Galaxy S24", type: "smartphone" },
  "35530612": { brand: "Samsung", model: "Galaxy S24+", type: "smartphone" },
  "35600612": { brand: "Samsung", model: "Galaxy Z Flip 5", type: "smartphone" },
  "35610612": { brand: "Samsung", model: "Galaxy Z Fold 5", type: "smartphone" },
  "35245010": { brand: "Samsung", model: "Galaxy Note 20", type: "smartphone" },

  // ── Xiaomi ──
  "86186403": { brand: "Xiaomi", model: "Redmi Note 13 Pro", type: "smartphone" },
  "86186503": { brand: "Xiaomi", model: "Redmi Note 12", type: "smartphone" },
  "86186603": { brand: "Xiaomi", model: "Redmi 13C", type: "smartphone" },
  "86288103": { brand: "Xiaomi", model: "13T Pro", type: "smartphone" },
  "86288203": { brand: "Xiaomi", model: "14", type: "smartphone" },
  "86288303": { brand: "Xiaomi", model: "Poco X6 Pro", type: "smartphone" },
  "86288403": { brand: "Xiaomi", model: "Poco F5", type: "smartphone" },
  "86390103": { brand: "Xiaomi", model: "Redmi Note 11", type: "smartphone" },

  // ── Tecno ──
  "35820714": { brand: "Tecno", model: "Camon 20 Pro", type: "smartphone" },
  "35830714": { brand: "Tecno", model: "Camon 30 Pro", type: "smartphone" },
  "35840714": { brand: "Tecno", model: "Spark 20 Pro+", type: "smartphone" },
  "35850714": { brand: "Tecno", model: "Phantom V Fold", type: "smartphone" },
  "35860714": { brand: "Tecno", model: "Spark 10", type: "smartphone" },
  "35870714": { brand: "Tecno", model: "Pova 5 Pro", type: "smartphone" },
  "35880714": { brand: "Tecno", model: "Phantom X2", type: "smartphone" },

  // ── Infinix ──
  "35720815": { brand: "Infinix", model: "Note 30 Pro", type: "smartphone" },
  "35730815": { brand: "Infinix", model: "Hot 30", type: "smartphone" },
  "35740815": { brand: "Infinix", model: "Zero 30", type: "smartphone" },
  "35750815": { brand: "Infinix", model: "Smart 8", type: "smartphone" },
  "35760815": { brand: "Infinix", model: "GT 10 Pro", type: "smartphone" },

  // ── Itel ──
  "35620916": { brand: "Itel", model: "A60", type: "smartphone" },
  "35630916": { brand: "Itel", model: "P40", type: "smartphone" },
  "35640916": { brand: "Itel", model: "S23", type: "smartphone" },
  "35650916": { brand: "Itel", model: "A70", type: "smartphone" },

  // ── Huawei ──
  "86080003": { brand: "Huawei", model: "P30 Pro", type: "smartphone" },
  "86080103": { brand: "Huawei", model: "P40 Pro", type: "smartphone" },
  "86080203": { brand: "Huawei", model: "Mate 50 Pro", type: "smartphone" },
  "86080303": { brand: "Huawei", model: "Nova 11", type: "smartphone" },
  "86080403": { brand: "Huawei", model: "Y9 Prime", type: "smartphone" },

  // ── Oppo ──
  "86420017": { brand: "Oppo", model: "Reno 10 Pro", type: "smartphone" },
  "86430017": { brand: "Oppo", model: "A78", type: "smartphone" },
  "86440017": { brand: "Oppo", model: "Find X6 Pro", type: "smartphone" },
  "86450017": { brand: "Oppo", model: "A58", type: "smartphone" },

  // ── Realme ──
  "86520018": { brand: "Realme", model: "11 Pro", type: "smartphone" },
  "86530018": { brand: "Realme", model: "C55", type: "smartphone" },
  "86540018": { brand: "Realme", model: "GT Neo 5", type: "smartphone" },
  "86550018": { brand: "Realme", model: "Narzo 60", type: "smartphone" },

  // ── Vivo ──
  "86620019": { brand: "Vivo", model: "V29", type: "smartphone" },
  "86630019": { brand: "Vivo", model: "Y36", type: "smartphone" },

  // ── Nokia ──
  "35181508": { brand: "Nokia", model: "G22", type: "smartphone" },
  "35191508": { brand: "Nokia", model: "C32", type: "smartphone" },

  // ── Motorola ──
  "35090017": { brand: "Motorola", model: "Moto G54", type: "smartphone" },
  "35100017": { brand: "Motorola", model: "Edge 40", type: "smartphone" },
}

// Brand prefix patterns for fallback detection (first 2 digits of TAC)
const BRAND_PREFIXES: Record<string, string> = {
  "35": "Generic (could be Samsung, Apple, Nokia, etc.)",
  "86": "Generic (could be Xiaomi, Huawei, Oppo, etc.)",
}

import TAC_OSMOCOM from "./tac-osmocom"

/**
 * Look up device info from the first 8 digits of an IMEI.
 * Checks the curated database first, then the osmocom database.
 */
export function lookupTAC(imei: string): TACEntry | null {
  if (imei.length < 8) return null
  const tac = imei.substring(0, 8)
  return TAC_DATABASE[tac] ?? TAC_OSMOCOM[tac] ?? null
}

export type TacResolveKind = "exact" | "prefix"

/**
 * Résolution TAC pour un IMEI (≥ 8 chiffres) : match exact 8 digits, sinon préfixe 7 puis 6
 * sur la base curée puis Osmocom (~19k TAC). À utiliser au clic « Vérifier », pas à chaque frappe.
 */
export function resolveTACForIMEI(imei: string): { entry: TACEntry; kind: TacResolveKind } | null {
  if (imei.length < 8) return null
  const exact = lookupTAC(imei)
  if (exact) return { entry: exact, kind: "exact" }

  for (let len = 7; len >= 6; len--) {
    const prefix = imei.substring(0, len)
    for (const [key, entry] of Object.entries(TAC_DATABASE)) {
      if (key.startsWith(prefix)) return { entry, kind: "prefix" }
    }
    for (const [key, entry] of Object.entries(TAC_OSMOCOM)) {
      if (key.startsWith(prefix)) return { entry, kind: "prefix" }
    }
  }
  return null
}

/**
 * Try to identify the brand from partial IMEI (6+ digits).
 * Uses progressively shorter prefix matching.
 */
export function identifyBrandFromPartial(imei: string): TACEntry | null {
  if (imei.length < 6) return null
  const tac8 = imei.substring(0, 8).padEnd(8, "0")

  // Try exact 8-digit match first
  if (imei.length >= 8) {
    const exact = TAC_DATABASE[imei.substring(0, 8)]
    if (exact) return exact
  }

  // Try prefix matching: find any TAC that starts with the same prefix
  const prefix = imei.substring(0, Math.min(imei.length, 6))
  for (const [tac, entry] of Object.entries(TAC_DATABASE)) {
    if (tac.startsWith(prefix)) return entry
  }

  return null
}

export { TAC_DATABASE, BRAND_PREFIXES }
