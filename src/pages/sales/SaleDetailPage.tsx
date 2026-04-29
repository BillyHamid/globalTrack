import { useState } from "react"
import type { Payment } from "@/types"
import { useParams, Link } from "react-router-dom"
import {
  ArrowLeft, Smartphone, User, CalendarDays, DollarSign, Plus,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { PaymentStatusBadge } from "@/components/common/StatusBadge"
import { PaymentProgress } from "@/components/common/PaymentProgress"
import { DepositProofField } from "@/components/common/DepositProofField"
import { formatCurrency, formatDate, formatPaymentMethod } from "@/lib/utils"
import { useAppStore } from "@/store"
import { useAuthStore } from "@/features/auth/store"

export default function SaleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const sale = useAppStore((state) => state.sales.find((s) => s.id === id))
  const { getPhone, getClient, getUser, addPayment, updatePaymentDepositProof } = useAppStore()
  const { user } = useAuthStore()

  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [depositProofDataUrl, setDepositProofDataUrl] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const [proofPayment, setProofPayment] = useState<Payment | null>(null)
  const [proofDraft, setProofDraft] = useState<string | null>(null)
  const [proofSaving, setProofSaving] = useState(false)

  if (!sale) {
    return (
      <div className="space-y-4">
        <Link to="/sales">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux ventes
          </Button>
        </Link>
        <Card className="p-12 text-center">
          <p className="text-lg font-semibold">Vente introuvable</p>
          <p className="text-muted-foreground mt-1">La vente demandée n&apos;existe pas.</p>
        </Card>
      </div>
    )
  }

  const phone = getPhone(sale.phoneId)
  const client = getClient(sale.clientId)
  const seller = getUser(sale.sellerId)

  const catalogFromSnapshot =
    sale.listPriceAtSale != null && Number.isFinite(sale.listPriceAtSale) && sale.listPriceAtSale > 0
      ? sale.listPriceAtSale
      : null
  const catalogFromPhone =
    phone != null && phone.sellingPrice > 0 ? phone.sellingPrice : null
  const displayCatalogPrice = catalogFromSnapshot ?? catalogFromPhone
  const catalogIsEstimated = catalogFromSnapshot == null && catalogFromPhone != null
  const agreedPrice = sale.totalAmount
  const negotiatedGap =
    displayCatalogPrice != null ? Math.round(agreedPrice) - Math.round(displayCatalogPrice) : 0

  const handleAddPayment = async () => {
    if (!user?.id) {
      toast.error("Vous devez être connecté pour enregistrer un versement")
      return
    }
    const amount = parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Veuillez entrer un montant valide")
      return
    }
    if (amount > sale.remainingAmount) {
      toast.error("Le montant dépasse le reste à payer")
      return
    }
    if (!paymentMethod) {
      toast.error("Veuillez sélectionner un mode de paiement")
      return
    }

    const payment = await addPayment(sale.id, {
      amount,
      method: paymentMethod,
      depositProof: depositProofDataUrl ?? undefined,
    })
    if (!payment) {
      toast.error("Impossible d'enregistrer le versement")
      return
    }

    toast.success("Versement enregistré", {
      description: `${formatCurrency(amount)} reçu via ${formatPaymentMethod(paymentMethod)}`,
    })
    setPaymentAmount("")
    setPaymentMethod("")
    setDepositProofDataUrl(null)
    setDialogOpen(false)
  }

  async function handleSavePaymentProof() {
    if (!proofPayment || !proofDraft || !id) {
      toast.error("Choisissez une image de preuve")
      return
    }
    setProofSaving(true)
    try {
      const updated = await updatePaymentDepositProof(id, proofPayment.id, proofDraft)
      if (!updated) {
        toast.error("Impossible d’enregistrer la preuve")
        return
      }
      toast.success("Preuve de dépôt enregistrée")
      setProofPayment(null)
      setProofDraft(null)
    } finally {
      setProofSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/sales">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Détails de la vente</h1>
            <p className="text-muted-foreground">Réf: {sale.id.toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={sale.type === "cash" ? "info" : "warning"}>
            {sale.type === "cash" ? "Cash" : "Crédit"}
          </Badge>
          <PaymentStatusBadge status={sale.paymentStatus} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <Smartphone className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base">Téléphone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="font-semibold">{phone?.brand} {phone?.model}</p>
            <p className="text-sm text-muted-foreground">{phone?.capacity} · {phone?.color}</p>
            <p className="text-xs text-muted-foreground">IMEI: {phone?.imei}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <User className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-base">Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="font-semibold">{client?.name}</p>
            <p className="text-sm text-muted-foreground">{client?.phone}</p>
            {client?.email && <p className="text-xs text-muted-foreground">{client.email}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <CalendarDays className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-base">Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-sm"><span className="text-muted-foreground">Date:</span> {formatDate(sale.date)}</p>
            <p className="text-sm"><span className="text-muted-foreground">Vendeur:</span> {seller?.name}</p>
            {sale.dueDate && (
              <p className="text-sm"><span className="text-muted-foreground">Échéance:</span> {formatDate(sale.dueDate)}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-3">
          <DollarSign className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Montants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Prix</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
              <span className="text-sm text-muted-foreground">Prix de base (catalogue)</span>
              <span className="text-lg font-semibold tabular-nums sm:text-right">
                {displayCatalogPrice != null ? formatCurrency(displayCatalogPrice) : "—"}
              </span>
            </div>
            {catalogIsEstimated && (
              <p className="text-xs text-muted-foreground">
                Valeur issue de la fiche téléphone : cette vente a été créée avant l’enregistrement systématique du
                prix catalogue.
              </p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between border-t pt-3">
              <span className="text-sm text-muted-foreground">Prix convenu (total de la vente)</span>
              <span className="text-lg font-bold tabular-nums sm:text-right">{formatCurrency(agreedPrice)}</span>
            </div>
            {negotiatedGap !== 0 && displayCatalogPrice != null && (
              <p className="text-sm text-muted-foreground">
                {negotiatedGap < 0 ? (
                  <>
                    Remise par rapport au catalogue :{" "}
                    <span className="font-medium text-emerald-700 tabular-nums">
                      {formatCurrency(-negotiatedGap)}
                    </span>
                  </>
                ) : (
                  <>
                    Montant au-dessus du catalogue :{" "}
                    <span className="font-medium tabular-nums">{formatCurrency(negotiatedGap)}</span>
                  </>
                )}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-emerald-50 p-4 text-center">
              <p className="text-sm text-emerald-600">Payé</p>
              <p className="text-xl font-bold text-emerald-700">{formatCurrency(sale.paidAmount)}</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-4 text-center">
              <p className="text-sm text-amber-600">Reste à payer</p>
              <p className="text-xl font-bold text-amber-700">{formatCurrency(sale.remainingAmount)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {sale.type === "credit" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Progression du paiement</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentProgress total={sale.totalAmount} paid={sale.paidAmount} />
          </CardContent>
        </Card>
      )}

      {(sale.payments.length > 0 || sale.remainingAmount > 0) && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">Paiements reçus</CardTitle>
            {sale.remainingAmount > 0 && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-1 h-4 w-4" />
                    Ajouter un versement
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajouter un versement</DialogTitle>
                    <DialogDescription>
                      Reste à payer: {formatCurrency(sale.remainingAmount)}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="payAmount">Montant (FCFA)</Label>
                      <Input
                        id="payAmount"
                        type="number"
                        min={1}
                        max={sale.remainingAmount}
                        placeholder="0"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Mode de paiement</Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="mobile_money">Mobile Money</SelectItem>
                          <SelectItem value="virement">Virement bancaire</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DepositProofField
                      id="sale-detail-deposit-proof"
                      value={depositProofDataUrl}
                      onChange={setDepositProofDataUrl}
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleAddPayment}>Confirmer</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            {sale.payments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Aucun versement enregistré pour l&apos;instant.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Preuve dépôt</TableHead>
                    <TableHead className="w-[1%] whitespace-nowrap">Compléter</TableHead>
                    <TableHead>Reçu par</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sale.payments.map((payment) => {
                    const rid = payment.receivedBy || payment.receivedById || ""
                    const receiver = getUser(rid)
                    const proof = payment.depositProof?.trim()
                    return (
                      <TableRow key={payment.id}>
                        <TableCell>{formatDate(payment.date)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>{formatPaymentMethod(payment.method)}</TableCell>
                        <TableCell>
                          {proof ? (
                            <a
                              href={proof}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block rounded border overflow-hidden max-w-[72px]"
                            >
                              <img src={proof} alt="" className="h-12 w-auto object-cover" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-xs">Aucune</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="whitespace-nowrap"
                            onClick={() => {
                              setProofPayment(payment)
                              setProofDraft(proof || null)
                            }}
                          >
                            {proof ? "Modifier" : "Ajouter"}
                          </Button>
                        </TableCell>
                        <TableCell>{receiver?.name.split(" ")[0] ?? "—"}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog
        open={!!proofPayment}
        onOpenChange={(open) => {
          if (!open) {
            setProofPayment(null)
            setProofDraft(null)
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Preuve de dépôt bancaire</DialogTitle>
            <DialogDescription>
              {proofPayment && (
                <>
                  Versement du {formatDate(proofPayment.date)} — {formatCurrency(proofPayment.amount)} (
                  {formatPaymentMethod(proofPayment.method)}). Vous pouvez joindre la capture ici si ce n’était pas fait
                  lors de l’enregistrement du paiement.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {proofPayment && (
            <div className="space-y-4 py-2">
              <DepositProofField
                id={`proof-edit-${proofPayment.id}`}
                value={proofDraft}
                onChange={setProofDraft}
                required
                helpText="Même principe qu’à la saisie du paiement : relevé ou capture d’écran du dépôt (image compressée automatiquement)."
              />
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setProofPayment(null)
                setProofDraft(null)
              }}
            >
              Fermer
            </Button>
            <Button type="button" disabled={!proofDraft || proofSaving} onClick={() => void handleSavePaymentProof()}>
              {proofSaving ? "Enregistrement…" : "Enregistrer la preuve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
