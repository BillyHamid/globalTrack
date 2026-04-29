import { useState, useMemo, useEffect, useRef } from "react"
import { useNavigate, Link, useLocation } from "react-router-dom"
import {
  ArrowLeft, Search, Smartphone, User, CreditCard, CheckCircle2,
  ChevronRight, ChevronLeft, Calendar, UserPlus, RotateCcw,
} from "lucide-react"
import { toast } from "sonner"
import { isAxiosError } from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { DepositProofField } from "@/components/common/DepositProofField"
import { DraftIndicator } from "@/components/common/DraftIndicator"
import { cn, formatCurrency } from "@/lib/utils"
import { usePersistedState, clearDraft } from "@/lib/use-persisted-state"
import { useAppStore } from "@/store"
import { useAuthStore } from "@/features/auth/store"
import type { SaleType } from "@/types"

const STEPS = [
  { id: 1, label: "Téléphone", icon: Smartphone },
  { id: 2, label: "Client", icon: User },
  { id: 3, label: "Paiement", icon: CreditCard },
  { id: 4, label: "Confirmation", icon: CheckCircle2 },
]

/** Parse saisie montant (espaces, virgule décimale). */
function parsePositiveAmount(raw: string): number | null {
  const t = raw.trim().replace(/\s/g, "").replace(",", ".")
  if (t === "") return null
  const n = Number(t)
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

interface FromSortieState {
  sortieId: string
  phoneId: string
  personName: string
}

export default function SaleNewPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const fromSortie = (location.state as { fromSortie?: FromSortieState } | null)?.fromSortie
  const { getAvailablePhones, clients, createSale, addClient, returnSortie } = useAppStore()
  const { user } = useAuthStore()

  const draftKey = fromSortie ? `sale-new:sortie-${fromSortie.sortieId}:` : "sale-new:default:"

  const [step, setStep] = usePersistedState<number>(`${draftKey}step`, fromSortie ? 2 : 1)
  const [selectedPhoneId, setSelectedPhoneId] = usePersistedState<string | null>(
    `${draftKey}phoneId`,
    fromSortie?.phoneId ?? null,
  )
  const [selectedClientId, setSelectedClientId] = usePersistedState<string | null>(
    `${draftKey}clientId`,
    null,
  )
  const [clientMode, setClientMode] = usePersistedState<"existing" | "new">(
    `${draftKey}clientMode`,
    fromSortie ? "new" : "existing",
  )
  const [newClientName, setNewClientName] = usePersistedState<string>(
    `${draftKey}newClientName`,
    fromSortie?.personName ?? "",
  )
  const [newClientPhone, setNewClientPhone] = usePersistedState<string>(`${draftKey}newClientPhone`, "")
  const [saleType, setSaleType] = usePersistedState<SaleType>(`${draftKey}saleType`, "cash")
  const [advanceAmount, setAdvanceAmount] = usePersistedState<string>(`${draftKey}advance`, "")
  const [dueDate, setDueDate] = usePersistedState<string>(`${draftKey}dueDate`, "")
  const [initialPaymentMethod, setInitialPaymentMethod] = usePersistedState<string>(
    `${draftKey}paymentMethod`,
    "virement",
  )
  const [depositProofDataUrl, setDepositProofDataUrl] = useState<string | null>(null)
  const [phoneSearch, setPhoneSearch] = useState("")
  const [clientSearch, setClientSearch] = useState("")
  /** Prix convenu pour la vente (remise / négociation) ; synchronisé avec le téléphone sélectionné. */
  const [salePriceInput, setSalePriceInput] = usePersistedState<string>(`${draftKey}salePrice`, "")

  const availablePhones = useMemo(() => {
    const phones = getAvailablePhones()
    if (!phoneSearch.trim()) return phones
    const q = phoneSearch.toLowerCase()
    return phones.filter(
      (p) =>
        p.brand.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q) ||
        p.capacity.toLowerCase().includes(q) ||
        p.color.toLowerCase().includes(q) ||
        p.imei.includes(q)
    )
  }, [getAvailablePhones, phoneSearch])

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients
    const q = clientSearch.toLowerCase()
    return clients.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
    )
  }, [clients, clientSearch])

  const selectedPhone = useAppStore((state) =>
    selectedPhoneId ? state.getPhone(selectedPhoneId) : undefined
  )

  const isFirstPriceSync = useRef(true)
  useEffect(() => {
    // Skip first sync to preserve draft value
    if (isFirstPriceSync.current) {
      isFirstPriceSync.current = false
      return
    }
    if (!selectedPhone) {
      setSalePriceInput("")
      return
    }
    const p = Math.round(selectedPhone.sellingPrice)
    setSalePriceInput(String(p > 0 ? p : ""))
  }, [selectedPhoneId, selectedPhone?.sellingPrice])

  const selectedClient = useMemo(() => {
    if (clientMode === "new") return undefined
    return selectedClientId ? clients.find((c) => c.id === selectedClientId) : undefined
  }, [clientMode, selectedClientId, clients])

  const listPrice = selectedPhone?.sellingPrice ?? 0
  const parsedSalePrice = useMemo(() => parsePositiveAmount(salePriceInput), [salePriceInput])
  const totalAmount = parsedSalePrice ?? 0

  const canProceed = () => {
    if (step === 1) return !!selectedPhoneId
    if (step === 2) {
      if (clientMode === "existing") return !!selectedClientId
      return newClientName.trim().length > 0 && newClientPhone.trim().length > 0
    }
    if (step === 3) {
      if (!selectedPhone || parsedSalePrice === null) return false
      if (saleType === "credit") {
        const advance = parseFloat(advanceAmount.replace(",", "."))
        if (isNaN(advance) || advance < 0 || advance > totalAmount) return false
        return dueDate.trim() !== ""
      }
      return true
    }
    if (step === 4) return parsedSalePrice !== null
    return true
  }

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error("Vous devez être connecté pour enregistrer une vente")
      return
    }
    if (!selectedPhoneId || !selectedPhone) {
      toast.error("Sélectionnez un téléphone")
      return
    }

    let clientId = selectedClientId
    if (clientMode === "new") {
      const nm = newClientName.trim()
      const ph = newClientPhone.trim()
      if (nm.length < 2) {
        toast.error("Le nom du client doit contenir au moins 2 caractères")
        return
      }
      if (ph.length < 6) {
        toast.error("Le numéro de téléphone doit contenir au moins 6 caractères")
        return
      }
      try {
        const c = await addClient({ name: nm, phone: ph, email: "", address: "" })
        clientId = c.id
      } catch (e) {
        if (isAxiosError(e) && Array.isArray(e.response?.data?.details)) {
          const parts = (e.response.data.details as { message: string }[]).map((x) => x.message)
          toast.error(parts.join(" · "))
        } else if (isAxiosError(e) && e.response?.data?.error) {
          toast.error(String(e.response.data.error))
        } else {
          toast.error("Impossible de créer le client")
        }
        return
      }
    }
    if (!clientId) {
      toast.error("Sélectionnez ou créez un client")
      return
    }

    if (parsedSalePrice === null) {
      toast.error("Indiquez un prix de vente valide (supérieur à 0)")
      return
    }

    const paid =
      saleType === "cash"
        ? parsedSalePrice
        : Math.min(parsedSalePrice, Math.max(0, parseFloat(advanceAmount.replace(",", ".")) || 0))

    try {
      // Si la vente vient d'une sortie, on clôture d'abord la sortie
      // pour que le téléphone redevienne "disponible" avant que createSale le passe en "vendu"/"credit"
      if (fromSortie) {
        try {
          await returnSortie(fromSortie.sortieId, {
            notes: "Sortie transformée en vente",
          })
        } catch {
          toast.error("Impossible de clôturer la sortie associée")
          return
        }
      }

      const sale = await createSale({
        phoneId: selectedPhoneId,
        clientId,
        sellerId: user.id,
        type: saleType,
        listPriceAtSale: listPrice > 0 ? listPrice : undefined,
        totalAmount: parsedSalePrice,
        paidAmount: paid,
        dueDate: saleType === "credit" ? dueDate : undefined,
        paymentMethod: paid > 0 ? initialPaymentMethod : undefined,
        depositProof: paid > 0 ? (depositProofDataUrl ?? undefined) : undefined,
      })
      toast.success(
        fromSortie ? "Sortie convertie en vente" : "Vente enregistrée avec succès",
        {
          description: `${selectedPhone.brand} ${selectedPhone.model} — ${formatCurrency(sale.totalAmount)} · ${sale.type === "cash" ? "Cash" : "Crédit"}`,
        },
      )
      clearDraft(draftKey)
      navigate(fromSortie ? "/sorties" : "/sales")
    } catch {
      toast.error("Impossible d'enregistrer la vente")
    }
  }

  const displayClientName =
    clientMode === "new" ? newClientName.trim() : selectedClient?.name
  const displayClientPhone =
    clientMode === "new" ? newClientPhone.trim() : selectedClient?.phone

  const hasDraftData =
    selectedPhoneId !== null ||
    selectedClientId !== null ||
    newClientName.trim() !== "" ||
    newClientPhone.trim() !== "" ||
    advanceAmount !== "" ||
    dueDate !== "" ||
    salePriceInput !== ""

  const resetDraft = () => {
    clearDraft(draftKey)
    setStep(fromSortie ? 2 : 1)
    setSelectedPhoneId(fromSortie?.phoneId ?? null)
    setSelectedClientId(null)
    setClientMode(fromSortie ? "new" : "existing")
    setNewClientName(fromSortie?.personName ?? "")
    setNewClientPhone("")
    setSaleType("cash")
    setAdvanceAmount("")
    setDueDate("")
    setInitialPaymentMethod("virement")
    setSalePriceInput("")
    setDepositProofDataUrl(null)
    toast.success("Brouillon réinitialisé")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link to={fromSortie ? "/sorties" : "/sales"}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              {fromSortie ? "Convertir en vente" : "Nouvelle vente"}
            </h1>
            <p className="text-muted-foreground">Étape {step} sur {STEPS.length}</p>
          </div>
        </div>
        {hasDraftData && (
          <DraftIndicator
            watch={`${step}|${selectedPhoneId}|${selectedClientId}|${newClientName}|${salePriceInput}|${advanceAmount}|${dueDate}`}
            onReset={resetDraft}
          />
        )}
      </div>

      {fromSortie && selectedPhone && (
        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gradient-primary shadow-glow">
            <CreditCard className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900">
              Conversion d'une sortie en vente
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              <span className="font-semibold">{fromSortie.personName}</span> souhaite acheter le{" "}
              <span className="font-semibold">{selectedPhone.brand} {selectedPhone.model}</span>.
              La sortie sera automatiquement clôturée à la confirmation.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                step === s.id
                  ? "bg-primary text-primary-foreground"
                  : step > s.id
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-muted text-muted-foreground"
              )}
            >
              <s.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>

      <Separator />

      {step === 1 && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par marque, modèle, capacité, couleur ou IMEI..."
              value={phoneSearch}
              onChange={(e) => setPhoneSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {availablePhones.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Aucun téléphone disponible ne correspond à votre recherche.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {availablePhones.map((phone) => (
                <Card
                  key={phone.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    selectedPhoneId === phone.id && "ring-2 ring-primary border-primary"
                  )}
                  onClick={() => setSelectedPhoneId(phone.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold">{phone.brand} {phone.model}</p>
                        <p className="text-sm text-muted-foreground">{phone.capacity} · {phone.color}</p>
                        <p className="text-xs text-muted-foreground mt-1 truncate">IMEI: {phone.imei}</p>
                      </div>
                      <p className="text-lg font-bold text-primary shrink-0">{formatCurrency(phone.sellingPrice)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={clientMode === "existing" ? "default" : "outline"}
              size="sm"
              onClick={() => setClientMode("existing")}
            >
              <User className="mr-1 h-4 w-4" />
              Client existant
            </Button>
            <Button
              type="button"
              variant={clientMode === "new" ? "default" : "outline"}
              size="sm"
              onClick={() => setClientMode("new")}
            >
              <UserPlus className="mr-1 h-4 w-4" />
              Nouveau client
            </Button>
          </div>

          {clientMode === "existing" ? (
            <>
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom ou téléphone..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {filteredClients.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Aucun client ne correspond à votre recherche.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredClients.map((client) => (
                    <Card
                      key={client.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        selectedClientId === client.id && "ring-2 ring-primary border-primary"
                      )}
                      onClick={() => setSelectedClientId(client.id)}
                    >
                      <CardContent className="p-4">
                        <p className="font-semibold">{client.name}</p>
                        <p className="text-sm text-muted-foreground">{client.phone}</p>
                        {client.email && (
                          <p className="text-xs text-muted-foreground">{client.email}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant="secondary">{client.totalPurchases} achats</Badge>
                          {client.totalDebt > 0 && (
                            <Badge variant="destructive">Dette: {formatCurrency(client.totalDebt)}</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle className="text-base">Nouveau client</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newName">Nom complet *</Label>
                  <Input
                    id="newName"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Ex: Jean Dupont"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPhone">Téléphone *</Label>
                  <Input
                    id="newPhone"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="Ex: +243 ..."
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="max-w-md space-y-6">
          {selectedPhone && (
            <div className="space-y-2 rounded-lg border p-4">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <Label htmlFor="sale-price" className="text-base font-semibold">
                  Prix de vente (FCFA)
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 shrink-0 text-muted-foreground"
                  onClick={() => setSalePriceInput(String(Math.round(listPrice)))}
                >
                  <RotateCcw className="mr-1 h-3.5 w-3.5" />
                  Prix catalogue
                </Button>
              </div>
              <Input
                id="sale-price"
                inputMode="decimal"
                autoComplete="off"
                placeholder="Montant convenu avec le client"
                value={salePriceInput}
                onChange={(e) => setSalePriceInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Prix affiché dans le stock : {formatCurrency(listPrice)}. Ajustez ce montant en cas de remise ou de
                négociation — il sera enregistré comme montant total de la vente.
              </p>
              {parsedSalePrice === null && salePriceInput.trim() !== "" && (
                <p className="text-xs text-destructive">Saisissez un nombre valide, supérieur à 0.</p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-base font-semibold">Type de vente</Label>
            <div className="grid grid-cols-2 gap-3">
              <Card
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md text-center p-6",
                  saleType === "cash" && "ring-2 ring-primary border-primary"
                )}
                onClick={() => setSaleType("cash")}
              >
                <CreditCard className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="font-semibold">Cash</p>
                <p className="text-xs text-muted-foreground">Paiement intégral</p>
              </Card>
              <Card
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md text-center p-6",
                  saleType === "credit" && "ring-2 ring-primary border-primary"
                )}
                onClick={() => setSaleType("credit")}
              >
                <Calendar className="h-8 w-8 mx-auto mb-2 text-amber-600" />
                <p className="font-semibold">Crédit</p>
                <p className="text-xs text-muted-foreground">Paiement échelonné</p>
              </Card>
            </div>
          </div>

          {saleType === "credit" && (
            <div className="space-y-4 rounded-lg border p-4">
              <div className="space-y-2">
                <Label htmlFor="advance">Montant de l&apos;avance (FCFA)</Label>
                <Input
                  id="advance"
                  type="number"
                  min={0}
                  max={totalAmount}
                  placeholder="0"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                />
                {selectedPhone && advanceAmount !== "" && !isNaN(parseFloat(advanceAmount)) && (
                  <p className="text-sm text-muted-foreground">
                    Reste à payer: {formatCurrency(Math.max(0, totalAmount - parseFloat(advanceAmount)))}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Date d&apos;échéance</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {(saleType === "cash" ||
            (saleType === "credit" && (parseFloat(advanceAmount) || 0) > 0)) && (
            <div className="space-y-4 rounded-lg border p-4">
              <p className="text-sm font-medium">Versement enregistré avec la vente</p>
              <div className="space-y-2">
                <Label>Mode de paiement</Label>
                <Select value={initialPaymentMethod} onValueChange={setInitialPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="virement">Virement bancaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DepositProofField
                id="sale-new-deposit-proof"
                value={depositProofDataUrl}
                onChange={setDepositProofDataUrl}
              />
            </div>
          )}
        </div>
      )}

      {step === 4 && selectedPhone && (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Résumé de la vente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Téléphone</p>
              <p className="font-semibold">
                {selectedPhone.brand} {selectedPhone.model}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedPhone.capacity} · {selectedPhone.color} · IMEI: {selectedPhone.imei}
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Client</p>
              <p className="font-semibold">{displayClientName}</p>
              <p className="text-sm text-muted-foreground">{displayClientPhone}</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Type de vente</p>
              <Badge variant={saleType === "cash" ? "info" : "warning"}>
                {saleType === "cash" ? "Cash" : "Crédit"}
              </Badge>
            </div>
            <Separator />
            <div className="space-y-1">
              {listPrice > 0 && parsedSalePrice !== null && parsedSalePrice !== listPrice && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Prix catalogue</span>
                  <span>{formatCurrency(listPrice)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prix total convenu</span>
                <span className="font-bold text-lg">{formatCurrency(totalAmount)}</span>
              </div>
              {saleType === "credit" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avance</span>
                    <span className="font-medium">{formatCurrency(parseFloat(advanceAmount) || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reste à payer</span>
                    <span className="font-medium text-amber-600">
                      {formatCurrency(Math.max(0, totalAmount - (parseFloat(advanceAmount) || 0)))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Échéance</span>
                    <span className="font-medium">{dueDate}</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-3">
        {step > 1 && !(fromSortie && step === 2) && (
          <Button variant="outline" onClick={() => setStep(step - 1)}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Précédent
          </Button>
        )}
        {step < 4 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
            Suivant
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!selectedPhone || !canProceed()}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Confirmer la vente
          </Button>
        )}
      </div>
    </div>
  )
}
