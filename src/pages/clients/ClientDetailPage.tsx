import { useMemo } from "react"
import { useParams, Link } from "react-router-dom"
import {
  ArrowLeft, Phone, Mail, MapPin, Calendar,
  ShoppingBag, DollarSign, AlertTriangle, DoorOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { StatsCard } from "@/components/common/StatsCard"
import { PaymentStatusBadge } from "@/components/common/StatusBadge"
import { PaymentProgress } from "@/components/common/PaymentProgress"
import { EmptyState } from "@/components/common/EmptyState"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils"
import { useAppStore } from "@/store"

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const clients = useAppStore((s) => s.clients)
  const sales = useAppStore((s) => s.sales)
  const getClient = useAppStore((s) => s.getClient)
  const getClientSales = useAppStore((s) => s.getClientSales)
  const getClientDebt = useAppStore((s) => s.getClientDebt)
  const getPhone = useAppStore((s) => s.getPhone)
  const sorties = useAppStore((s) => s.sorties)

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

  const clientSorties = useMemo(
    () => (id ? sorties.filter((x) => x.clientId === id) : []),
    [id, sorties],
  )

  const sortiesEnCours = useMemo(
    () => clientSorties.filter((x) => x.status === "en_cours").length,
    [clientSorties],
  )

  const sortiesTerminees = useMemo(
    () => clientSorties.filter((x) => x.status === "retournee").length,
    [clientSorties],
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

        <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
          <StatsCard
            title="Sorties (emprunts)"
            value={clientSorties.length}
            icon={DoorOpen}
            iconColor={clientSorties.length > 0 ? "text-orange-600" : "text-slate-400"}
          />
        </div>
      </div>

      <Separator />

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-lg font-semibold">Sorties (essai / dépôt)</h2>
          <Link to="/sorties">
            <Button variant="outline" size="sm">
              Voir la page Sorties
            </Button>
          </Link>
        </div>
        {clientSorties.length === 0 ? (
          <EmptyState
            icon={DoorOpen}
            title="Aucune sortie"
            description="Ce client n’a pas encore d’emprunt enregistré (sortie 48 h) avec son profil."
          />
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {sortiesEnCours > 0 && (
                <span className="text-amber-700 font-medium">{sortiesEnCours} en cours</span>
              )}
              {sortiesEnCours > 0 && sortiesTerminees > 0 && " · "}
              {sortiesTerminees > 0 && (
                <span>{sortiesTerminees} terminée{sortiesTerminees > 1 ? "s" : ""}</span>
              )}
              {sortiesEnCours === 0 && sortiesTerminees === 0 && (
                <span>{clientSorties.length} enregistrement(s)</span>
              )}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {clientSorties.map((exit) => (
                <Card key={exit.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {exit.phone.brand} {exit.phone.model}
                        </p>
                        <Link
                          to={`/stock/${exit.phoneId}`}
                          className="font-mono text-xs text-muted-foreground hover:underline"
                        >
                          {exit.phone.imei}
                        </Link>
                      </div>
                      <span
                        className={
                          exit.status === "en_cours"
                            ? "shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900"
                            : "shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
                        }
                      >
                        {exit.status === "en_cours" ? "En cours" : "Retournée"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{exit.motif}</p>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>Départ : {formatDateTime(exit.createdAt)}</p>
                      {exit.status === "en_cours" ? (
                        <p>Échéance : {formatDateTime(exit.dueAt)}</p>
                      ) : exit.returnedAt ? (
                        <p>Retour : {formatDateTime(exit.returnedAt)}</p>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
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
