import { useNavigate, useLocation } from "react-router-dom"
import { Bell, LogOut, Search, ChevronRight, Menu } from "lucide-react"
import { useAuthStore } from "@/features/auth/store"
import { useAppStore } from "@/store"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const roleLabels: Record<string, string> = {
  admin: "Administrateur",
  vendeur: "Vendeur",
  gestionnaire: "Gestionnaire Stock",
}

const pageLabels: Record<string, string> = {
  "/": "Dashboard",
  "/stock": "Stock",
  "/sorties": "Sorties",
  "/sales": "Ventes",
  "/credits": "Crédits",
  "/clients": "Clients",
  "/users": "Utilisateurs",
  "/alerts": "Alertes",
}

interface Props {
  onOpenDrawer: () => void
}

export function Header({ onOpenDrawer }: Props) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const newAlerts = useAppStore((s) => s.alerts.filter((a) => a.status === "nouvelle").length)

  const initials = user?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?"

  const currentPage = Object.entries(pageLabels).find(([href]) =>
    href === "/" ? location.pathname === "/" : location.pathname.startsWith(href),
  )?.[1] ?? ""

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/80 backdrop-blur-xl border-b border-slate-200/80">
      {/* Mobile hamburger + page title */}
      <div className="flex items-center gap-2 min-w-0 lg:hidden">
        <button
          type="button"
          onClick={onOpenDrawer}
          className="flex items-center justify-center h-10 w-10 rounded-xl text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" strokeWidth={2.2} />
        </button>
        <h1 className="text-base font-bold text-slate-900 truncate">{currentPage}</h1>
      </div>

      {/* Desktop breadcrumb */}
      <div className="hidden lg:flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-400 font-medium">GlobalTrack</span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
          <span className="text-slate-900 font-semibold">{currentPage}</span>
        </div>
      </div>

      {/* Search bar (desktop only) */}
      <div className="hidden md:flex flex-1 max-w-md mx-8">
        <div className="relative w-full group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder="Recherche rapide…"
            className="w-full h-10 pl-10 pr-16 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-sm placeholder:text-slate-400 outline-none"
          />
          <kbd className="hidden lg:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-1 px-1.5 h-6 rounded-md bg-white border border-slate-200 text-[10px] font-medium text-slate-500">
            <span>⌘</span>K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        {/* Search icon on small screens */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-10 w-10 rounded-xl hover:bg-slate-100"
          aria-label="Rechercher"
        >
          <Search className="h-5 w-5 text-slate-600" />
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-xl hover:bg-slate-100"
          onClick={() => navigate("/alerts")}
          aria-label="Alertes"
        >
          <Bell className="h-5 w-5 text-slate-600" />
          {newAlerts > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
              {newAlerts}
            </span>
          )}
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 pl-1.5 pr-1.5 sm:pr-3 rounded-xl hover:bg-slate-100 flex items-center gap-2"
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback className="gradient-primary text-white text-xs font-bold shadow-glow">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-900 leading-tight">
                  {user?.name.split(" ")[0]}
                </p>
                <p className="text-[10px] text-slate-500 leading-tight">
                  {roleLabels[user?.role ?? ""]}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 rounded-xl shadow-premium" align="end">
            <DropdownMenuLabel className="px-3 py-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="gradient-primary text-white font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{user?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600 cursor-pointer focus:text-red-700 focus:bg-red-50 mx-1 rounded-lg"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
