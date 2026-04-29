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
import { validateIMEI } from "@/lib/utils"
import { imageFileToCompressedDataUrl } from "@/lib/image-data-url"
import { useAppStore } from "@/store"
import { useAuthStore } from "@/features/auth/store"
import {
  quickTACLookup,
  quickTACLookupForVerify,
  mapTACBrandToAppBrand,
  cleanModelForAutoFill,
} from "@/features/imei/service"
import { fetchIMEICheckTAC, mapIMEICheckBrandToAppBrand } from "@/features/imei/imeicheck-tac"
import { checkAppleDevice, type AppleDeviceInfo } from "@/features/imei/apple-check"
import { APP_DEVICE_LINES, inferAppleLineFromMarketingName } from "@/features/imei/device-lines"

const BRANDS = APP_DEVICE_LINES
const CAPACITIES = ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB"]

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
  const [tacBrand, setTacBrand] = useState("")
  const [tacModel, setTacModel] = useState("")
  const [tacSource, setTacSource] = useState<
    "" | "imeicheck" | "local" | "local-prefix" | "heuristic"
  >("")
  const [appleInfo, setAppleInfo] = useState<AppleDeviceInfo | null>(null)
  const [appleLoading, setAppleLoading] = useState(false)
  const [appleChecked, setAppleChecked] = useState(false)

  const [brandMismatch, setBrandMismatch] = useState(false)
  const [autoDetectedBrand, setAutoDetectedBrand] = useState("")
  const [autoDetectedModel, setAutoDetectedModel] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Auto-detect brand/model from local TAC
  useEffect(() => {
    if (imei.length < 8) {
      setAutoDetectedBrand("")
      setAutoDetectedModel("")
      setBrandMismatch(false)
      return
    }
    const tacResult = quickTACLookup(imei)
    if (tacResult) {
      const appBrand = mapTACBrandToAppBrand(tacResult.brand, tacResult.model) ?? ""
      const cleanedModel = cleanModelForAutoFill(tacResult.brand, tacResult.model)
      setAutoDetectedBrand(appBrand)
      setAutoDetectedModel(cleanedModel)
      if (!brand && appBrand) setBrand(appBrand)
      if (!model && cleanedModel) setModel(cleanedModel)
      setBrandMismatch(!!(brand && appBrand && brand !== appBrand))
    } else {
      setAutoDetectedBrand("")
      setAutoDetectedModel("")
      setBrandMismatch(false)
    }
  }, [imei, brand, model])

  async function handleVerifyIMEI() {
    if (imei.length !== 15) return

    // Reset
    setLuhnValid(null)
    setImeiUnique(null)
    setTacBrand("")
    setTacModel("")
    setTacSource("")
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

    const localHit = quickTACLookupForVerify(imei)
    // Affichage immédiat : TAC exact, préfixe 6–7 (curée + Osmocom), ou indication générique.
    if (localHit) {
      setTacBrand(localHit.entry.brand)
      setTacModel(localHit.entry.model)
      setTacSource(
        localHit.match === "exact"
          ? "local"
          : localHit.match === "prefix"
            ? "local-prefix"
            : "heuristic",
      )
    }

    // Step 3 & 4 : IMEICheck TAC + API Apple (en parallèle)
    setAppleLoading(true)
    try {
      const [apple, imeicheckTac] = await Promise.all([
        checkAppleDevice(imei),
        fetchIMEICheckTAC(imei),
      ])

      if (imeicheckTac) {
        setTacBrand(imeicheckTac.brand)
        setTacModel(imeicheckTac.model)
        setTacSource("imeicheck")
        const mb = mapIMEICheckBrandToAppBrand(imeicheckTac.brand, imeicheckTac.model)
        if (mb && !brand) setBrand(mb)
        if (!model) {
          const isApple =
            imeicheckTac.brand.toLowerCase().includes("apple")
          setModel(
            isApple
              ? cleanModelForAutoFill("Apple", imeicheckTac.model)
              : imeicheckTac.model,
          )
        }
      }

      if (apple) {
        setAppleInfo(apple)
        if (!brand) setBrand(inferAppleLineFromMarketingName(apple.name))
        if (!model) setModel(cleanModelForAutoFill("Apple", apple.name))
        toast.success("Appareil Apple identifié", { description: apple.name })
      } else if (imeicheckTac && !apple) {
        toast.success("IMEI identifié (IMEICheck TAC)", {
          description: `${imeicheckTac.brand} — ${imeicheckTac.model}`,
        })
      }
    } catch {
      const again = quickTACLookupForVerify(imei)
      if (again) {
        setTacBrand(again.entry.brand)
        setTacModel(again.entry.model)
        setTacSource(
          again.match === "exact"
            ? "local"
            : again.match === "prefix"
              ? "local-prefix"
              : "heuristic",
        )
      }
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
      const apple = await checkAppleDevice(clean)
      if (apple) {
        setAppleInfo(apple)
        if (!brand) setBrand(inferAppleLineFromMarketingName(apple.name))
        if (!model) setModel(cleanModelForAutoFill("Apple", apple.name))
        toast.success("Appareil Apple identifié", { description: apple.name })
      } else {
        toast.error("Appareil non reconnu. Vérifiez le numéro de série.")
      }
    } catch {
      toast.error("Erreur de connexion à l'API Apple")
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
    setTacBrand("")
    setTacModel("")
    setTacSource("")
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

              {/* Auto-detection from TAC */}
              {autoDetectedBrand && imei.length >= 8 && !hasVerificationResult && (
                <InfoBox variant="blue" icon={<Smartphone className="h-4 w-4 text-blue-600 shrink-0" />}>
                  Détection automatique : <strong>{autoDetectedBrand} {autoDetectedModel}</strong>
                </InfoBox>
              )}

              {/* Brand mismatch */}
              {brandMismatch && (
                <InfoBox variant="amber" icon={<AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />}>
                  La marque sélectionnée (<strong>{brand}</strong>) ne correspond pas
                  à la marque détectée (<strong>{autoDetectedBrand}</strong>).
                </InfoBox>
              )}

              {/* ── Verification results (progressive) ── */}
              {hasVerificationResult && (
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    {luhnValid && imeiUnique ? (
                      <><ShieldCheck className="h-5 w-5 text-emerald-600" /> Vérification IMEI</>
                    ) : (
                      <><ShieldX className="h-5 w-5 text-red-600" /> Vérification IMEI</>
                    )}
                  </div>

                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    {/* Luhn */}
                    <ResultRow ok={luhnValid!} label={`Format Luhn : ${luhnValid ? "Valide" : "Invalide"}`} />
                    {/* Uniqueness */}
                    {imeiUnique !== null && (
                      <ResultRow ok={imeiUnique} label={imeiUnique ? "IMEI unique dans le stock" : "Doublon détecté !"} />
                    )}
                    {/* TAC : IMEICheck (prioritaire) ou base locale */}
                    {tacBrand && (
                      <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
                        <ResultRow ok label={`Appareil : ${tacBrand} ${tacModel}`} />
                        {tacSource === "imeicheck" && (
                          <Badge variant="outline" className="text-xs shrink-0">IMEICheck TAC</Badge>
                        )}
                        {tacSource === "local" && (
                          <Badge variant="secondary" className="text-xs shrink-0">Base locale</Badge>
                        )}
                        {tacSource === "local-prefix" && (
                          <Badge variant="secondary" className="text-xs shrink-0">Préfixe TAC (curée + Osmocom)</Badge>
                        )}
                        {tacSource === "heuristic" && (
                          <Badge variant="outline" className="text-xs shrink-0">Indication (hors base TAC)</Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* APIs en cours */}
                  {appleLoading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <Search className="h-4 w-4" />
                      Interrogation IMEICheck TAC Database et API Apple…
                    </div>
                  )}

                  {appleChecked && !appleInfo && !appleLoading && !tacBrand && (
                    <p className="text-xs text-muted-foreground pt-1">
                      Aucune donnée exploitable : IMEICheck (souvent bloqué par Cloudflare hors navigateur), API Apple
                      (backend + token Reincubate), et TAC local. L’IMEI est valide au sens Luhn — complétez marque et
                      modèle à la main.
                    </p>
                  )}
                  {appleChecked && tacSource === "heuristic" && !appleLoading && (
                    <p className="text-xs text-muted-foreground pt-1">
                      Aucun TAC à 8 chiffres ni préfixe 6–7 trouvé dans les bases. L’indication ci-dessus repose
                      uniquement sur les 2 premiers chiffres de l’IMEI ; vérifiez la fiche sur l’appareil.
                    </p>
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
