export interface AppleDeviceInfo {
  model: string
  name: string
  colors: string[]
  storages: string[]
  imageUrl: string | null
  serial: string | null
  registrationCountry: string | null
  carrier: string | null
  warrantyUrl: string
  appleCareStatus: string
  identifierType: "imei" | "serial"
}

interface ReincubateResponse {
  warranty?: {
    url?: string
    apple_care_status?: string
  }
  marketing?: {
    images?: { url: string }[]
    names?: string[]
  }
  hardware?: {
    model?: string
    identifier?: string
  }
  mobile?: {
    serial?: string
    registration_country?: string
    carrier?: string
  }
  specification?: {
    configuration_code?: {
      colour?: string
      storage?: string
    }[]
  }
  meta?: {
    primary_identifier_type?: string
  }
}

const API_BASE = "/api/apple"

/**
 * Check an Apple device by IMEI or serial number via the Reincubate API.
 * Works for iPhone, iPad, Apple Watch, MacBook, AirPods, etc.
 */
export async function checkAppleDevice(identifier: string): Promise<AppleDeviceInfo | null> {
  const clean = identifier.trim().replace(/[\s-]/g, "")
  if (!clean) return null

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12000)

  try {
    const accessToken =
      typeof localStorage !== "undefined" ? localStorage.getItem("accessToken") : null
    const headers: Record<string, string> = { Accept: "application/json" }
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`
    }

    const response = await fetch(`${API_BASE}/${encodeURIComponent(clean)}/`, {
      signal: controller.signal,
      headers,
    })

    if (!response.ok) return null

    const data: ReincubateResponse = await response.json()

    const names = data.marketing?.names ?? []
    const name = names[0] ?? "Appareil Apple inconnu"
    const model = data.hardware?.identifier ?? data.hardware?.model ?? ""

    const configs = data.specification?.configuration_code ?? []
    const colors = [...new Set(configs.map(c => c.colour).filter(Boolean))] as string[]
    const storages = [...new Set(configs.map(c => c.storage).filter(Boolean))] as string[]

    const images = data.marketing?.images ?? []
    const imageUrl = images[0]?.url ?? null

    const isIMEI = data.meta?.primary_identifier_type === "gsma_imei"

    return {
      model,
      name,
      colors,
      storages,
      imageUrl,
      serial: data.mobile?.serial ?? null,
      registrationCountry: data.mobile?.registration_country ?? null,
      carrier: data.mobile?.carrier ?? null,
      warrantyUrl: data.warranty?.url ?? "https://checkcoverage.apple.com",
      appleCareStatus: data.warranty?.apple_care_status ?? "UNKNOWN",
      identifierType: isIMEI ? "imei" : "serial",
    }
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Detect if the input looks like an Apple serial number (vs IMEI).
 * Apple serials are 11-12 alphanumeric chars. IMEIs are 15 digits.
 */
export function isAppleSerial(input: string): boolean {
  const clean = input.trim().replace(/[\s-]/g, "")
  return /^[A-Z0-9]{11,12}$/i.test(clean) && !/^\d+$/.test(clean)
}
