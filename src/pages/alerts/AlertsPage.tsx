import { useEffect, useMemo } from "react"
import {
  CreditCard, Package, AlertTriangle, Bell,
  Eye, CheckCircle2, BellRing, Timer,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatsCard } from "@/components/common/StatsCard"
import { AlertStatusBadge } from "@/components/common/StatusBadge"
import { EmptyState } from "@/components/common/EmptyState"
import { formatDate } from "@/lib/utils"
import { useAppStore } from "@/store"
import type { Alert, AlertType } from "@/types"

const typeConfig: Record<AlertType, { icon: typeof CreditCard; label: string; color: string }> = {
  credit_retard: { icon: CreditCard, label: "Crédit en retard", color: "text-red-600" },
  stock_ancien: { icon: Package, label: "Stock ancien", color: "text-amber-600" },
  incoherence: { icon: AlertTriangle, label: "Incohérence", color: "text-orange-600" },
  sortie_echeance: { icon: Timer, label: "Sortie 48 h", color: "text-rose-600" },
}

export default function AlertsPage() {
  const alerts = useAppStore((s) => s.alerts)
  const markAlertViewed = useAppStore((s) => s.markAlertViewed)
  const resolveAlert = useAppStore((s) => s.resolveAlert)
  const refreshAlerts = useAppStore((s) => s.refreshAlerts)

  useEffect(() => {
    void refreshAlerts()
  }, [])

  const stats = useMemo(() => ({
    total: alerts.length,
    nouvelle: alerts.filter((a) => a.status === "nouvelle").length,
    vue: alerts.filter((a) => a.status === "vue").length,
    resolue: alerts.filter((a) => a.status === "resolue").length,
  }), [alerts])

  const creditAlerts = useMemo(() => alerts.filter((a) => a.type === "credit_retard"), [alerts])
  const stockAlerts = useMemo(() => alerts.filter((a) => a.type === "stock_ancien"), [alerts])
  const incoherenceAlerts = useMemo(() => alerts.filter((a) => a.type === "incoherence"), [alerts])
  const sortieAlerts = useMemo(() => alerts.filter((a) => a.type === "sortie_echeance"), [alerts])

  function markAsViewed(alertId: string) {
    markAlertViewed(alertId)
    toast.success("Alerte marquée comme vue")
  }

  function markAsResolved(alertId: string) {
    resolveAlert(alertId)
    toast.success("Alerte résolue")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Alertes et notifications</h1>
        <p className="text-muted-foreground">Suivez les alertes de votre inventaire</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total alertes" value={stats.total} icon={Bell} iconColor="text-blue-600" />
        <StatsCard title="Nouvelles" value={stats.nouvelle} icon={BellRing} iconColor="text-red-600" />
        <StatsCard title="Vues" value={stats.vue} icon={Eye} iconColor="text-amber-600" />
        <StatsCard title="Résolues" value={stats.resolue} icon={CheckCircle2} iconColor="text-emerald-600" />
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Toutes ({alerts.length})</TabsTrigger>
          <TabsTrigger value="credit_retard">Crédits en retard ({creditAlerts.length})</TabsTrigger>
          <TabsTrigger value="stock_ancien">Stock ancien ({stockAlerts.length})</TabsTrigger>
          <TabsTrigger value="incoherence">Incohérences ({incoherenceAlerts.length})</TabsTrigger>
          <TabsTrigger value="sortie_echeance">Sorties 48 h ({sortieAlerts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <AlertList alerts={alerts} onMarkViewed={markAsViewed} onResolve={markAsResolved} />
        </TabsContent>
        <TabsContent value="credit_retard">
          <AlertList alerts={creditAlerts} onMarkViewed={markAsViewed} onResolve={markAsResolved} />
        </TabsContent>
        <TabsContent value="stock_ancien">
          <AlertList alerts={stockAlerts} onMarkViewed={markAsViewed} onResolve={markAsResolved} />
        </TabsContent>
        <TabsContent value="incoherence">
          <AlertList alerts={incoherenceAlerts} onMarkViewed={markAsViewed} onResolve={markAsResolved} />
        </TabsContent>
        <TabsContent value="sortie_echeance">
          <AlertList alerts={sortieAlerts} onMarkViewed={markAsViewed} onResolve={markAsResolved} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AlertList({
  alerts,
  onMarkViewed,
  onResolve,
}: {
  alerts: Alert[]
  onMarkViewed: (id: string) => void
  onResolve: (id: string) => void
}) {
  if (alerts.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="Aucune alerte"
        description="Aucune alerte ne correspond à ce filtre."
      />
    )
  }

  return (
    <div className="grid gap-4 mt-4 sm:grid-cols-2 lg:grid-cols-3">
      {alerts.map((alert) => {
        const config = typeConfig[alert.type]
        const Icon = config.icon
        return (
          <Card key={alert.id}>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center bg-muted`}>
                    <Icon className={`h-5 w-5 ${config.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">{config.label}</p>
                  </div>
                </div>
                <AlertStatusBadge status={alert.status} />
              </div>

              <p className="text-sm text-muted-foreground">{alert.description}</p>

              <p className="text-xs text-muted-foreground">{formatDate(alert.createdAt)}</p>

              <div className="flex items-center gap-2 pt-1">
                {alert.status === "nouvelle" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onMarkViewed(alert.id)}
                  >
                    <Eye className="mr-1 h-4 w-4" />
                    Marquer comme vue
                  </Button>
                )}
                {alert.status === "vue" && (
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => onResolve(alert.id)}
                  >
                    <CheckCircle2 className="mr-1 h-4 w-4" />
                    Résoudre
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
