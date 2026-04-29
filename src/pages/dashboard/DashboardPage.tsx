import { useEffect, useMemo } from "react"
import { Link } from "react-router-dom"
import {
  Package, ShoppingCart, CreditCard, DollarSign,
  TrendingUp, TrendingDown, AlertTriangle, ArrowRight, Sparkles,
  ArrowUpRight, Activity, BarChart3,
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts"
import { Button } from "@/components/ui/button"
import { StatsCard } from "@/components/common/StatsCard"
import { PaymentStatusBadge } from "@/components/common/StatusBadge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useAppStore } from "@/store"
import { useAuthStore } from "@/features/auth/store"

const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"]

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Bonjour"
  if (hour < 18) return "Bon après-midi"
  return "Bonsoir"
}

export default function DashboardPage() {
  const phones = useAppStore((s) => s.phones)
  const sales = useAppStore((s) => s.sales)
  const movements = useAppStore((s) => s.movements)
  const alerts = useAppStore((s) => s.alerts)
  const clients = useAppStore((s) => s.clients)
  const refreshAlerts = useAppStore((s) => s.refreshAlerts)
  const getAvailablePhones = useAppStore((s) => s.getAvailablePhones)
  const getActiveCredits = useAppStore((s) => s.getActiveCredits)
  const getOverdueCredits = useAppStore((s) => s.getOverdueCredits)
  const getStockByBrand = useAppStore((s) => s.getStockByBrand)
  const getUser = useAppStore((s) => s.getUser)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    void refreshAlerts()
  }, [])

  const availablePhones = useMemo(() => getAvailablePhones(), [getAvailablePhones, phones])
  const activeCredits = useMemo(() => getActiveCredits(), [getActiveCredits, sales])
  const overdueCredits = useMemo(() => getOverdueCredits(), [getOverdueCredits, sales])
  const stockByBrand = useMemo(() => getStockByBrand(), [getStockByBrand, phones])

  const totalDebt = activeCredits.reduce((sum, s) => sum + s.remainingAmount, 0)
  const today = todayISO()
  const todaySales = sales.filter((s) => s.date === today).length
  const stockValue = availablePhones.reduce((sum, p) => sum + p.sellingPrice, 0)

  // Évolution des ventes — 6 derniers mois calculés depuis les vraies ventes
  const monthsByMonth = useMemo(() => {
    const labels = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"]
    const now = new Date()
    const buckets: { month: string; cash: number; credit: number; key: string }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`
      buckets.push({ month: labels[d.getMonth()], cash: 0, credit: 0, key })
    }
    for (const sale of sales) {
      const d = new Date(sale.date)
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`
      const bucket = buckets.find((b) => b.key === key)
      if (!bucket) continue
      if (sale.type === "cash") bucket.cash += sale.totalAmount
      else bucket.credit += sale.totalAmount
    }
    return buckets
  }, [sales])

  const salesTrend = useMemo(() => {
    if (monthsByMonth.length < 2) return null
    const current = monthsByMonth[monthsByMonth.length - 1]
    const previous = monthsByMonth[monthsByMonth.length - 2]
    const currentTotal = current.cash + current.credit
    const previousTotal = previous.cash + previous.credit
    if (previousTotal === 0 && currentTotal === 0) return null
    if (previousTotal === 0) return { percent: 100, isUp: true }
    const percent = Math.round(((currentTotal - previousTotal) / previousTotal) * 100)
    return { percent: Math.abs(percent), isUp: percent >= 0 }
  }, [monthsByMonth])

  const hasSalesData = useMemo(
    () => monthsByMonth.some((m) => m.cash > 0 || m.credit > 0),
    [monthsByMonth],
  )
  const recentMovements = useMemo(
    () => [...movements].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [movements],
  )
  const activeAlerts = alerts.filter((a) => a.status !== "resolue")

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl gradient-primary p-8 lg:p-10 shadow-premium">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),_transparent_50%)]" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-pink-300/20 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 mb-4">
              <Sparkles className="h-3.5 w-3.5 text-white" />
              <span className="text-xs font-semibold text-white tracking-wide">
                Activité du jour
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
              {getGreeting()}, {user?.name.split(" ")[0]}
            </h1>
            <p className="text-white/80 mt-2 text-base lg:text-lg max-w-xl text-balance">
              Voici un aperçu complet de votre activité commerciale aujourd'hui.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/sales/new">
              <Button
                size="lg"
                className="bg-white text-indigo-600 hover:bg-white/90 shadow-lg font-semibold rounded-xl"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Nouvelle vente
              </Button>
            </Link>
            <Link to="/stock/add">
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white backdrop-blur-sm font-semibold rounded-xl"
              >
                <Package className="mr-2 h-4 w-4" />
                Ajouter stock
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Stock disponible"
          value={availablePhones.length}
          icon={Package}
          trend={{ value: 12, label: "vs mois dernier" }}
          variant="primary"
        />
        <StatsCard
          title="Ventes aujourd'hui"
          value={todaySales}
          icon={ShoppingCart}
          variant="success"
        />
        <StatsCard
          title="Crédits en cours"
          value={activeCredits.length}
          icon={CreditCard}
          variant="warning"
        />
        <StatsCard
          title="Total dettes"
          value={formatCurrency(totalDebt)}
          icon={DollarSign}
          variant="danger"
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-7">
        <div className="lg:col-span-4 rounded-2xl bg-white border border-slate-200/80 shadow-soft overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Évolution des ventes</h3>
              <p className="text-xs text-slate-500 mt-0.5">6 derniers mois — cash vs crédit</p>
            </div>
            {salesTrend && (
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
                  salesTrend.isUp ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                }`}
              >
                {salesTrend.isUp ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                <span className="text-xs font-semibold">
                  {salesTrend.isUp ? "+" : "-"}{salesTrend.percent}%
                </span>
              </div>
            )}
          </div>
          <div className="p-6">
            {hasSalesData ? (
              <>
                <div className="flex items-center gap-4 mb-4 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" />
                    <span className="text-slate-600 font-medium">Cash</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
                    <span className="text-slate-600 font-medium">Crédit</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={monthsByMonth}>
                    <defs>
                      <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                        <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.8} />
                      </linearGradient>
                      <linearGradient id="creditGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`}
                    />
                    <RechartsTooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 10px 15px -3px rgba(15, 23, 42, 0.1)",
                      }}
                      cursor={{ fill: "rgba(99, 102, 241, 0.05)" }}
                    />
                    <Bar dataKey="cash" name="Cash" fill="url(#cashGrad)" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="credit" name="Crédit" fill="url(#creditGrad)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-center">
                <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <BarChart3 className="h-7 w-7 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-700">Aucune vente sur les 6 derniers mois</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  L'évolution s'affichera dès que vous enregistrerez vos premières ventes
                </p>
                <Link to="/sales/new" className="mt-4">
                  <Button size="sm" className="rounded-xl">
                    <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
                    Première vente
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 rounded-2xl bg-white border border-slate-200/80 shadow-soft overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Stock par marque</h3>
            <p className="text-xs text-slate-500 mt-0.5">Répartition des appareils disponibles</p>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={stockByBrand}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  nameKey="name"
                  strokeWidth={0}
                >
                  {stockByBrand.map((_entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 10px 15px -3px rgba(15, 23, 42, 0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {stockByBrand.slice(0, 4).map((brand, i) => (
                <div key={brand.name} className="flex items-center gap-2 text-xs">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ background: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-slate-600 font-medium truncate">{brand.name}</span>
                  <span className="ml-auto text-slate-900 font-semibold">{brand.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-soft overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Activity className="h-4 w-4 text-indigo-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Activité récente</h3>
            </div>
            <Link to="/stock/history">
              <Button variant="ghost" size="sm" className="text-xs font-semibold rounded-lg">
                Voir tout <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentMovements.map((mov) => {
              const phone = phones.find((p) => p.id === mov.phoneId)
              const movUser = getUser(mov.performedBy)
              const dotColor =
                mov.type === "entree" ? "bg-emerald-500" :
                mov.type === "vente" ? "bg-indigo-500" : "bg-amber-500"
              const typeLabel =
                mov.type === "entree" ? "Entrée" :
                mov.type === "vente" ? "Vente" :
                mov.type === "sortie" ? "Sortie" :
                mov.type === "retour_sortie" ? "Retour sortie" : "Retour"
              return (
                <div
                  key={mov.id}
                  className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <span className={`absolute inset-0 ${dotColor} rounded-full animate-ping opacity-30`} />
                      <span className={`relative h-2.5 w-2.5 rounded-full ${dotColor} block`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {phone?.brand} {phone?.model}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        <span className="font-medium">{typeLabel}</span> par {movUser?.name.split(" ")[0]}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 font-medium shrink-0 ml-3">
                    {formatDate(mov.date)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-soft overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Alertes actives
                <span className="ml-2 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold">
                  {activeAlerts.length}
                </span>
              </h3>
            </div>
            <Link to="/alerts">
              <Button variant="ghost" size="sm" className="text-xs font-semibold rounded-lg">
                Voir tout <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {activeAlerts.slice(0, 5).map((alert) => {
              const dotColor =
                alert.type === "credit_retard" ? "bg-red-500" :
                alert.type === "stock_ancien" ? "bg-amber-500" : "bg-orange-500"
              return (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 px-6 py-3.5 hover:bg-slate-50/60 transition-colors"
                >
                  <div className={`h-2.5 w-2.5 rounded-full mt-1.5 shrink-0 ${dotColor}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{alert.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{alert.description}</p>
                  </div>
                </div>
              )
            })}
            {activeAlerts.length === 0 && (
              <div className="px-6 py-8 text-center">
                <p className="text-sm text-slate-500">Aucune alerte active 🎉</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overdue credits */}
      {overdueCredits.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-red-100">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-red-900">
                  Crédits en retard ({overdueCredits.length})
                </h3>
                <p className="text-xs text-red-700/80 mt-0.5">Action requise — relances clients</p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-red-100">
            {overdueCredits.map((sale) => {
              const client = clients.find((c) => c.id === sale.clientId)
              const phone = phones.find((p) => p.id === sale.phoneId)
              return (
                <div
                  key={sale.id}
                  className="flex items-center justify-between px-6 py-3.5 hover:bg-red-100/40 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{client?.name}</p>
                    <p className="text-xs text-slate-500">
                      {phone?.brand} {phone?.model}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-bold text-red-700">
                      {formatCurrency(sale.remainingAmount)}
                    </p>
                    <PaymentStatusBadge status={sale.paymentStatus} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Valeur du stock", value: formatCurrency(stockValue), icon: Package, color: "from-indigo-500 to-purple-500" },
          { label: "Total téléphones", value: phones.length, icon: ShoppingCart, color: "from-emerald-500 to-teal-500" },
          { label: "Clients enregistrés", value: clients.length, icon: ArrowUpRight, color: "from-amber-500 to-orange-500" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-6 shadow-soft hover:shadow-premium transition-all"
          >
            <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${stat.color} opacity-10 blur-2xl`} />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {stat.label}
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
