import { useState, useMemo } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Plus, Search, Eye, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { PhoneStatusBadge } from "@/components/common/StatusBadge"
import { EmptyState } from "@/components/common/EmptyState"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useAppStore } from "@/store"
import { useAuthStore } from "@/features/auth/store"

export default function StockListPage() {
  const navigate = useNavigate()
  const { phones, deletePhone } = useAppStore()
  const { user } = useAuthStore()
  const [search, setSearch] = useState("")
  const [brandFilter, setBrandFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const brands = useMemo(
    () => [...new Set(phones.map((p) => p.brand))].sort(),
    [phones],
  )

  const filteredPhones = useMemo(() => {
    return phones.filter((phone) => {
      const q = search.toLowerCase()
      const matchesSearch =
        !q ||
        phone.brand.toLowerCase().includes(q) ||
        phone.model.toLowerCase().includes(q) ||
        (phone.imei ?? "").includes(q) ||
        (phone.notes ?? "").toLowerCase().includes(q)

      const matchesBrand = brandFilter === "all" || phone.brand === brandFilter
      const matchesStatus = statusFilter === "all" || phone.status === statusFilter

      return matchesSearch && matchesBrand && matchesStatus
    })
  }, [phones, search, brandFilter, statusFilter])

  const availableCount = phones.filter((p) => p.status === "disponible").length

  const canDeleteStock = user?.role === "admin" || user?.role === "gestionnaire"

  async function handleDelete(phoneId: string) {
    if (!user) {
      toast.error("Vous devez être connecté pour supprimer un téléphone")
      return
    }
    const result = await deletePhone(phoneId, user.id)
    if (result.ok) {
      toast.success("Téléphone retiré du stock")
    } else {
      toast.error(
        result.error ??
          "Suppression impossible (vérifiez vos droits ou le statut de l’appareil).",
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold sm:text-2xl">Gestion du stock</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            {availableCount} téléphone{availableCount !== 1 ? "s" : ""} disponible{availableCount !== 1 ? "s" : ""}
          </p>
        </div>
        <Link to="/stock/add" className="shrink-0 w-full sm:w-auto">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un téléphone
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par marque, modèle, IMEI ou S/N..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Marque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les marques</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="disponible">Disponible</SelectItem>
                <SelectItem value="vendu">Vendu</SelectItem>
                <SelectItem value="credit">Crédit</SelectItem>
                <SelectItem value="sortie">Sortie</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {filteredPhones.length === 0 ? (
            <EmptyState
              title="Aucun téléphone trouvé"
              description="Essayez de modifier vos filtres ou ajoutez un nouveau téléphone."
              action={
                <Link to="/stock/add">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un téléphone
                  </Button>
                </Link>
              }
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Marque / Modèle</TableHead>
                    <TableHead>Capacité</TableHead>
                    <TableHead>Couleur</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead>IMEI / Serial No</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date d'ajout</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPhones.map((phone) => (
                    <TableRow
                      key={phone.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/stock/${phone.id}`)}
                    >
                      <TableCell className="font-medium">
                        {phone.brand} {phone.model}
                      </TableCell>
                      <TableCell>{phone.capacity}</TableCell>
                      <TableCell>{phone.color}</TableCell>
                      <TableCell>{formatCurrency(phone.sellingPrice)}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {phone.imei
                          ? phone.imei
                          : (() => {
                              const m = (phone.notes ?? "").match(/Numéro de série\s*:\s*(\S+)/)
                              return m ? <span className="text-muted-foreground">S/N: {m[1]}</span> : <span className="text-muted-foreground">—</span>
                            })()}
                      </TableCell>
                      <TableCell>
                        <PhoneStatusBadge status={phone.status} />
                      </TableCell>
                      <TableCell>{formatDate(phone.addedAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 shrink-0 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/stock/${phone.id}`)
                            }}
                          >
                            <Eye className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            Voir
                          </Button>
                          {canDeleteStock &&
                            (phone.status === "disponible" || phone.status === "sortie") && (
                            <div onClick={(e) => e.stopPropagation()}>
                              <ConfirmDialog
                                trigger={
                                  <Button variant="ghost" size="sm" className="h-8 shrink-0 px-2 text-xs text-destructive hover:text-destructive sm:h-9 sm:px-3 sm:text-sm">
                                    <Trash2 className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    Supprimer
                                  </Button>
                                }
                                title="Supprimer ce téléphone ?"
                                description={
                                  phone.status === "sortie"
                                    ? "L’appareil est en sortie : la fiche sortie associée sera effacée avec le téléphone. Aucune vente ne doit être liée."
                                    : "Cette action retirera définitivement l’appareil du stock. Réservé aux administrateurs et gestionnaires ; pas de vente associée."
                                }
                                confirmLabel="Supprimer"
                                onConfirm={() => handleDelete(phone.id)}
                              />
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="border-t px-4 py-3 text-sm text-muted-foreground">
                {filteredPhones.length} téléphone{filteredPhones.length !== 1 ? "s" : ""} affiché{filteredPhones.length !== 1 ? "s" : ""}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
