import { readFileSync } from "fs"

const content = readFileSync("src/features/imei/tac-osmocom.ts", "utf-8")
const matches = content.match(/"(\d{8})"/g)
console.log("TAC entries in tac-osmocom.ts:", matches ? matches.length : 0)
console.log("File size:", (content.length / 1024).toFixed(0), "KB")

// Test some known TACs
const testTACs = [
  "35389310", // iPhone 11 Pro
  "35104463", // iPhone 13
  "35722306", // Samsung Galaxy S4
  "86186403", // Xiaomi (curated)
  "35345678", // Samsung S24 Ultra (curated)
]

for (const tac of testTACs) {
  const found = content.includes(`"${tac}"`)
  console.log(`  ${tac}: ${found ? "FOUND" : "NOT FOUND"}`)
}

// Count by brand
const brandCounts = {}
const brandRegex = /brand: "([^"]+)"/g
let m
while ((m = brandRegex.exec(content)) !== null) {
  brandCounts[m[1]] = (brandCounts[m[1]] || 0) + 1
}
console.log("\nBrand counts in file:")
for (const [b, c] of Object.entries(brandCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${b}: ${c}`)
}

// Now test the ACTUAL lookup function by importing the compiled module
// Check if we can find any Samsung entries
const samsungTACs = []
const sRe = /"(\d{8})": \{ brand: "Samsung"/g
let sm
while ((sm = sRe.exec(content)) !== null) {
  samsungTACs.push(sm[1])
  if (samsungTACs.length >= 5) break
}
console.log("\nSample Samsung TACs:", samsungTACs)

const appleTACs = []
const aRe = /"(\d{8})": \{ brand: "Apple"/g
let am
while ((am = aRe.exec(content)) !== null) {
  appleTACs.push(am[1])
  if (appleTACs.length >= 5) break
}
console.log("Sample Apple TACs:", appleTACs)
