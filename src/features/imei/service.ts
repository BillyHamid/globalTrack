import { validateIMEI } from "@/lib/utils"
import { lookupTAC, resolveTACForIMEI, type TACEntry } from "./tac-database"
import { fetchIMEICheckTAC } from "./imeicheck-tac"
import { inferAppleLineFromMarketingName } from "./device-lines"
import { useAppStore } from "@/store"

export interface IMEICheckResult {
  valid: boolean
  imei: string
  tacInfo: TACEntry | null
  isUnique: boolean
  duplicatePhoneId?: string
  source: "local" | "api" | "none"
  errors: string[]
  warnings: string[]
}

/**
 * Full IMEI verification:
 * 1. Format (Luhn)
 * 2. TAC IMEICheck.com (API publique), puis base locale en secours
 * 3. Unicité dans le stock
 */
export async function checkIMEI(imei: string): Promise<IMEICheckResult> {
  const errors: string[] = []
  const warnings: string[] = []

  if (!/^\d{15}$/.test(imei)) {
    errors.push("L'IMEI doit contenir exactement 15 chiffres")
    return { valid: false, imei, tacInfo: null, isUnique: true, source: "none", errors, warnings }
  }

  if (!validateIMEI(imei)) {
    errors.push("IMEI invalide (checksum Luhn incorrect)")
    return { valid: false, imei, tacInfo: null, isUnique: true, source: "none", errors, warnings }
  }

  const tacFromIMEICheck = await fetchIMEICheckTAC(imei)
  const tacLocal = tacFromIMEICheck ? null : lookupTAC(imei)
  const tacInfo = tacFromIMEICheck ?? tacLocal
  const source: IMEICheckResult["source"] = tacFromIMEICheck ? "api" : tacLocal ? "local" : "none"

  if (!tacInfo) {
    warnings.push("Appareil non reconnu (IMEICheck TAC ni base locale)")
  }

  const { phones } = useAppStore.getState()
  const existingPhone = phones.find((p) => p.imei === imei)
  const isUnique = !existingPhone

  if (!isUnique) {
    errors.push(`Cet IMEI est déjà enregistré dans le stock (${existingPhone!.brand} ${existingPhone!.model})`)
  }

  return {
    valid: true,
    imei,
    tacInfo,
    isUnique,
    duplicatePhoneId: existingPhone?.id,
    source,
    errors,
    warnings,
  }
}

/**
 * Synchronous format-only check (for form validation).
 */
export function checkIMEIFormat(imei: string): { valid: boolean; error?: string } {
  if (!/^\d{15}$/.test(imei)) {
    return { valid: false, error: "L'IMEI doit contenir exactement 15 chiffres" }
  }
  if (!validateIMEI(imei)) {
    return { valid: false, error: "IMEI invalide (checksum Luhn incorrect)" }
  }
  return { valid: true }
}

/**
 * Quick TAC lookup for auto-fill (instant, local database).
 */
export function quickTACLookup(partialIMEI: string): TACEntry | null {
  if (partialIMEI.length < 8) return null
  return lookupTAC(partialIMEI)
}

// Keep alias for backward compat
export const quickTACLookupLocal = quickTACLookup

export type VerifyTacMatch = "exact" | "prefix" | "heuristic"

export interface VerifyTacHit {
  entry: TACEntry
  match: VerifyTacMatch
}

/**
 * TAC au moment du clic « Vérifier » : exact 8 digits, puis préfixe 7/6 (curée + Osmocom),
 * puis indication générique selon les 2 premiers chiffres si rien ne correspond.
 */
export function quickTACLookupForVerify(imei: string): VerifyTacHit | null {
  if (imei.length < 8) return null
  const resolved = resolveTACForIMEI(imei)
  if (resolved) {
    return { entry: resolved.entry, match: resolved.kind }
  }
  if (imei.length !== 15) return null
  const h2 = imei.slice(0, 2)
  if (h2 === "35") {
    return {
      entry: {
        brand: "Indicatif régional",
        model:
          "Préfixe 35… (souvent Europe / grands fabricants). TAC absent des bases — complétez marque et modèle.",
        type: "smartphone",
      },
      match: "heuristic",
    }
  }
  if (h2 === "86") {
    return {
      entry: {
        brand: "Indicatif régional",
        model:
          "Préfixe 86… (souvent Chine / Android). TAC absent des bases — complétez marque et modèle.",
        type: "smartphone",
      },
      match: "heuristic",
    }
  }
  return {
    entry: {
      brand: "Indicatif",
      model: "TAC absent des bases et IMEICheck — saisissez marque et modèle manuellement.",
      type: "smartphone",
    },
    match: "heuristic",
  }
}

/**
 * Map TAC brand (+ modèle pour Apple) vers les lignes d'appareil de l'app.
 */
export function mapTACBrandToAppBrand(tacBrand: string, tacModel = ""): string | null {
  if (tacBrand === "Apple") {
    return inferAppleLineFromMarketingName(tacModel || "iPhone")
  }
  if (tacBrand === "Samsung") return "Samsung"
  return null
}

/**
 * Nettoie le libellé modèle pour l'auto-remplissage (évite la redondance avec la ligne).
 */
export function cleanModelForAutoFill(tacBrand: string, tacModel: string): string {
  if (tacBrand !== "Apple") return tacModel
  let m = tacModel.trim()
  const lower = m.toLowerCase()
  if (lower.startsWith("iphone ")) return m.slice(7).trim()
  if (lower.startsWith("ipad ")) return m.slice(5).trim()
  if (lower.startsWith("apple watch ")) return m.slice(12).trim()
  if (lower.startsWith("watch ")) return m.slice(6).trim()
  if (/^macbook\s+(pro|air)\s+/i.test(m)) return m.replace(/^MacBook\s+(Pro|Air)\s+/i, "").trim()
  if (/^macbook\s+/i.test(m)) return m.replace(/^MacBook\s+/i, "").trim()
  return m
}

// ────────────────────────────────────────────────────────────
// API EXTERNE (prêt pour le backend)
// ────────────────────────────────────────────────────────────
//
// Quand le backend Node.js sera en place, vous pourrez ajouter
// une vérification supplémentaire contre une API payante
// (imeicheck.com, imeidb.xyz, etc.) pour :
// - Vérifier si l'appareil est volé / blacklisté
// - Obtenir le statut de garantie
// - Connaître l'opérateur d'origine
//
// Exemple de route backend :
//   app.get("/api/imei/check/:imei", async (req, res) => {
//     const response = await fetch(`https://imeidb.xyz/api/imei/${req.params.imei}?token=${process.env.IMEI_API_KEY}`)
//     res.json(await response.json())
//   })
//
// Puis appeler depuis le frontend :
//   const res = await fetch(`/api/imei/check/${imei}`)
