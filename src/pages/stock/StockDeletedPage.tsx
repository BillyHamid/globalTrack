import { useEffect, useState } from "react"
import { Link, Navigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Loader2, Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatDate } from "@/lib/utils"
import { phonesApi } from "@/api"
import { qk } from "@/lib/query-keys"
import { useAuthStore } from "@/features/auth/store"

const LIMIT = 25

export default function StockDeletedPage() {
  const user = useAuthStore((s) => s.user)
  const canAccess = user?.role === "admin" || user?.role === "gestionnaire"

  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 350)
    return () => window.clearTimeout(t)
  }, [searchInput])

  const { data, isLoading, isError } = useQuery({
    queryKey: qk.phoneDeletionLog(search, page),
    queryFn: async () => {
      const offset = (page - 1) * LIMIT
      const { data: res } = await phonesApi.deletionLog({
        limit: LIMIT,
        offset,
        ...(search ? { search } : {}),
      })
      return res
    },
    enabled: canAccess,
    staleTime: 30_000,
  })

  if (!canAccess) {
    return <Navigate to="/" replace />
  }

  const rows = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <Link to="/stock">
            <Button variant="ghost" size="icon" type="button" aria-label="Retour au stock">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Trash2 className="h-7 w-7 text-muted-foreground shrink-0" />
              Téléphones supprimés
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Trace conservée à chaque suppression (données figées au moment de la suppression).
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="IMEI, marque, modèle ou ancien ID…"
              className="pl-10"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">Historique ({total})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading && (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          {isError && (
            <p className="text-center text-red-600 py-8">Impossible de charger l&apos;historique.</p>
          )}
          {!isLoading && !isError && rows.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Aucune suppression enregistrée.</p>
          )}
          {!isLoading && !isError && rows.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium whitespace-nowrap">Supprimé le</th>
                  <th className="pb-2 pr-3 font-medium whitespace-nowrap">Ancien ID</th>
                  <th className="pb-2 pr-3 font-medium">Appareil</th>
                  <th className="pb-2 pr-3 font-medium whitespace-nowrap">IMEI</th>
                  <th className="pb-2 pr-3 font-medium text-right whitespace-nowrap">Prix affiché</th>
                  <th className="pb-2 pr-3 font-medium">Supprimé par</th>
                  <th className="pb-2 font-medium">Ajouté au stock par</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pr-3 align-top whitespace-nowrap text-muted-foreground">
                      {formatDate(row.deletedAt)}
                    </td>
                    <td className="py-3 pr-3 align-top font-mono text-xs">{row.formerPhoneId}</td>
                    <td className="py-3 pr-3 align-top">
                      <span className="font-medium">{row.brand}</span> {row.model}
                      <span className="text-muted-foreground text-xs block">
                        {[row.capacity, row.color].filter(Boolean).join(" · ") || "—"}
                      </span>
                    </td>
                    <td className="py-3 pr-3 align-top font-mono text-xs">{row.imei}</td>
                    <td className="py-3 pr-3 align-top text-right tabular-nums">
                      {formatCurrency(row.sellingPrice)}
                    </td>
                    <td className="py-3 pr-3 align-top">
                      <span className="font-medium">{row.deletedBy.name}</span>
                      <span className="text-muted-foreground text-xs block truncate max-w-[140px]">
                        {row.deletedBy.email}
                      </span>
                    </td>
                    <td className="py-3 align-top">
                      <span className="font-medium">{row.addedBy.name}</span>
                      <span className="text-muted-foreground text-xs block">
                        {formatDate(row.addedAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Précédent
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                Page {page} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Suivant
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
