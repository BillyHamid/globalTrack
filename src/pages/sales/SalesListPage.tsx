import { useState, useMemo } from "react"
import { Link } from "react-router-dom"
import { Plus, Search, Eye, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { PaymentStatusBadge } from "@/components/common/StatusBadge"
import { EmptyState } from "@/components/common/EmptyState"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useAppStore } from "@/store"
import type { Client, Phone, Sale, User } from "@/types"

function SalesTable({
  sales,
  getPhone,
  getClient,
  getUser,
}: {
  sales: Sale[]
  getPhone: (id: string) => Phone | undefined
  getClient: (id: string) => Client | undefined
  getUser: (id: string) => User | undefined
}) {
  if (sales.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Aucune vente trouvée"
        description="Aucune vente ne correspond à vos critères de recherche."
      />
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Téléphone</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Montant</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Vendeur</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sales.map((sale) => {
          const phone = getPhone(sale.phoneId)
          const client = getClient(sale.clientId)
          const seller = getUser(sale.sellerId)

          return (
            <TableRow key={sale.id}>
              <TableCell className="whitespace-nowrap">{formatDate(sale.date)}</TableCell>
              <TableCell className="font-medium">
                {phone ? `${phone.brand} ${phone.model}` : "—"}
              </TableCell>
              <TableCell>{client?.name ?? "—"}</TableCell>
              <TableCell>
                <Badge variant={sale.type === "cash" ? "info" : "warning"}>
                  {sale.type === "cash" ? "Cash" : "Crédit"}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">{formatCurrency(sale.totalAmount)}</TableCell>
              <TableCell>
                <PaymentStatusBadge status={sale.paymentStatus} />
              </TableCell>
              <TableCell>{seller?.name.split(" ")[0] ?? "—"}</TableCell>
              <TableCell className="text-right">
                <Link to={`/sales/${sale.id}`}>
                  <Button variant="ghost" size="sm">
                    <Eye className="mr-1 h-4 w-4" />
                    Détails
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

export default function SalesListPage() {
  const { sales, getPhone, getClient, getUser } = useAppStore()
  const [search, setSearch] = useState("")

  const filteredSales = useMemo(() => {
    if (!search.trim()) return sales

    const q = search.toLowerCase()
    return sales.filter((sale) => {
      const phone = getPhone(sale.phoneId)
      const client = getClient(sale.clientId)
      const seller = getUser(sale.sellerId)
      return (
        phone?.brand.toLowerCase().includes(q) ||
        phone?.model.toLowerCase().includes(q) ||
        client?.name.toLowerCase().includes(q) ||
        seller?.name.toLowerCase().includes(q)
      )
    })
  }, [search, sales, getPhone, getClient, getUser])

  const cashSales = filteredSales.filter((s) => s.type === "cash")
  const creditSales = filteredSales.filter((s) => s.type === "credit")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des ventes</h1>
          <p className="text-muted-foreground">{sales.length} ventes au total</p>
        </div>
        <Link to="/sales/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle vente
          </Button>
        </Link>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher par téléphone, client, vendeur..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Toutes ({filteredSales.length})</TabsTrigger>
          <TabsTrigger value="cash">Cash ({cashSales.length})</TabsTrigger>
          <TabsTrigger value="credit">Crédit ({creditSales.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <SalesTable sales={filteredSales} getPhone={getPhone} getClient={getClient} getUser={getUser} />
        </TabsContent>
        <TabsContent value="cash">
          <SalesTable sales={cashSales} getPhone={getPhone} getClient={getClient} getUser={getUser} />
        </TabsContent>
        <TabsContent value="credit">
          <SalesTable sales={creditSales} getPhone={getPhone} getClient={getClient} getUser={getUser} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
