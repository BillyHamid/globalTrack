import { useEffect, useState } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuthStore } from "@/features/auth/store"
import { useAppStore } from "@/store"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { MobileDrawer } from "./MobileDrawer"
import { MobileBottomNav } from "./MobileBottomNav"
import { cn } from "@/lib/utils"

export function MainLayout() {
  const { isAuthenticated, sidebarCollapsed } = useAuthStore()
  const { loadAll, initialized } = useAppStore()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    if (isAuthenticated && !initialized) {
      loadAll()
    }
  }, [isAuthenticated, initialized, loadAll])

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen bg-slate-50 gradient-mesh">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      <MobileDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />

      <div
        className={cn(
          "transition-all duration-300",
          "lg:ml-64",
          sidebarCollapsed && "lg:ml-20",
        )}
      >
        <Header onOpenDrawer={() => setDrawerOpen(true)} />
        <main className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 animate-fade-in">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileBottomNav onMore={() => setDrawerOpen(true)} />
    </div>
  )
}
