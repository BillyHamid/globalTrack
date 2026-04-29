import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard, Package, ShoppingCart, CreditCard, Users,
  UserCircle, Bell, ChevronLeft, ChevronRight, Smartphone, DoorOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/features/auth/store"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

const navigationGroups = [
  {
    label: "Aperçu",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    label: "Opérations",
    items: [
      { name: "Stock", href: "/stock", icon: Package },
      { name: "Sorties", href: "/sorties", icon: DoorOpen },
      { name: "Ventes", href: "/sales", icon: ShoppingCart },
      { name: "Crédits", href: "/credits", icon: CreditCard },
    ],
  },
  {
    label: "Gestion",
    items: [
      { name: "Clients", href: "/clients", icon: Users },
      { name: "Utilisateurs", href: "/users", icon: UserCircle },
      { name: "Alertes", href: "/alerts", icon: Bell },
    ],
  },
]

export function Sidebar() {
  const location = useLocation()
  const { sidebarCollapsed, toggleSidebar, user } = useAuthStore()

  const groups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (user?.role === "vendeur" && item.href === "/users") return false
        return true
      }),
    }))
    .filter((g) => g.items.length > 0)

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-white border-r border-slate-200 transition-all duration-300 flex flex-col shadow-soft",
          sidebarCollapsed ? "w-20" : "w-64",
        )}
      >
        {/* Logo Section */}
        <div className="flex items-center h-16 px-4 border-b border-slate-100">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl gradient-primary shadow-glow shrink-0">
            <Smartphone className="h-5 w-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="ml-3 overflow-hidden">
              <p className="text-base font-bold text-slate-900 tracking-tight leading-none">
                GlobalTrack
              </p>
              <p className="text-[10px] font-medium text-slate-500 mt-1 uppercase tracking-widest">
                Mobile Manager
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {groups.map((group, gi) => (
            <div key={group.label} className={cn("px-3", gi > 0 && "mt-6")}>
              {!sidebarCollapsed && (
                <p className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">
                  {group.label}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = item.href === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(item.href)
                  const Icon = item.icon

                  const link = (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-indigo-50 text-indigo-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                      )}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full gradient-primary" />
                      )}
                      <Icon
                        className={cn(
                          "h-5 w-5 shrink-0 transition-colors",
                          isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600",
                        )}
                      />
                      {!sidebarCollapsed && (
                        <span className="flex-1 truncate">{item.name}</span>
                      )}
                      {!sidebarCollapsed && isActive && (
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      )}
                    </Link>
                  )

                  if (sidebarCollapsed) {
                    return (
                      <Tooltip key={item.name}>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right" className="font-medium">
                          {item.name}
                        </TooltipContent>
                      </Tooltip>
                    )
                  }
                  return link
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User mini card */}
        {!sidebarCollapsed && user && (
          <div className="px-3 pb-3">
            <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 p-3 border border-indigo-100">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold shadow-glow shrink-0">
                  {user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-[10px] text-indigo-600 font-medium capitalize">{user.role}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Collapse button */}
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center gap-2 h-12 border-t border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all cursor-pointer"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="text-xs font-medium">Réduire</span>
            </>
          )}
        </button>
      </aside>
    </TooltipProvider>
  )
}
