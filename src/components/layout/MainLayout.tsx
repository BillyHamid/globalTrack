import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuthStore } from "@/features/auth/store"
import { useAppStore } from "@/store"
import { dashboardBundleApi, DEFAULT_LIST_LIMIT } from "@/api"
import { qk } from "@/lib/query-keys"
import {
  resetBundleAlertRefreshFlag,
  consumeInitialBundleAlertRefresh,
} from "@/lib/session-query-flags"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { MobileDrawer } from "./MobileDrawer"
import { MobileBottomNav } from "./MobileBottomNav"
import { cn } from "@/lib/utils"

export function MainLayout() {
  const { isAuthenticated, sidebarCollapsed } = useAuthStore()
  const hydrateFromBundle = useAppStore((s) => s.hydrateFromBundle)
  const refreshAlerts = useAppStore((s) => s.refreshAlerts)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()

  const bundleQuery = useQuery({
    queryKey: qk.appBundle,
    queryFn: async () => {
      const { data } = await dashboardBundleApi.get({ limit: DEFAULT_LIST_LIMIT })
      return data
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (bundleQuery.data) {
      hydrateFromBundle(bundleQuery.data)
    }
  }, [bundleQuery.data, hydrateFromBundle])

  useEffect(() => {
    if (!isAuthenticated) {
      resetBundleAlertRefreshFlag()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!bundleQuery.isSuccess || !bundleQuery.data) return
    if (!consumeInitialBundleAlertRefresh()) return
    void refreshAlerts()
  }, [bundleQuery.isSuccess, bundleQuery.data, refreshAlerts])

  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-50 gradient-mesh overflow-x-hidden">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <MobileDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />

      <div
        className={cn(
          "min-w-0 transition-all duration-300",
          "lg:ml-64",
          sidebarCollapsed && "lg:ml-20",
        )}
      >
        <Header onOpenDrawer={() => setDrawerOpen(true)} />
        <main className="min-w-0 p-3 sm:p-6 lg:p-8 pb-24 lg:pb-8 animate-fade-in">
          {bundleQuery.isError && (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
              Impossible de charger les données. Vérifiez la connexion au serveur.
            </p>
          )}
          {bundleQuery.isPending ? (
            <div className="space-y-4">
              <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
              <div className="h-64 animate-pulse rounded-xl bg-muted" />
              <div className="h-48 animate-pulse rounded-xl bg-muted" />
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>

      <MobileBottomNav onMore={() => setDrawerOpen(true)} />
    </div>
  )
}
