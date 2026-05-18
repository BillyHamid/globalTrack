import { useState, useEffect, useRef } from "react"
import { useNavigate, Link } from "react-router-dom"
import {
  ArrowLeft, CheckCircle, Loader2, XCircle,
  AlertTriangle, Smartphone, ShieldCheck, ShieldX,
  Apple, Globe, ExternalLink, Search, Camera, X,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import axios from "axios"
import { validateIMEI } from "@/lib/utils"
import { imageFileToCompressedDataUrl } from "@/lib/image-data-url"
import { useAppStore } from "@/store"
import { useAuthStore } from "@/features/auth/store"
import { imeiApi } from "@/api"
import {
  cleanModelForAutoFill,
} from "@/features/imei/service"
import { checkAppleDevice, type AppleDeviceInfo } from "@/features/imei/apple-check"
import { apiClient } from "@/api/client"
import { APP_DEVICE_LINES, inferAppleLineFromMarketingName } from "@/features/imei/device-lines"

const BRANDS = APP_DEVICE_LINES
const CAPACITIES = ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB"]

/** Données affichées après « Vérifier » — uniquement la réponse SickW (format beta). */
export interface SickwVerificationPayload {
  manufacturer: string | null
  modelName: string | null
  status: string
  result: Record<string, unknown>
}

function sickwText(v: unknown): string | null {
  if (v == null) return null
  const s = typeof v === "string" ? v.trim() : String(v).trim()
  return s.length > 0 ? s : null
}

/** Extrait et renseigne les informations générales depuis le JSON SickW */
function extractSickwFieldData(result: Record<string, unknown>) {
  const extracted: { brand?: string; model?: string; capacity?: string; color?: string } = {}

  console.log("🔍 SickW result keys:", Object.keys(result))
  console.log("📦 SickW complete result:", result)

  // Parcourir TOUTES les clés pour trouver les données
  const allEntries = Object.entries(result)

  // Marque - chercher dans toutes les clés
  for (const [key, value] of allEntries) {
    const val = sickwText(value)
    if (val && (key.toLowerCase().includes("brand") || key.toLowerCase().includes("manufacturer") || key.toLowerCase().includes("oem"))) {
      extracted.brand = val
      console.log(`✅ Brand trouvé: "${val}" (clé: ${key})`)
      break
    }
  }

  // Modèle - chercher dans toutes les clés
  for (const [key, value] of allEntries) {
    const val = sickwText(value)
    if (val && (key.toLowerCase().includes("model") || key.toLowerCase().includes("device"))) {
      extracted.model = val
      console.log(`✅ Model trouvé: "${val}" (clé: ${key})`)
      break
    }
  }

  // Capacité - chercher et normaliser
  for (const [key, value] of allEntries) {
    const val = sickwText(value)
    if (val && (key.toLowerCase().includes("storage") || key.toLowerCase().includes("memory") || key.toLowerCase().includes("capacity") || key.toLowerCase().includes("ram"))) {
      // Normaliser: "256 GB" → "256GB"
      const normalized = val.replace(/\s+/g, "").toUpperCase()
      // Vérifier si c'est une capacité valide
      if (CAPACITIES.includes(normalized)) {
        extracted.capacity = normalized
      } else {
        // Sinon essayer de matcher
        const match = normalized.match(/(\d+)(GB|TB|MB)/)
        if (match) {
          extracted.capacity = `${match[1]}${match[2]}`
        }
      }
      console.log(`✅ Capacity trouvé: "${val}" → "${extracted.capacity}" (clé: ${key})`)
      break
    }
  }

  // Couleur - chercher dans toutes les clés
  for (const [key, value] of allEntries) {
    const val = sickwText(value)
    if (val && (key.toLowerCase().includes("color") || key.toLowerCase().includes("colour"))) {
      extracted.color = val
      console.log(`✅ Color trouvé: "${val}" (clé: ${key})`)
      break
    }
  }

  console.log("📋 Extracted data final:", extracted)
  return extracted
}

export default function StockAddPage() {
  const navigate = useNavigate()
  const { addPhone, isIMEIUnique } = useAppStore()
  const { user } = useAuthStore()

  const [brand, setBrand] = useState("")
  const [model, setModel] = useState("")
  const [capacity, setCapacity] = useState("")
  const [color, setColor] = useState("")
  const [sellingPrice, setSellingPrice] = useState("")
  const [purchasePrice, setPurchasePrice] = useState("")
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [imei, setImei] = useState("")
  const [serialNumber, setSerialNumber] = useState("")
  const [notes, setNotes] = useState("")

  // Verification state
  const [verifying, setVerifying] = useState(false)
  const [luhnValid, setLuhnValid] = useState<boolean | null>(null)
  const [imeiUnique, setImeiUnique] = useState<boolean | null>(null)
  const [sickwVerification, setSickwVerification] = useState<SickwVerificationPayload | null>(null)
  const [appleInfo, setAppleInfo] = useState<AppleDeviceInfo | null>(null)
  const [appleLoading, setAppleLoading] = useState(false)
  const [appleChecked, setAppleChecked] = useState(false)

  const [submitting, setSubmitting] = useState(false)

  async function handleVerifyIMEI() {
    if (imei.length !== 15) return

    // Reset
    setLuhnValid(null)
    setImeiUnique(null)
    setSickwVerification(null)
    setAppleInfo(null)
    setAppleChecked(false)
    setVerifying(true)

    // Step 1: Luhn (instant)
    const valid = validateIMEI(imei)
    setLuhnValid(valid)

    if (!valid) {
      setVerifying(false)
      toast.error("IMEI invalide (checksum Luhn incorrect)")
      return
    }

    // Step 2: Uniqueness (instant)
    const unique = isIMEIUnique(imei)
    setImeiUnique(unique)
    if (!unique) {
      toast.error("Cet IMEI est déjà enregistré dans le stock")
    }

    // Step 3 & 4 : SickW (seule source pour marque / modèle après vérification) + API Apple en parallèle
    setAppleLoading(true)
    try {
      const applePromise = checkAppleDevice(imei)

      try {
        const sw = await imeiApi.sickwCheck(imei)
        const manufacturer =
          sickwText(sw.brand) ?? sickwText(sw.result["Manufacturer"])
        const modelName =
          sickwText(sw.model) ?? sickwText(sw.result["Model Name"])
        setSickwVerification({
          manufacturer,
          modelName,
          status: sw.status,
          result: sw.result,
        })

        // Auto-fill formulaire depuis JSON SickW complet (source de vérité unique)
        const extracted = extractSickwFieldData(sw.result)
        if (extracted.brand) setBrand(extracted.brand)
        if (extracted.model) setModel(extracted.model)
        if (extracted.capacity) setCapacity(extracted.capacity)
        if (extracted.color) setColor(extracted.color)
        toast.success("IMEI vérifié (SickW)", {
          description: [manufacturer, modelName].filter(Boolean).join(" — ") || "Réponse reçue",
        })
      } catch (err) {
        setSickwVerification(null)
        const msg = axios.isAxiosError(err)
          ? (err.response?.data as { message?: string } | undefined)?.message
          : undefined
        toast.error(msg ?? "Échec de la vérification SickW")
      }

      const apple = await applePromise

      if (apple) {
        setAppleInfo(apple)
        if (!brand) setBrand(inferAppleLineFromMarketingName(apple.name))
        if (!model) setModel(cleanModelForAutoFill("Apple", apple.name))
        toast.success("Appareil Apple identifié", { description: apple.name })
      }
    } catch {
      setSickwVerification(null)
    } finally {
      setAppleLoading(false)
      setAppleChecked(true)
      setVerifying(false)
    }
  }

  async function handleCheckSerial() {
    const clean = serialNumber.trim()
    if (!clean) return

    setAppleLoading(true)
    setAppleInfo(null)
    setAppleChecked(false)

    try {
      const { data } = await apiClient.post<{ brand: string; model: string; capacity: string }>(
        '/check-serial',
        { serialNumber: clean },
        { timeout: 20000 },
      )

      if (!brand) setBrand(inferAppleLineFromMarketingName(data.model))
      if (!model) setModel(cleanModelForAutoFill("Apple", data.model))
      if (!capacity && data.capacity && data.capacity !== "N/A") {
        const normalized = data.capacity.replace(/\s+/g, "").toUpperCase()
        if (CAPACITIES.includes(normalized)) setCapacity(normalized)
      }

      toast.success("Appareil Apple identifié", { description: data.model })
    } catch {
      toast.error("Appareil non reconnu. Vérifiez le numéro de série.")
    } finally {
      setAppleLoading(false)
      setAppleChecked(true)
    }
  }

  function handleImeiChange(value: string) {
    const val = value.replace(/\D/g, "")
    setImei(val)
    setLuhnValid(null)
    setImeiUnique(null)
    setSickwVerification(null)
    setAppleInfo(null)
    setAppleChecked(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!user) { toast.error("Vous devez être connecté"); return }
    if (!brand || !model || !capacity || !color || !sellingPrice || !imei) {
      toast.error("Veuillez remplir tous les champs obligatoires"); return
    }
    if (imei.length !== 15 || !validateIMEI(imei)) {
      toast.error("Veuillez entrer un IMEI valide"); return
    }
    if (!isIMEIUnique(imei)) {
      toast.error("Cet IMEI est déjà dans le stock"); return
    }

    const price = Number(sellingPrice)
    if (Number.isNaN(price) || price <= 0) {
      toast.error("Le prix de vente doit être un montant strictement positif")
      return
    }

    let purchase: number | undefined
    if (purchasePrice.trim() !== "") {
      const p = Number(purchasePrice)
      if (Number.isNaN(p) || p < 0) {
        toast.error("Prix d'achat invalide")
        return
      }
      purchase = p
    }

    setSubmitting(true)
    try {
      await addPhone(
        {
          brand,
          model,
          capacity,
          color,
          sellingPrice: price,
          imei,
          photos: photoDataUrl ? [photoDataUrl] : [],
          addedBy: user.id,
          ...(purchase !== undefined ? { purchasePrice: purchase } : {}),
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        },
        user.id,
      )
      toast.success("Téléphone ajouté au stock", {
        description: `${brand} ${model} a été ajouté avec succès.`,
      })
      navigate("/stock")
    } catch {
      toast.error("Impossible d'enregistrer le téléphone (vérifiez la connexion et les données).")
    } finally {
      setSubmitting(false)
    }
  }

  async function handlePhotoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setPhotoBusy(true)
    try {
      const url = await imageFileToCompressedDataUrl(file)
      setPhotoDataUrl(url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible de traiter l'image")
    } finally {
      setPhotoBusy(false)
    }
  }

  const hasVerificationResult = luhnValid !== null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/stock">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Ajouter un téléphone</h1>
          <p className="text-muted-foreground">Enregistrer un nouveau téléphone dans le stock</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* ── Identification ── */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Identification IMEI / Serial Number
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* IMEI */}
              <div className="space-y-2">
                <Label htmlFor="imei">
                  IMEI * <span className="text-muted-foreground font-normal">(tapez *#06# sur le téléphone)</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="imei" placeholder="15 chiffres" maxLength={15}
                    value={imei} onChange={(e) => handleImeiChange(e.target.value)}
                    className="font-mono text-base"
                  />
                  <Button
                    type="button" variant="outline"
                    onClick={handleVerifyIMEI}
                    disabled={imei.length !== 15 || verifying}
                  >
                    {verifying ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : hasVerificationResult && luhnValid && imeiUnique ? (
                      <CheckCircle className="mr-1 h-4 w-4 text-emerald-600" />
                    ) : null}
                    Vérifier
                  </Button>
                </div>
                {imei.length > 0 && imei.length !== 15 && (
                  <p className="text-sm text-destructive">L'IMEI doit contenir exactement 15 chiffres</p>
                )}
                {imei.length === 15 && !validateIMEI(imei) && (
                  <p className="text-sm text-destructive">
                    Les 15 chiffres ne passent pas le contrôle Luhn (clé de contrôle). Corrigez la saisie : la
                    vérification ne pourra pas continuer. Les IMEI copiés depuis une source non fiable sont souvent
                    erronés d’un chiffre.
                  </p>
                )}
              </div>

              {/* Serial Number (Apple) */}
              <div className="space-y-2">
                <Label htmlFor="serial">
                  Serial Number Apple <span className="text-muted-foreground font-normal">(optionnel — iPhone, iPad, Watch, Mac)</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="serial" placeholder="Ex: C8QH6T96DPNG"
                    value={serialNumber}
                    onChange={(e) => { setSerialNumber(e.target.value.toUpperCase()); setAppleInfo(null); setAppleChecked(false) }}
                    className="font-mono text-base uppercase" maxLength={12}
                  />
                  <Button
                    type="button" variant="outline"
                    onClick={handleCheckSerial}
                    disabled={!serialNumber.trim() || appleLoading}
                  >
                    {appleLoading && !verifying ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <Apple className="mr-1 h-4 w-4" />
                    )}
                    Vérifier
                  </Button>
                </div>
              </div>


              {/* ── Verification results (simplifié) ── */}
              {hasVerificationResult && (
                <div className={`rounded-lg border p-4 space-y-4 ${
                  sickwVerification
                    ? "border-emerald-600/30 bg-gradient-to-br from-emerald-600/8 to-emerald-600/3"
                    : "border-blue-600/30 bg-gradient-to-br from-blue-600/8 to-blue-600/3"
                }`}>
                  {/* Statut simplifié */}
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    {sickwVerification ? (
                      <><ShieldCheck className="h-5 w-5 text-emerald-600" /> Vérification réussie ✓</>
                    ) : (
                      <><Loader2 className="h-5 w-5 text-blue-600 animate-spin" /> Vérification en cours…</>
                    )}
                  </div>

                  {/* Données SickW trouvées - JSON complet */}
                  {sickwVerification && (
                    <div className="space-y-3">
                      {/* Affichage principal: JSON complet */}
                      <div className="overflow-x-auto rounded-lg border border-emerald-600/30 bg-slate-900 dark:bg-slate-950 shadow-md">
                        <pre className="p-4 text-emerald-400 dark:text-emerald-300 text-sm leading-relaxed font-mono">
                          <code>{JSON.stringify(sickwVerification.result, null, 2)}</code>
                        </pre>
                      </div>

                      {/* Statut et détails extraits */}
                      <div className="grid gap-2 text-xs">
                        <div className="flex items-center justify-between rounded-md bg-emerald-600/10 p-2 border border-emerald-600/20">
                          <span className="font-medium">Statut API</span>
                          <Badge variant="outline" className="text-[10px]">{sickwVerification.status}</Badge>
                        </div>
                        {sickwVerification.manufacturer && (
                          <div className="flex items-center justify-between rounded-md bg-emerald-600/10 p-2 border border-emerald-600/20">
                            <span className="font-medium">Fabricant détecté</span>
                            <span className="font-mono">{sickwVerification.manufacturer}</span>
                          </div>
                        )}
                        {sickwVerification.modelName && (
                          <div className="flex items-center justify-between rounded-md bg-emerald-600/10 p-2 border border-emerald-600/20">
                            <span className="font-medium">Modèle détecté</span>
                            <span className="font-mono">{sickwVerification.modelName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* APIs en cours */}
                  {appleLoading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <Search className="h-4 w-4" />
                      Interrogation SickW et API Apple…
                    </div>
                  )}
                </div>
              )}

              {/* ── Apple device info ── */}
              {appleInfo && <AppleDevicePanel info={appleInfo} />}
            </CardContent>
          </Card>

          {/* ── General info ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Marque *</Label>
                <Select value={brand} onValueChange={setBrand}>
                  <SelectTrigger id="brand"><SelectValue placeholder="Sélectionner une marque" /></SelectTrigger>
                  <SelectContent>
                    {BRANDS.map((b) => (<SelectItem key={b} value={b}>{b}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Modèle *</Label>
                <Input id="model" placeholder="Ex: Galaxy S24 Ultra" value={model} onChange={(e) => setModel(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacité *</Label>
                  <Select value={capacity} onValueChange={setCapacity}>
                    <SelectTrigger id="capacity"><SelectValue placeholder="Capacité" /></SelectTrigger>
                    <SelectContent>
                      {CAPACITIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Couleur *</Label>
                  <Input id="color" placeholder="Ex: Noir" value={color} onChange={(e) => setColor(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Photo <span className="text-muted-foreground font-normal">(optionnel)</span></Label>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/*"
                  className="sr-only"
                  onChange={handlePhotoPick}
                />
                <div className="flex flex-wrap items-start gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={photoBusy}
                    onClick={() => photoInputRef.current?.click()}
                  >
                    {photoBusy ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="mr-2 h-4 w-4" />
                    )}
                    Choisir une photo
                  </Button>
                  {photoDataUrl && (
                    <div className="relative inline-block">
                      <img
                        src={photoDataUrl}
                        alt="Aperçu"
                        className="h-28 w-auto max-w-[200px] rounded-md border object-cover"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="absolute -right-2 -top-2 h-7 w-7 rounded-full shadow"
                        onClick={() => setPhotoDataUrl(null)}
                        aria-label="Retirer la photo"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  JPEG / PNG / WebP, redimensionnée automatiquement pour l’enregistrement.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* ── Price ── */}
          <Card>
            <CardHeader><CardTitle className="text-base font-semibold">Prix</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">
                  Prix d'achat (FCFA) <span className="text-muted-foreground font-normal">(optionnel)</span>
                </Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  min="0"
                  placeholder="Laisser vide si inconnu"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sellingPrice">Prix de vente (FCFA) *</Label>
                <Input id="sellingPrice" type="number" min="0" placeholder="0" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* ── Notes ── */}
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base font-semibold">Notes</CardTitle></CardHeader>
            <CardContent>
              <Textarea placeholder="Notes supplémentaires (fournisseur, état, etc.)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Link to="/stock"><Button type="button" variant="outline">Annuler</Button></Link>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ajouter au stock
          </Button>
        </div>
      </form>
    </div>
  )
}

// ── Sub-components ──

function ResultRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {ok ? (
        <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 text-red-600 shrink-0" />
      )}
      <span>{label}</span>
    </div>
  )
}

function InfoBox({ variant, icon, children }: { variant: "blue" | "amber"; children: React.ReactNode; icon: React.ReactNode }) {
  const cls = variant === "blue"
    ? "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200"
    : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
  return (
    <div className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${cls}`}>
      {icon}
      <span>{children}</span>
    </div>
  )
}

function AppleDevicePanel({ info }: { info: AppleDeviceInfo }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 space-y-3 dark:border-gray-700 dark:from-gray-900 dark:to-gray-950">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Apple className="h-5 w-5" />
          <span className="font-semibold text-sm">Appareil Apple identifié</span>
        </div>
        <Badge variant="outline" className="gap-1 text-xs">
          <Globe className="h-3 w-3" /> API en ligne
        </Badge>
      </div>

      <div className="flex gap-4">
        {info.imageUrl && (
          <img src={info.imageUrl} alt={info.name} className="h-20 w-20 object-contain rounded-lg bg-white p-1 border" />
        )}
        <div className="space-y-1 text-sm flex-1">
          <p className="font-semibold text-base">{info.name}</p>
          {info.model && <p className="text-muted-foreground">Identifiant : <span className="font-mono">{info.model}</span></p>}
          {info.storages.length > 0 && <p className="text-muted-foreground">Stockage : {info.storages.join(", ")}</p>}
          {info.colors.length > 0 && <p className="text-muted-foreground">Couleurs : {info.colors.join(", ")}</p>}
          {info.registrationCountry && <p className="text-muted-foreground">Pays : {info.registrationCountry}</p>}
          {info.serial && <p className="text-muted-foreground">Serial : <span className="font-mono">{info.serial}</span></p>}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <div className="flex items-center gap-1.5 text-sm">
          {info.appleCareStatus === "ACTIVE" ? (
            <><CheckCircle className="h-4 w-4 text-emerald-600" /> AppleCare actif</>
          ) : info.appleCareStatus === "EXPIRED" ? (
            <><XCircle className="h-4 w-4 text-red-500" /> AppleCare expiré</>
          ) : (
            <><AlertTriangle className="h-4 w-4 text-amber-500" /> AppleCare : vérifier sur Apple</>
          )}
        </div>
        <a href={info.warrantyUrl} target="_blank" rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline flex items-center gap-1">
          Vérifier la garantie <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  )
}
