import { useEffect } from "react"
import { Navigate, Outlet } from "react-router-dom"
import { useAuthStore } from "@/features/auth/store"
import { useAppStore } from "@/store"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { cn } from "@/lib/utils"

export function MainLayout() {
  const { isAuthenticated, sidebarCollapsed } = useAuthStore()
  const { loadAll, initialized } = useAppStore()

  useEffect(() => {
    if (isAuthenticated && !initialized) {
      loadAll()
    }
  }, [isAuthenticated, initialized, loadAll])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen bg-slate-50 gradient-mesh">
      <Sidebar />
      <div
        className={cn(
          "transition-all duration-300",
          sidebarCollapsed ? "ml-20" : "ml-64",
        )}
      >
        <Header />
        <main className="p-6 lg:p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
