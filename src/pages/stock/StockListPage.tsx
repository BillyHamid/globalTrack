import { useState, useMemo } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Plus, Search, Eye, Trash2, HardDrive, Palette } from "lucide-react"
import { ExportButtons } from "@/components/common/ExportButtons"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { ExportColumn } from "@/lib/export"
import type { Phone } from "@/types"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { useAppStore } from "@/store"
import { useAuthStore } from "@/features/auth/store"

const STOCK_EXPORT_COLUMNS: ExportColumn<Phone>[] = [
  { header: 'Marque',      value: (p) => p.brand },
  { header: 'Modèle',      value: (p) => p.model },
  { header: 'Capacité',    value: (p) => p.capacity },
  { header: 'Couleur',     value: (p) => p.color },
  { header: 'Prix vente',  value: (p) => formatCurrency(p.sellingPrice), csvValue: (p) => String(p.sellingPrice) },
  { header: 'Prix achat',  value: (p) => p.purchasePrice != null ? formatCurrency(p.purchasePrice) : '—', csvValue: (p) => p.purchasePrice != null ? String(p.purchasePrice) : '' },
  { header: 'IMEI / S/N',  value: (p) => p.imei ?? '' },
  { header: 'Statut',      value: (p) => p.status },
  { header: "Date d'ajout", value: (p) => formatDate(p.addedAt) },
]

const KNOWN_COLORS = new Set([
  'noir', 'noire', 'blanc', 'blanche', 'bleu', 'bleue', 'rouge',
  'violet', 'violette', 'or', 'gris', 'grise', 'vert', 'verte',
  'rose', 'jaune', 'orange', 'argent', 'titanium', 'naturel', 'naturelle',
  'black', 'white', 'blue', 'red', 'gold', 'gray', 'grey', 'green',
  'pink', 'purple', 'silver',
])

// Mots-clés qui indiquent une variante (apparaissent après le numéro de série)
const VARIANT_KEYWORDS = new Set(['pro', 'max', 'plus', 'ultra', 'air', 'mini', 'edge', 'lite', 'fe'])

// Extrait la série de base d'un modèle : "iPhone 14 Pro Max" → "iPhone 14"
function extractSeries(model: string): string {
  // Normalise "S25+" → "S25" pour ne pas traiter le + comme un mot séparé
  const normalized = model.trim().replace(/(\w+)\+/g, '$1')
  const words = normalized.split(/\s+/)
  let foundNumber = false
  const result: string[] = []
  for (const word of words) {
    const hasNumber = /\d/.test(word)
    if (hasNumber) foundNumber = true
    // Coupe à partir du premier mot-clé variante qui suit un numéro
    if (foundNumber && !hasNumber && VARIANT_KEYWORDS.has(word.toLowerCase())) break
    result.push(word)
  }
  return result.join(' ') || model
}

interface ParsedSearch {
  capacity: string | null
  color: string | null
  text: string
}

function parseSmartSearch(query: string): ParsedSearch {
  if (!query.trim()) return { capacity: null, color: null, text: '' }
  const tokens = query.toLowerCase().trim().split(/\s+/)
  let capacity: string | null = null
  let color: string | null = null
  const textTokens: string[] = []
  for (const token of tokens) {
    const capMatch = token.match(/^(\d+)(go|gb|to|tb)?$/)
    if (capMatch && !capacity) { capacity = capMatch[1]; continue }
    if (KNOWN_COLORS.has(token) && !color) { color = token; continue }
    textTokens.push(token)
  }
  return { capacity, color, text: textTokens.join(' ') }
}

export default function StockListPage() {
  const navigate = useNavigate()
  const { phones, deletePhone } = useAppStore()
  const { user } = useAuthStore()
  const [search, setSearch] = useState("")
  const [brandFilter, setBrandFilter] = useState<string>("all")
  const [seriesFilter, setSeriesFilter] = useState<string>("all")
  const [modelFilter, setModelFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Niveau 1 — Marques uniques
  const brands = useMemo(
    () => [...new Set(phones.map((p) => p.brand))].sort(),
    [phones],
  )

  // Niveau 2 — Séries détectées automatiquement pour la marque sélectionnée
  const seriesList = useMemo(() => {
    if (brandFilter === "all") return []
    const filtered = phones.filter((p) => p.brand === brandFilter)
    return [...new Set(filtered.map((p) => extractSeries(p.model)))].sort()
  }, [phones, brandFilter])

  // Niveau 3 — Variantes pour la série sélectionnée
  const modelsList = useMemo(() => {
    if (brandFilter === "all" || seriesFilter === "all") return []
    const filtered = phones.filter(
      (p) => p.brand === brandFilter && extractSeries(p.model) === seriesFilter,
    )
    return [...new Set(filtered.map((p) => p.model))].sort()
  }, [phones, brandFilter, seriesFilter])

  function handleBrandChange(value: string) {
    setBrandFilter(value)
    setSeriesFilter("all")
    setModelFilter("all")
  }

  function handleSeriesChange(value: string) {
    setSeriesFilter(value)
    setModelFilter("all")
  }

  const parsed = useMemo(() => parseSmartSearch(search), [search])

  const filteredPhones = useMemo(() => {
    return phones.filter((phone) => {
      if (parsed.text) {
        const tokens = parsed.text.split(/\s+/).filter(Boolean)
        const allMatch = tokens.every(token =>
          phone.brand.toLowerCase().includes(token) ||
          phone.model.toLowerCase().includes(token) ||
          (phone.imei ?? "").includes(token) ||
          (phone.notes ?? "").toLowerCase().includes(token)
        )
        if (!allMatch) return false
      }
      if (parsed.capacity && !phone.capacity.toLowerCase().includes(parsed.capacity)) return false
      if (parsed.color && !phone.color.toLowerCase().includes(parsed.color)) return false
      if (brandFilter !== "all" && phone.brand !== brandFilter) return false
      if (seriesFilter !== "all" && extractSeries(phone.model) !== seriesFilter) return false
      if (modelFilter !== "all" && phone.model !== modelFilter) return false
      if (statusFilter !== "all" && phone.status !== statusFilter) return false
      return true
    })
  }, [phones, parsed, brandFilter, seriesFilter, modelFilter, statusFilter])

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
          "Suppression impossible (vérifiez vos droits ou le statut de l'appareil).",
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
        <div className="flex shrink-0 flex-wrap items-center gap-2 w-full sm:w-auto">
          <ExportButtons
            data={filteredPhones}
            columns={STOCK_EXPORT_COLUMNS}
            filename={`stock-${new Date().toISOString().slice(0, 10)}`}
            title="Stock — GlobalTrack"
          />
          <Link to="/stock/add" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un téléphone
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Filtres</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Barre de recherche intelligente */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Ex: iPhone 17 256Go noir, Samsung S25..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filtres en cascade */}
          <div className="flex flex-wrap gap-3">
            {/* Niveau 1 — Marque */}
            <Select value={brandFilter} onValueChange={handleBrandChange}>
              <SelectTrigger className="w-[155px]">
                <SelectValue placeholder="Marque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les marques</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Niveau 2 — Série (visible uniquement si une marque est choisie) */}
            {brandFilter !== "all" && seriesList.length > 0 && (
              <Select value={seriesFilter} onValueChange={handleSeriesChange}>
                <SelectTrigger className="w-[155px]">
                  <SelectValue placeholder="Série" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les séries</SelectItem>
                  {seriesList.map((series) => (
                    <SelectItem key={series} value={series}>{series}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Niveau 3 — Variante (visible uniquement si une série est choisie et qu'il y a plusieurs variantes) */}
            {seriesFilter !== "all" && modelsList.length > 1 && (
              <Select value={modelFilter} onValueChange={setModelFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Variante" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les variantes</SelectItem>
                  {modelsList.map((model) => (
                    <SelectItem key={model} value={model}>{model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Statut */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[155px]">
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

          {/* Badges de détection intelligente */}
          {(parsed.capacity || parsed.color) && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Détecté :</span>
              {parsed.capacity && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <HardDrive className="h-3 w-3" />
                  {parsed.capacity} Go
                </Badge>
              )}
              {parsed.color && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Palette className="h-3 w-3" />
                  {parsed.color.charAt(0).toUpperCase() + parsed.color.slice(1)}
                </Badge>
              )}
            </div>
          )}
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
                                    ? "L'appareil est en sortie : la fiche sortie associée sera effacée avec le téléphone. Aucune vente ne doit être liée."
                                    : "Cette action retirera définitivement l'appareil du stock. Réservé aux administrateurs et gestionnaires ; pas de vente associée."
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
