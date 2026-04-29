import { useMemo } from "react"
import { useParams, Link } from "react-router-dom"
import {
  ArrowLeft, Phone, Mail, MapPin, Calendar,
  ShoppingBag, DollarSign, AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { StatsCard } from "@/components/common/StatsCard"
import { PaymentStatusBadge } from "@/components/common/StatusBadge"
import { PaymentProgress } from "@/components/common/PaymentProgress"
import { EmptyState } from "@/components/common/EmptyState"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useAppStore } from "@/store"

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const clients = useAppStore((s) => s.clients)
  const sales = useAppStore((s) => s.sales)
  const getClient = useAppStore((s) => s.getClient)
  const getClientSales = useAppStore((s) => s.getClientSales)
  const getClientDebt = useAppStore((s) => s.getClientDebt)
  const getPhone = useAppStore((s) => s.getPhone)

  const client = useMemo(
    () => (id ? getClient(id) : undefined),
    [id, clients, getClient]
  )

  const clientSales = useMemo(
    () => (id ? getClientSales(id) : []),
    [id, sales, getClientSales]
  )

  const clientDebt = useMemo(
    () => (id ? getClientDebt(id) : 0),
    [id, sales, getClientDebt]
  )

  const totalSpent = useMemo(
    () => clientSales.reduce((sum, s) => sum + s.paidAmount, 0),
    [clientSales]
  )

  const activeCredits = useMemo(
    () => clientSales.filter((s) => s.type === "credit" && s.paymentStatus !== "paye"),
    [clientSales]
  )

  if (!client) {
    return (
      <div className="space-y-6">
        <Link to="/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <Card className="max-w-lg mx-auto">
          <CardContent className="py-12 text-center">
            <h2 className="text-xl font-semibold">Client introuvable</h2>
            <p className="text-muted-foreground mt-1">
              Le client demandé n'existe pas ou a été supprimé.
            </p>
            <Link to="/clients" className="mt-4 inline-block">
              <Button variant="outline">Retour aux clients</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <p className="text-muted-foreground">Détails du client</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{client.phone}</span>
            </div>
            {client.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{client.email}</span>
              </div>
            )}
            {client.address && (
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{client.address}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Inscrit le {formatDate(client.createdAt)}</span>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 grid gap-4 sm:grid-cols-3">
          <StatsCard
            title="Total achats"
            value={client.totalPurchases}
            icon={ShoppingBag}
            iconColor="text-blue-600"
          />
          <StatsCard
            title="Total dépensé"
            value={formatCurrency(totalSpent)}
            icon={DollarSign}
            iconColor="text-emerald-600"
          />
          <StatsCard
            title="Dette en cours"
            value={formatCurrency(clientDebt)}
            icon={AlertTriangle}
            iconColor={clientDebt > 0 ? "text-red-600" : "text-emerald-600"}
          />
        </div>
      </div>

      <Separator />

      <div>
        <h2 className="text-lg font-semibold mb-4">Historique des achats</h2>
        {clientSales.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Aucun achat"
            description="Ce client n'a encore effectué aucun achat."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clientSales.map((sale) => {
              const phone = getPhone(sale.phoneId)
              return (
                <Card key={sale.id}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {phone ? `${phone.brand} ${phone.model}` : "Téléphone inconnu"}
                        </p>
                        <p className="text-sm text-muted-foreground">{formatDate(sale.date)}</p>
                      </div>
                      <PaymentStatusBadge status={sale.paymentStatus} />
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Montant: </span>
                      <span className="font-medium">{formatCurrency(sale.totalAmount)}</span>
                    </div>
                    <Link to={`/sales/${sale.id}`}>
                      <Button variant="outline" size="sm" className="w-full mt-1">
                        Voir détails
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {activeCredits.length > 0 && (
        <>
          <Separator />
          <div>
            <h2 className="text-lg font-semibold mb-4">Crédits en cours</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeCredits.map((sale) => {
                const phone = getPhone(sale.phoneId)
                return (
                  <Card key={sale.id}>
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <p className="font-medium">
                          {phone ? `${phone.brand} ${phone.model}` : "Téléphone inconnu"}
                        </p>
                        <PaymentStatusBadge status={sale.paymentStatus} />
                      </div>
                      <PaymentProgress total={sale.totalAmount} paid={sale.paidAmount} />
                      {sale.dueDate && (
                        <p className="text-xs text-muted-foreground">
                          Échéance: {formatDate(sale.dueDate)}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
