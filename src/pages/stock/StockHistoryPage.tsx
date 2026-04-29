import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { EmptyState } from "@/components/common/EmptyState"
import { formatDate } from "@/lib/utils"
import { getMovementVisual } from "@/lib/stock-movement-display"
import { useAppStore } from "@/store"

export default function StockHistoryPage() {
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const { movements, getPhone, getUser } = useAppStore()

  const filteredMovements = useMemo(() => {
    const sorted = [...movements].sort((a, b) => b.date.localeCompare(a.date))
    if (typeFilter === "all") return sorted
    return sorted.filter((m) => m.type === typeFilter)
  }, [movements, typeFilter])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Historique des mouvements</h1>
          <p className="text-muted-foreground">
            {movements.length} mouvement{movements.length !== 1 ? "s" : ""} au total
          </p>
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="entree">Entrée</SelectItem>
            <SelectItem value="vente">Vente</SelectItem>
            <SelectItem value="retour">Retour</SelectItem>
            <SelectItem value="sortie">Sortie</SelectItem>
            <SelectItem value="retour_sortie">Retour sortie</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Mouvements ({filteredMovements.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMovements.length === 0 ? (
            <EmptyState
              title="Aucun mouvement trouvé"
              description="Aucun mouvement ne correspond au filtre sélectionné."
            />
          ) : (
            <div className="space-y-1">
              {filteredMovements.map((mov) => {
                const phone = getPhone(mov.phoneId)
                const perf = mov.performedBy as unknown
                const performerId =
                  typeof perf === "string"
                    ? perf
                    : perf && typeof perf === "object" && "id" in perf
                      ? String((perf as { id: string }).id)
                      : (mov as unknown as { performedById?: string }).performedById ?? ""
                const user = getUser(performerId)
                const config = getMovementVisual(mov.type)
                const Icon = config.icon

                return (
                  <div
                    key={mov.id}
                    className="flex items-center gap-4 rounded-lg px-3 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${config.color} text-white`}>
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {phone ? `${phone.brand} ${phone.model}` : mov.phoneId}
                        </p>
                        <span className={`inline-block h-2 w-2 rounded-full ${config.color}`} />
                        <span className="text-xs text-muted-foreground">{config.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        Par {user?.name ?? (performerId || "—")}
                        {mov.notes && ` — ${mov.notes}`}
                      </p>
                    </div>

                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(mov.date)}
                    </span>
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
