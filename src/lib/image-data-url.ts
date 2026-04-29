/** Taille max côté navigateur pour limiter la charge JSON (photos stockées en data URL). */
const MAX_EDGE = 1600
const JPEG_QUALITY = 0.82
const MAX_DATA_URL_CHARS = 900_000

/**
 * Lit une image fichier et renvoie une data URL JPEG redimensionnée (évite les fichiers énormes en base).
 */
export async function imageFileToCompressedDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Le fichier doit être une image")
  }
  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    const w = Math.max(1, Math.round(bitmap.width * scale))
    const h = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas non supporté")
    ctx.drawImage(bitmap, 0, 0, w, h)
    let q = JPEG_QUALITY
    let dataUrl = canvas.toDataURL("image/jpeg", q)
    while (dataUrl.length > MAX_DATA_URL_CHARS && q > 0.35) {
      q -= 0.1
      dataUrl = canvas.toDataURL("image/jpeg", q)
    }
    if (dataUrl.length > MAX_DATA_URL_CHARS) {
      throw new Error("Image trop lourde même après compression — choisissez une photo plus petite.")
    }
    return dataUrl
  } finally {
    bitmap.close()
  }
}
