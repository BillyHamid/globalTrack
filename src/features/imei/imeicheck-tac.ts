import type { TACEntry } from "./tac-database"
import { inferAppleLineFromMarketingName } from "./device-lines"

/**
 * IMEICheck TAC Database — via le backend GlobalTrack (/api/tac/:imei).
 * Le backend ajoute les headers navigateur complets pour contourner Cloudflare
 * et met en cache les résultats 24h (succès) / 30s (échec).
 */
const IMEICHECK_BASE = "/api/tac"

interface IMEICheckJson {
  object?: {
    brand?: string
    model?: string
    name?: string
  }
  brand?: string
  model?: string
  name?: string
  message?: string
  status?: string
}

function guessDeviceType(name: string): TACEntry["type"] {
  const n = name.toLowerCase()
  if (n.includes("ipad") || n.includes("tablet")) return "tablet"
  if (n.includes("watch")) return "wearable"
  if (n.includes("macbook") || n.includes("mac ")) return "smartphone"
  return "smartphone"
}

/**
 * Interroge la base TAC IMEICheck.com pour un IMEI valide (15 chiffres).
 * Retourne null si erreur réseau, 403, ou réponse vide.
 */
export async function fetchIMEICheckTAC(imei: string): Promise<TACEntry | null> {
  const clean = imei.replace(/\D/g, "")
  if (clean.length !== 15) return null

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const accessToken =
      typeof localStorage !== "undefined" ? localStorage.getItem("accessToken") : null
    const headers: Record<string, string> = { Accept: "application/json" }
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`

    const url = `${IMEICHECK_BASE}/${encodeURIComponent(clean)}`
    const response = await fetch(url, { signal: controller.signal, headers })

    if (!response.ok) return null

    const raw = await response.text()
    let data: IMEICheckJson
    try {
      data = JSON.parse(raw) as IMEICheckJson
    } catch {
      return null
    }
    const obj = data.object ?? data

    const brand = (obj.brand ?? "").trim()
    let model = (obj.name ?? obj.model ?? "").trim()
    if (!model && obj.model) model = obj.model.trim()

    if (!brand && !model) return null

    const displayName = model || brand
    return {
      brand: brand || "Inconnu",
      model: displayName,
      type: guessDeviceType(displayName),
    }
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Mappe IMEICheck (marque + libellé modèle) vers la liste déroulante de l'app.
 */
export function mapIMEICheckBrandToAppBrand(brand: string, modelHint = ""): string | null {
  const lower = brand.toLowerCase()
  if (lower.includes("apple")) {
    return inferAppleLineFromMarketingName(modelHint || brand)
  }
  if (lower.includes("samsung")) return "Samsung"
  return null
}
