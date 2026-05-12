import { useMemo } from "react"
import { Navigate } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  TrendingUp, TrendingDown, Users, CreditCard, AlertTriangle,
  Package, DollarSign, BarChart3, PieChart as PieChartIcon, Clock, Phone as PhoneIcon, DoorOpen,
} from "lucide-react"
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend, LineChart, Line,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsCard } from "@/components/common/StatsCard"
import { formatCurrency, formatDate, greetingFirstName } from "@/lib/utils"
import { adminApi } from "@/api"
import { useAuthStore } from "@/features/auth/store"
import { qk } from "@/lib/query-keys"

const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"]

type OverdueAlertRow =
  | { type: string; count: number; amount: number }
  | { type: string; rate: number }

interface AdminEmployeeCard {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  salesCount: number
  activeCredits: number
  totalCollected: number
  phonesAddedCount?: number
  sortiesCreatedCount?: number
}

export default function AdminDashboardPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const isAdmin = user?.role === "admin"

  const { data, isLoading, isError } = useQuery({
    queryKey: qk.adminDashboard,
    queryFn: async () => {
      const { data: d } = await adminApi.adminDashboard()
      return d
    },
    enabled: isAdmin,
    staleTime: 120_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  })

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  const stats = data?.stats
  const recovery = data?.recoveryMetrics
  const employees = (data?.employees ?? []) as unknown as AdminEmployeeCard[]

  const vendorChartData = useMemo(
    () => (stats?.vendorPerformance ?? []).map((v: { vendorName: string; salesCount: number; recoveryRate: number; totalSalesAmount: number }) => ({
      name: v.vendorName.split(" ")[0],
      sales: v.salesCount,
      recovery: v.recoveryRate,
      amount: v.totalSalesAmount,
    })),
    [stats],
  )

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Chargement...</div>
  }

  if (isError || !stats || !recovery) {
    return <div className="text-center text-red-600">Erreur lors du chargement des données</div>
  }

  // Alertes de recouvrement
  const lowRecoveryVendors = stats.vendorPerformance.filter((v: any) => v.recoveryRate < 50)
  const overdueAlerts: OverdueAlertRow[] = [
    ...(stats.overdueCredits > 0
      ? [{ type: "Crédits en retard", count: stats.overdueCredits, amount: stats.totalOverdueAmount }]
      : []),
    ...lowRecoveryVendors.map((v: any) => ({
      type: `Faible recouvrement: ${v.vendorName}`,
      rate: v.recoveryRate,
    })),
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold sm:text-3xl">Dashboard Admin</h1>
          <p className="text-sm text-muted-foreground mt-1 sm:text-base">Bienvenue, {greetingFirstName(user?.name)}</p>
        </div>
        <Button
          variant="outline"
          className="w-full shrink-0 sm:w-auto"
          type="button"
          onClick={() => void queryClient.invalidateQueries({ queryKey: qk.adminDashboard })}
        >
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Stock disponible"
          value={stats.totalStock}
          icon={Package}
        />
        <StatsCard
          title="Taux de recouvrement"
          value={`${stats.globalRecoveryRate}%`}
          icon={TrendingUp}
          trend={
            stats.globalRecoveryRate >= 70
              ? { value: 5, label: "objectif" }
              : { value: -10, label: "objectif" }
          }
        />
        <StatsCard
          title="Crédits actifs"
          value={stats.activeCredits}
          icon={CreditCard}
        />
        <StatsCard
          title="Valeur stock"
          value={formatCurrency(stats.stockValue)}
          icon={DollarSign}
        />
      </div>

      {/* Alertes */}
      {overdueAlerts.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
              <AlertTriangle className="h-5 w-5" />
              Alertes de recouvrement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overdueAlerts.map((alert, i) => (
              <div key={i} className="flex justify-between items-center p-2 rounded bg-amber-100 dark:bg-amber-900/30">
                <span className="text-sm">{alert.type}</span>
                {"amount" in alert && (
                  <span className="font-semibold">{formatCurrency(alert.amount)}</span>
                )}
                {"rate" in alert && (
                  <span className="font-semibold text-red-600">{alert.rate}%</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Performance par vendeur */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Performance des vendeurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vendorChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <RechartsTooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="sales" fill="#4f46e5" name="Ventes" />
                <Bar yAxisId="right" dataKey="recovery" fill="#10b981" name="% Recouvrement" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Taux de recouvrement global */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              Répartition des paiements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recovery && (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Payé", value: recovery.byStatus.paye, color: "#10b981" },
                      { name: "Partiel", value: recovery.byStatus.partiel, color: "#f59e0b" },
                      { name: "Impayé", value: recovery.byStatus.impaye, color: "#ef4444" },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { value: recovery.byStatus.paye, color: "#10b981" },
                      { value: recovery.byStatus.partiel, color: "#f59e0b" },
                      { value: recovery.byStatus.impaye, color: "#ef4444" },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tableau des vendeurs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Performance détaillée par vendeur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left p-2 font-semibold">Vendeur</th>
                  <th className="text-right p-2 font-semibold">Ventes</th>
                  <th className="text-right p-2 font-semibold">Montant total</th>
                  <th className="text-right p-2 font-semibold">Recouvré</th>
                  <th className="text-right p-2 font-semibold">Taux %</th>
                  <th className="text-right p-2 font-semibold">Moy./vente</th>
                </tr>
              </thead>
              <tbody>
                {stats.vendorPerformance.map((vendor: any) => (
                  <tr key={vendor.vendorId} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <div>
                        <p className="font-medium">{vendor.vendorName}</p>
                        <p className="text-xs text-muted-foreground">{vendor.vendorEmail}</p>
                      </div>
                    </td>
                    <td className="text-right p-2">{vendor.salesCount}</td>
                    <td className="text-right p-2">{formatCurrency(vendor.totalSalesAmount)}</td>
                    <td className="text-right p-2">{formatCurrency(vendor.paymentsReceived)}</td>
                    <td className="text-right p-2">
                      <span
                        className={`font-semibold ${
                          vendor.recoveryRate >= 70 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {vendor.recoveryRate}%
                      </span>
                    </td>
                    <td className="text-right p-2">{formatCurrency(vendor.averageSaleValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Employés */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Liste des employés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {employees.map((emp) => (
              <div
                key={emp.id}
                className="group relative overflow-hidden rounded-xl border bg-white hover:bg-slate-50/60 transition-colors"
              >
                <div className="p-4 sm:p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900 truncate">{emp.name}</p>
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 capitalize">
                        {emp.role}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{emp.email}</p>
                    <p className="text-xs text-slate-500 mt-1 truncate">{emp.phone}</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 text-sm">
                    <div className="rounded-lg border bg-white px-3 py-2">
                      <p className="text-[11px] text-slate-500">Ventes</p>
                      <p className="text-lg font-semibold text-slate-900">{emp.salesCount}</p>
                    </div>
                    <div className="rounded-lg border bg-white px-3 py-2">
                      <p className="text-[11px] text-slate-500">Crédits actifs</p>
                      <p className="text-lg font-semibold text-amber-700">{emp.activeCredits}</p>
                    </div>
                    <div className="rounded-lg border bg-white px-3 py-2">
                      <p className="text-[11px] text-slate-500">Collecté</p>
                      <p className="text-lg font-semibold text-slate-900">{formatCurrency(emp.totalCollected)}</p>
                    </div>
                    <div className="rounded-lg border bg-white px-3 py-2">
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <PhoneIcon className="h-3.5 w-3.5" />
                        Téléphones ajoutés
                      </p>
                      <p className="text-lg font-semibold text-slate-900">{emp.phonesAddedCount ?? 0}</p>
                    </div>
                    <div className="rounded-lg border bg-white px-3 py-2">
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <DoorOpen className="h-3.5 w-3.5" />
                        Sorties
                      </p>
                      <p className="text-lg font-semibold text-slate-900">{emp.sortiesCreatedCount ?? 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
