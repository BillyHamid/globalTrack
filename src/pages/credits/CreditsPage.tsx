import { useState, useMemo } from "react"
import { Link } from "react-router-dom"
import {
  CreditCard, DollarSign, AlertTriangle, Eye, Plus, Clock,
  CheckCircle2, CircleDollarSign,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { StatsCard } from "@/components/common/StatsCard"
import { PaymentStatusBadge } from "@/components/common/StatusBadge"
import { PaymentProgress } from "@/components/common/PaymentProgress"
import { EmptyState } from "@/components/common/EmptyState"
import { DepositProofField } from "@/components/common/DepositProofField"
import { formatCurrency, formatDate, formatPaymentMethod } from "@/lib/utils"
import { useAppStore } from "@/store"
import { useAuthStore } from "@/features/auth/store"
import type { Client, Phone, Sale } from "@/types"

type AppStoreState = ReturnType<typeof useAppStore.getState>

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function isOverdue(dueDate?: string) {
  return !!dueDate && dueDate < todayISO()
}

export default function CreditsPage() {
  const { sales, getPhone, getClient, addPayment, getActiveCredits } = useAppStore()
  const { user } = useAuthStore()

  const creditSales = useMemo(() => getActiveCredits(), [sales, getActiveCredits])

  const sorted = useMemo(() => {
    return [...creditSales].sort((a, b) => {
      const aOverdue = isOverdue(a.dueDate) ? 0 : 1
      const bOverdue = isOverdue(b.dueDate) ? 0 : 1
      if (aOverdue !== bOverdue) return aOverdue - bOverdue
      return b.remainingAmount - a.remainingAmount
    })
  }, [creditSales])

  const partielSales = sorted.filter((s) => s.paymentStatus === "partiel")
  const impayeSales = sorted.filter((s) => s.paymentStatus === "impaye")

  const totalAmount = creditSales.reduce((sum, s) => sum + s.totalAmount, 0)
  const totalPaid = creditSales.reduce((sum, s) => sum + s.paidAmount, 0)
  const totalRemaining = creditSales.reduce((sum, s) => sum + s.remainingAmount, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Suivi des crédits</h1>
        <p className="text-muted-foreground">Gérez les ventes à crédit et les paiements en cours</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total crédits" value={creditSales.length} icon={CreditCard} iconColor="text-blue-600" />
        <StatsCard title="Montant total" value={formatCurrency(totalAmount)} icon={DollarSign} iconColor="text-primary" />
        <StatsCard title="Montant payé" value={formatCurrency(totalPaid)} icon={CheckCircle2} iconColor="text-emerald-600" />
        <StatsCard title="Reste à payer" value={formatCurrency(totalRemaining)} icon={AlertTriangle} iconColor="text-red-600" />
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Tous ({sorted.length})</TabsTrigger>
          <TabsTrigger value="partiel">Partiellement payé ({partielSales.length})</TabsTrigger>
          <TabsTrigger value="impaye">Impayé ({impayeSales.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <CreditList sales={sorted} getPhone={getPhone} getClient={getClient} addPayment={addPayment} userId={user?.id} />
        </TabsContent>
        <TabsContent value="partiel">
          <CreditList sales={partielSales} getPhone={getPhone} getClient={getClient} addPayment={addPayment} userId={user?.id} />
        </TabsContent>
        <TabsContent value="impaye">
          <CreditList sales={impayeSales} getPhone={getPhone} getClient={getClient} addPayment={addPayment} userId={user?.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function CreditList({
  sales,
  getPhone,
  getClient,
  addPayment,
  userId,
}: {
  sales: Sale[]
  getPhone: (id: string) => Phone | undefined
  getClient: (id: string) => Client | undefined
  addPayment: AppStoreState["addPayment"]
  userId: string | undefined
}) {
  if (sales.length === 0) {
    return (
      <EmptyState
        icon={CircleDollarSign}
        title="Aucun crédit"
        description="Aucune vente à crédit ne correspond à ce filtre."
      />
    )
  }

  return (
    <div className="grid gap-4 mt-4 sm:grid-cols-2 lg:grid-cols-3">
      {sales.map((sale) => (
        <CreditCard_
          key={sale.id}
          saleId={sale.id}
          getPhone={getPhone}
          getClient={getClient}
          addPayment={addPayment}
          userId={userId}
        />
      ))}
    </div>
  )
}

function CreditCard_({
  saleId,
  getPhone,
  getClient,
  addPayment,
  userId,
}: {
  saleId: string
  getPhone: (id: string) => Phone | undefined
  getClient: (id: string) => Client | undefined
  addPayment: AppStoreState["addPayment"]
  userId: string | undefined
}) {
  const sale = useAppStore((state) => state.sales.find((s) => s.id === saleId))
  const phone = sale ? getPhone(sale.phoneId) : undefined
  const client = sale ? getClient(sale.clientId) : undefined
  const overdue = sale ? isOverdue(sale.dueDate) : false

  const [dialogOpen, setDialogOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("")
  const [depositProofDataUrl, setDepositProofDataUrl] = useState<string | null>(null)

  if (!sale) return null

  const handlePayment = async () => {
    if (!userId) {
      toast.error("Vous devez être connecté pour enregistrer un paiement")
      return
    }
    const val = parseFloat(amount)
    if (isNaN(val) || val <= 0) {
      toast.error("Veuillez entrer un montant valide")
      return
    }
    if (val > sale.remainingAmount) {
      toast.error("Le montant dépasse le reste à payer")
      return
    }
    if (!method) {
      toast.error("Veuillez sélectionner un mode de paiement")
      return
    }

    const payment = await addPayment(sale.id, {
      amount: val,
      method,
      depositProof: depositProofDataUrl ?? undefined,
    })
    if (!payment) {
      toast.error("Impossible d'enregistrer le paiement")
      return
    }

    toast.success("Paiement enregistré", {
      description: `${formatCurrency(val)} (${formatPaymentMethod(method)}) — ${client?.name ?? "client"}`,
    })
    setAmount("")
    setMethod("")
    setDepositProofDataUrl(null)
    setDialogOpen(false)
  }

  return (
    <Card className="flex flex-col">
      <CardContent className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold">{client?.name}</p>
            <p className="text-sm text-muted-foreground">{client?.phone}</p>
          </div>
          <PaymentStatusBadge status={sale.paymentStatus} />
        </div>

        <p className="text-sm">
          <span className="text-muted-foreground">Téléphone:</span>{" "}
          <span className="font-medium">{phone?.brand} {phone?.model}</span>
        </p>

        <PaymentProgress total={sale.totalAmount} paid={sale.paidAmount} />

        {sale.dueDate && (
          <div className="flex items-center gap-1.5 text-sm">
            <Clock className={`h-3.5 w-3.5 ${overdue ? "text-red-500" : "text-muted-foreground"}`} />
            <span className={overdue ? "text-red-600 font-semibold" : "text-muted-foreground"}>
              {overdue ? "En retard — " : "Échéance: "}
              {formatDate(sale.dueDate)}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 mt-auto pt-2">
          <Link to={`/sales/${sale.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Eye className="mr-1 h-4 w-4" />
              Détails
            </Button>
          </Link>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex-1" disabled={sale.remainingAmount <= 0}>
                <Plus className="mr-1 h-4 w-4" />
                Paiement
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enregistrer un paiement</DialogTitle>
                <DialogDescription>
                  {client?.name} — {phone?.brand} {phone?.model}
                  <br />
                  Reste à payer: {formatCurrency(sale.remainingAmount)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor={`amt-${sale.id}`}>Montant (FCFA)</Label>
                  <Input
                    id={`amt-${sale.id}`}
                    type="number"
                    min={1}
                    max={sale.remainingAmount}
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mode de paiement</Label>
                  <Select value={method} onValueChange={setMethod}>
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
                  id={`credit-deposit-${sale.id}`}
                  value={depositProofDataUrl}
                  onChange={setDepositProofDataUrl}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={() => void handlePayment()}>Confirmer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}
