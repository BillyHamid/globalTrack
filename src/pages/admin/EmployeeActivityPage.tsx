import { useEffect, useState } from "react"
import { useParams, Link, Navigate } from "react-router-dom"
import { ArrowLeft, Search, Calendar, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"
import { adminApi } from "@/api"
import { useAuthStore } from "@/features/auth/store"
import type { ActivityLog } from "@/types"

export default function EmployeeActivityPage() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === "admin"
  const { id: vendorId } = useParams()
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [vendorName, setVendorName] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchAction, setSearchAction] = useState("")

  const limit = 50

  useEffect(() => {
    const load = async () => {
      if (!isAdmin || !vendorId) return
      setLoading(true)
      try {
        const offset = (page - 1) * limit
        const activityRes = await adminApi.employeeActivity(vendorId, limit, offset)
        setActivities(activityRes.data.data)
        setTotal(activityRes.data.total)

        // Charger le nom du vendeur
        const employeesRes = await adminApi.employees()
        const vendor = employeesRes.data.find((e: { id: string }) => e.id === vendorId)
        if (vendor) setVendorName(vendor.name)
      } catch (err) {
        console.error("Erreur chargement activités:", err)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [isAdmin, vendorId, page])

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  const filteredActivities = searchAction
    ? activities.filter((a) => a.action.toLowerCase().includes(searchAction.toLowerCase()))
    : activities

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/admin/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Activités de {vendorName}</h1>
          <p className="text-muted-foreground">Historique complet des actions</p>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Rechercher par action</label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ex: SALE_CREATED, PAYMENT_ADDED..."
                  className="pl-10"
                  value={searchAction}
                  onChange={(e) => {
                    setSearchAction(e.target.value)
                    setPage(1)
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des activités */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Activités récentes ({total} total)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Aucune activité trouvée
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-3 font-semibold">Date & Heure</th>
                      <th className="text-left p-3 font-semibold">Action</th>
                      <th className="text-left p-3 font-semibold">Détails</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActivities.map((activity) => (
                      <tr key={activity.id} className="border-b hover:bg-muted/50">
                        <td className="p-3 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-medium">{formatDate(activity.timestamp)}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(activity.timestamp).toLocaleTimeString("fr-FR")}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-xs font-medium text-blue-800 dark:text-blue-200">
                            {activity.action.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="p-3">
                          <p className="text-sm text-muted-foreground line-clamp-2">{activity.details}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <div className="text-sm text-muted-foreground">
                    Page {page} de {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
