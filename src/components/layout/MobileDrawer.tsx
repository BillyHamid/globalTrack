import { Link, useLocation } from "react-router-dom"
import { useNavigate } from "react-router-dom"
import {
  LayoutDashboard, Package, ShoppingCart, CreditCard, Users,
  UserCircle, Bell, Smartphone, DoorOpen, LogOut, ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/features/auth/store"
import { useAppStore } from "@/store"
import {
  Sheet, SheetContent, SheetTitle,
} from "@/components/ui/sheet"

const navigationGroups = [
  {
    label: "Aperçu",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard, color: "from-indigo-500 to-purple-500" },
    ],
  },
  {
    label: "Opérations",
    items: [
      { name: "Stock", href: "/stock", icon: Package, color: "from-blue-500 to-cyan-500" },
      { name: "Sorties", href: "/sorties", icon: DoorOpen, color: "from-orange-500 to-amber-500" },
      { name: "Ventes", href: "/sales", icon: ShoppingCart, color: "from-emerald-500 to-green-500" },
      { name: "Crédits", href: "/credits", icon: CreditCard, color: "from-rose-500 to-pink-500" },
    ],
  },
  {
    label: "Gestion",
    items: [
      { name: "Clients", href: "/clients", icon: Users, color: "from-violet-500 to-fuchsia-500" },
      { name: "Utilisateurs", href: "/users", icon: UserCircle, color: "from-sky-500 to-blue-500" },
      { name: "Alertes", href: "/alerts", icon: Bell, color: "from-red-500 to-rose-500" },
    ],
  },
]

const roleLabels: Record<string, string> = {
  admin: "Administrateur",
  vendeur: "Vendeur",
  gestionnaire: "Gestionnaire Stock",
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileDrawer({ open, onOpenChange }: Props) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const newAlerts = useAppStore((s) => s.alerts.filter((a) => a.status === "nouvelle").length)

  const groups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (user?.role === "vendeur" && item.href === "/users") return false
        return true
      }),
    }))
    .filter((g) => g.items.length > 0)

  const initials = user?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?"

  const handleNavigate = (href: string) => {
    onOpenChange(false)
    navigate(href)
  }

  const handleLogout = async () => {
    onOpenChange(false)
    await logout()
    navigate("/login")
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        hideClose
        className="p-0 w-[86%] max-w-[340px] flex flex-col bg-white"
      >
        <SheetTitle className="sr-only">Menu de navigation</SheetTitle>

        {/* Header avec gradient */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 gradient-primary" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_60%)]" />
          <div className="relative px-5 pt-6 pb-8 text-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-11 w-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/30">
                <Smartphone className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-base font-bold tracking-tight leading-none">GlobalTrack</p>
                <p className="text-[10px] font-medium text-white/70 mt-1 uppercase tracking-widest">
                  Mobile Manager
                </p>
              </div>
            </div>

            {user && (
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-white/95 flex items-center justify-center text-indigo-600 text-sm font-bold shadow-lg ring-2 ring-white/40">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{user.name}</p>
                  <p className="text-[11px] text-white/80 truncate">
                    {roleLabels[user.role] ?? user.role}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {groups.map((group, gi) => (
            <div key={group.label} className={cn(gi > 0 && "mt-5")}>
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = item.href === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(item.href)
                  const Icon = item.icon
                  const showBadge = item.href === "/alerts" && newAlerts > 0

                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => handleNavigate(item.href)}
                      className={cn(
                        "group relative w-full flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-200 cursor-pointer",
                        isActive
                          ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 shadow-sm"
                          : "text-slate-700 hover:bg-slate-50 active:bg-slate-100",
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-center justify-center h-9 w-9 rounded-xl shrink-0 transition-all",
                          isActive
                            ? `bg-gradient-to-br ${item.color} text-white shadow-md`
                            : "bg-slate-100 text-slate-600 group-hover:bg-slate-200",
                        )}
                      >
                        <Icon className="h-4.5 w-4.5" strokeWidth={2.2} />
                      </div>
                      <span className="flex-1 text-left truncate">{item.name}</span>
                      {showBadge && (
                        <span className="flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                          {newAlerts}
                        </span>
                      )}
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 transition-all",
                          isActive ? "text-indigo-500 translate-x-0" : "text-slate-300 -translate-x-1 group-hover:translate-x-0",
                        )}
                      />
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer / Logout */}
        <div className="border-t border-slate-100 p-3 pb-safe">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-red-50 text-red-500">
              <LogOut className="h-4.5 w-4.5" strokeWidth={2.2} />
            </div>
            <span className="flex-1 text-left">Déconnexion</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
