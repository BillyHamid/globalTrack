import { useState, useMemo } from "react"
import { Link } from "react-router-dom"
import { Plus, Search, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/common/EmptyState"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useAppStore } from "@/store"

export default function ClientsListPage() {
  const [search, setSearch] = useState("")
  const clients = useAppStore((s) => s.clients)

  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients

    const q = search.toLowerCase()
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
    )
  }, [search, clients])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des clients</h1>
          <p className="text-muted-foreground">{clients.length} clients au total</p>
        </div>
        <Link to="/clients/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau client
          </Button>
        </Link>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, téléphone, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredClients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun client trouvé"
          description="Aucun client ne correspond à vos critères de recherche."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Achats</TableHead>
              <TableHead>Dette en cours</TableHead>
              <TableHead>Date inscription</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow key={client.id} className="cursor-pointer">
                <TableCell>
                  <Link to={`/clients/${client.id}`} className="font-medium hover:underline">
                    {client.name}
                  </Link>
                </TableCell>
                <TableCell>{client.phone}</TableCell>
                <TableCell>{client.email ?? "—"}</TableCell>
                <TableCell>{client.totalPurchases}</TableCell>
                <TableCell className={client.totalDebt > 0 ? "font-medium text-red-600" : ""}>
                  {formatCurrency(client.totalDebt)}
                </TableCell>
                <TableCell>{formatDate(client.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
