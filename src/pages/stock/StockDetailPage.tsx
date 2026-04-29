import { useEffect, useMemo, useState } from "react"
import { useParams, Link } from "react-router-dom"
import {
  ArrowLeft, Smartphone, Tag, Hash, DollarSign, ImageIcon,
  Calendar, User, FileText, DoorOpen,
  ShieldCheck, ShieldX, CheckCircle, XCircle, AlertTriangle, Loader2,
  Database, Apple, Globe, ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PhoneStatusBadge, PaymentStatusBadge } from "@/components/common/StatusBadge"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils"
import { getMovementVisual } from "@/lib/stock-movement-display"
import { toast } from "sonner"
import { useAppStore } from "@/store"
import { checkIMEI, type IMEICheckResult } from "@/features/imei/service"
import { checkAppleDevice, type AppleDeviceInfo } from "@/features/imei/apple-check"
export default function StockDetailPage() {
  const { id } = useParams<{ id: string }>()
  const phones = useAppStore((s) => s.phones)
  const initialized = useAppStore((s) => s.initialized)
  const loading = useAppStore((s) => s.loading)
  const fetchPhoneById = useAppStore((s) => s.fetchPhoneById)
  const { getUser, getPhoneMovements, sales, clients, sorties } = useAppStore()
  const phone = useMemo(() => (id ? phones.find((p) => p.id === id) : undefined), [id, phones])

  const [isFetchingPhone, setIsFetchingPhone] = useState(false)

  useEffect(() => {
    if (!id || !initialized || loading) return
    if (phone) return
    let cancelled = false
    setIsFetchingPhone(true)
    void fetchPhoneById(id)
      .then((p) => {
        if (!cancelled && !p) toast.error("Téléphone introuvable ou impossible à charger")
      })
      .finally(() => {
        if (!cancelled) setIsFetchingPhone(false)
      })
    return () => {
      cancelled = true
      setIsFetchingPhone(false)
    }
  }, [id, initialized, loading, phone, fetchPhoneById])

  const activeExit = useMemo(
    () => (phone ? sorties.find((e) => e.phoneId === phone.id && e.status === "en_cours") : undefined),
    [sorties, phone],
  )

  const [imeiChecking, setImeiChecking] = useState(false)
  const [imeiResult, setImeiResult] = useState<IMEICheckResult | null>(null)
  const [appleInfo, setAppleInfo] = useState<AppleDeviceInfo | null>(null)

  if (!phone) {
    if (!initialized || loading || isFetchingPhone) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Chargement du téléphone…</p>
        </div>
      )
    }
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/stock">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Téléphone introuvable</h1>
        </div>
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">
              Ce téléphone n'existe pas ou a été supprimé.
            </p>
            <Link to="/stock" className="mt-4 inline-block">
              <Button variant="outline">Retour au stock</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const addedById =
    typeof phone.addedBy === "string"
      ? phone.addedBy
      : (phone as unknown as { addedBy?: { id?: string }; addedById?: string }).addedBy?.id
        ?? (phone as unknown as { addedById?: string }).addedById
        ?? ""
  const addedByUser = getUser(addedById)
  const movements = getPhoneMovements(phone.id)
  const sale = sales.find((s) => s.phoneId === phone.id)
  const saleClient = sale ? clients.find((c) => c.id === sale.clientId) : null
  const saleSeller = sale ? getUser(sale.sellerId) : null

  async function handleVerifyIMEI() {
    setImeiChecking(true)
    setAppleInfo(null)
    try {
      const [result, apple] = await Promise.all([
        checkIMEI(phone!.imei),
        checkAppleDevice(phone!.imei),
      ])
      setImeiResult(result)
      if (apple) setAppleInfo(apple)
    } catch {
      // silently fail
    } finally {
      setImeiChecking(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/stock">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {phone.brand} {phone.model}
          </h1>
          <p className="text-muted-foreground">Détails du téléphone</p>
        </div>
        <PhoneStatusBadge status={phone.status} />
      </div>

      {phone.status === "sortie" && (
        <Card className="border-amber-300 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/30">
          <CardContent className="py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3 min-w-0">
              <DoorOpen className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-medium text-sm">Téléphone en sortie (emprunt / essai)</p>
                {activeExit ? (
                  <p className="text-sm text-muted-foreground mt-1">
                    Emprunté par <span className="font-medium text-foreground">{activeExit.personName}</span>
                    {" — "}
                    motif : {activeExit.motif}. Échéance 48 h :{" "}
                    <span className={new Date(activeExit.dueAt) < new Date() ? "text-destructive font-medium" : ""}>
                      {formatDateTime(activeExit.dueAt)}
                    </span>
                    .
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    Une sortie est enregistrée pour cet appareil. Ouvrez la page Sorties pour le détail ou pour
                    enregistrer le retour.
                  </p>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" className="shrink-0" asChild>
              <Link to="/sorties">Voir les sorties</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Informations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailRow icon={Smartphone} label="Marque" value={phone.brand} />
              <DetailRow icon={Tag} label="Modèle" value={phone.model} />
              <DetailRow icon={Tag} label="Capacité" value={phone.capacity} />
              <DetailRow icon={Tag} label="Couleur" value={phone.color} />
              <DetailRow icon={Hash} label="IMEI" value={phone.imei} mono />
              <DetailRow icon={Calendar} label="Date d'ajout" value={formatDate(phone.addedAt)} />
              <DetailRow icon={User} label="Ajouté par" value={addedByUser?.name ?? (addedById || "—")} />
              {phone.photos?.[0] && (
                <div className="sm:col-span-2 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5" /> Photo
                  </p>
                  <img
                    src={phone.photos[0]}
                    alt={`${phone.brand} ${phone.model}`}
                    className="max-h-56 w-auto max-w-full rounded-md border object-contain"
                  />
                </div>
              )}
              {phone.notes && (
                <div className="sm:col-span-2">
                  <DetailRow icon={FileText} label="Notes" value={phone.notes} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Prix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {phone.purchasePrice != null && (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Prix d'achat</p>
                    <p className="text-sm font-medium">{formatCurrency(phone.purchasePrice)}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Prix de vente</p>
                  <p className="text-lg font-semibold">{formatCurrency(phone.sellingPrice)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* IMEI Verification Panel */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Vérification IMEI
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleVerifyIMEI}
            disabled={imeiChecking}
          >
            {imeiChecking ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : imeiResult ? (
              <ShieldCheck className="mr-1 h-4 w-4" />
            ) : null}
            {imeiResult ? "Re-vérifier" : "Vérifier cet IMEI"}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">IMEI :</span>
              <span className="font-mono text-sm font-medium">{phone.imei}</span>
            </div>

            {!imeiResult && !imeiChecking && (
              <p className="text-sm text-muted-foreground">
                Cliquez sur "Vérifier cet IMEI" pour lancer la vérification de format, la recherche TAC et le contrôle d'unicité.
              </p>
            )}

            {imeiChecking && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Vérification en cours…
              </div>
            )}

            {appleInfo && <AppleInfoPanel info={appleInfo} />}
            {imeiResult && <IMEIResultPanel result={imeiResult} />}
          </div>
        </CardContent>
      </Card>

      {sale && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Informations de vente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="font-medium">{saleClient?.name ?? sale.clientId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vendeur</p>
                <p className="font-medium">{saleSeller?.name ?? sale.sellerId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <Badge variant={sale.type === "cash" ? "success" : "warning"}>
                  {sale.type === "cash" ? "Cash" : "Crédit"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Statut paiement</p>
                <PaymentStatusBadge status={sale.paymentStatus} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Montant total</p>
                <p className="font-semibold">{formatCurrency(sale.totalAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payé</p>
                <p className="font-medium">{formatCurrency(sale.paidAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Restant</p>
                <p className="font-medium text-red-600">
                  {sale.remainingAmount > 0 ? formatCurrency(sale.remainingAmount) : "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date de vente</p>
                <p className="font-medium">{formatDate(sale.date)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Historique des mouvements ({movements.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Aucun mouvement enregistré pour ce téléphone.
            </p>
          ) : (
            <div className="relative space-y-0">
              {movements.map((mov, index) => {
                const config = getMovementVisual(mov.type)
                const Icon = config.icon
                const perf = mov.performedBy as unknown
                const performerId =
                  typeof perf === "string"
                    ? perf
                    : perf && typeof perf === "object" && "id" in perf
                      ? String((perf as { id: string }).id)
                      : (mov as unknown as { performedById?: string }).performedById ?? ""
                const performer = getUser(performerId)
                const isLast = index === movements.length - 1

                return (
                  <div key={mov.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.color} text-white`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      {!isLast && (
                        <div className="w-px flex-1 bg-border" />
                      )}
                    </div>
                    <div className={`pb-6 ${isLast ? "pb-0" : ""}`}>
                      <p className="text-sm font-medium">{config.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(mov.date)} — par {performer?.name ?? (performerId || "—")}
                      </p>
                      {mov.notes && (
                        <p className="mt-1 text-xs text-muted-foreground italic">
                          {mov.notes}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function IMEIResultPanel({ result }: { result: IMEICheckResult }) {
  const hasErrors = result.errors.length > 0
  const hasWarnings = result.warnings.length > 0
  const allClear = result.valid && result.isUnique && !hasErrors

  return (
    <div className={`rounded-lg border p-4 space-y-3 ${
      hasErrors
        ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
        : hasWarnings
          ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950"
          : "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950"
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {allClear ? (
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          ) : hasErrors ? (
            <ShieldX className="h-5 w-5 text-red-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          )}
          <span className="font-semibold text-sm">
            {allClear
              ? "IMEI vérifié — aucun problème détecté"
              : hasErrors
                ? "Problème(s) détecté(s)"
                : "Vérifié avec avertissements"}
          </span>
        </div>
        {result.tacInfo && (
          <Badge variant="outline" className="gap-1 text-xs">
            {result.source === "api" ? (
              <>IMEICheck TAC</>
            ) : (
              <><Database className="h-3 w-3" /> Base locale</>
            )}
          </Badge>
        )}
      </div>

      <div className="grid gap-2 text-sm sm:grid-cols-2">
        <div className="flex items-center gap-2">
          {result.valid ? (
            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600 shrink-0" />
          )}
          <span>Format Luhn : {result.valid ? "Valide" : "Invalide"}</span>
        </div>

        <div className="flex items-center gap-2">
          {result.tacInfo ? (
            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
          )}
          <span>
            TAC : {result.tacInfo
              ? `${result.tacInfo.brand} ${result.tacInfo.model}`
              : "Non reconnu"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {result.isUnique ? (
            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600 shrink-0" />
          )}
          <span>Unicité : {result.isUnique ? "Aucun doublon" : "Doublon trouvé"}</span>
        </div>

        {result.tacInfo && (
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-blue-600 shrink-0" />
            <span>Type : <Badge variant="outline" className="ml-1">{result.tacInfo.type}</Badge></span>
          </div>
        )}
      </div>

      {result.errors.map((err, i) => (
        <p key={i} className="text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
          <XCircle className="h-4 w-4 shrink-0 mt-0.5" /> {err}
        </p>
      ))}

      {result.warnings.map((warn, i) => (
        <p key={i} className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /> {warn}
        </p>
      ))}
    </div>
  )
}

function AppleInfoPanel({ info }: { info: AppleDeviceInfo }) {
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
        </div>
      </div>
      <div className="flex items-center gap-3 pt-1">
        <div className="flex items-center gap-1.5 text-sm">
          {info.appleCareStatus === "ACTIVE" ? (
            <><CheckCircle className="h-4 w-4 text-emerald-600" /> AppleCare actif</>
          ) : info.appleCareStatus === "EXPIRED" ? (
            <><XCircle className="h-4 w-4 text-red-500" /> AppleCare expiré</>
          ) : (
            <><AlertTriangle className="h-4 w-4 text-amber-500" /> AppleCare inconnu</>
          )}
        </div>
        <a href={info.warrantyUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
          Vérifier sur Apple <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  )
}

function DetailRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: typeof Smartphone
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>{value}</p>
      </div>
    </div>
  )
}
