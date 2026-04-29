import { writeFileSync } from "fs"

const BRANDS_TO_KEEP = [
  "Apple", "Samsung", "Xiaomi", "Tecno", "Infinix", "Itel",
  "Huawei", "Oppo", "Realme", "Vivo", "Nokia", "Motorola",
  "OnePlus", "Google", "Honor", "ZTE", "Lenovo", "LG",
  "Transsion", "Wiko", "Sony", "HTC", "Alcatel",
]

function normalizeBrand(raw) {
  const lower = raw.toLowerCase()
  if (lower.includes("apple")) return "Apple"
  if (lower.includes("samsung")) return "Samsung"
  if (lower.includes("xiaomi") || lower.includes("redmi")) return "Xiaomi"
  if (lower.includes("tecno")) return "Tecno"
  if (lower.includes("infinix")) return "Infinix"
  if (lower.includes("itel")) return "Itel"
  if (lower.includes("huawei")) return "Huawei"
  if (lower.includes("oppo")) return "Oppo"
  if (lower.includes("realme")) return "Realme"
  if (lower.includes("vivo") && !lower.includes("lenovo")) return "Vivo"
  if (lower.includes("nokia") || lower.includes("hmd")) return "Nokia"
  if (lower.includes("motorola")) return "Motorola"
  if (lower.includes("oneplus")) return "OnePlus"
  if (lower.includes("google")) return "Google"
  if (lower.includes("honor")) return "Honor"
  if (lower.includes("zte")) return "ZTE"
  if (lower.includes("lenovo")) return "Lenovo"
  if (lower.includes("lg elec")) return "LG"
  if (lower.includes("transsion")) return "Transsion"
  if (lower.includes("wiko")) return "Wiko"
  if (lower.includes("sony")) return "Sony"
  if (lower.includes("htc")) return "HTC"
  if (lower.includes("alcatel") || lower.includes("tcl")) return "Alcatel"
  return null
}

async function main() {
  const tacMap = new Map()

  // ── Source 1: VTSTech IMEIDB (27k+ devices) ──
  console.log("Downloading VTSTech IMEIDB...")
  const csvRes = await fetch("https://raw.githubusercontent.com/VTSTech/IMEIDB/master/imeidb.csv")
  const csvText = await csvRes.text()
  const csvLines = csvText.split("\n").filter(Boolean)
  console.log(`  CSV lines: ${csvLines.length}`)

  let csvAdded = 0
  for (const line of csvLines) {
    const parts = line.split(",").map(s => s.trim())
    if (parts.length < 3) continue
    const [tacRaw, mfr, model] = parts
    const tac = tacRaw.replace(/\D/g, "").padStart(8, "0")
    if (tac.length !== 8 || !/^\d{8}$/.test(tac)) continue

    const brand = normalizeBrand(mfr)
    if (!brand) continue
    if (!tacMap.has(tac)) {
      tacMap.set(tac, { tac, brand, model: model.trim() })
      csvAdded++
    }
  }
  console.log(`  Added from IMEIDB: ${csvAdded}`)

  // ── Source 2: Osmocom TAC database ──
  console.log("Downloading Osmocom TAC database...")
  try {
    const osmoRes = await fetch("http://tacdb.osmocom.org/export/tacdb.json", { signal: AbortSignal.timeout(20000) })
    const raw = await osmoRes.json()
    const brandsData = raw.brands || raw

    let osmoAdded = 0
    for (const [brandName, brandObj] of Object.entries(brandsData)) {
      const brand = normalizeBrand(brandName)
      if (!brand) continue

      const modelList = Array.isArray(brandObj?.models) ? brandObj.models : [brandObj?.models || brandObj]
      for (const modelEntry of modelList) {
        if (typeof modelEntry !== "object" || !modelEntry) continue
        for (const [modelName, modelData] of Object.entries(modelEntry)) {
          if (modelName === "gsmarena") continue
          const tacs = modelData?.tacs || []
          if (!Array.isArray(tacs)) continue
          for (const t of tacs) {
            const tac = String(t).padStart(8, "0")
            if (tac.length === 8 && /^\d{8}$/.test(tac) && !tacMap.has(tac)) {
              tacMap.set(tac, { tac, brand, model: modelName })
              osmoAdded++
            }
          }
        }
      }
    }
    console.log(`  Added from Osmocom: ${osmoAdded}`)
  } catch (e) {
    console.log(`  Osmocom download failed: ${e.message}`)
  }

  // ── Build output ──
  const entries = [...tacMap.values()]
  entries.sort((a, b) => a.brand.localeCompare(b.brand) || a.tac.localeCompare(b.tac))

  console.log(`\nTotal unique TAC entries: ${entries.length}`)

  const brandCounts = {}
  for (const e of entries) {
    brandCounts[e.brand] = (brandCounts[e.brand] || 0) + 1
  }
  console.log("\nPer-brand counts:")
  for (const [b, c] of Object.entries(brandCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${b}: ${c}`)
  }

  const esc = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')

  const lines = entries.map(
    (e) => `  "${e.tac}": { brand: "${esc(e.brand)}", model: "${esc(e.model)}", type: "smartphone" },`
  )

  const ts = `// Auto-generated from VTSTech IMEIDB + Osmocom TAC database
// Sources: github.com/VTSTech/IMEIDB, tacdb.osmocom.org
// License: CC-BY-SA v3.0 (Osmocom)
// Generated: ${new Date().toISOString().slice(0, 10)}
// Total entries: ${entries.length}

import type { TACEntry } from "./tac-database"

const TAC_COMBINED: Record<string, TACEntry> = {
${lines.join("\n")}
}

export default TAC_COMBINED
`

  writeFileSync("src/features/imei/tac-osmocom.ts", ts, "utf-8")
  console.log(`\nWritten to src/features/imei/tac-osmocom.ts`)
}

main().catch(console.error)
