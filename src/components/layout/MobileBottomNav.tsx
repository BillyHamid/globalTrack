import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard, Package, ShoppingCart, Users, MoreHorizontal,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  onMore: () => void
}

const items = [
  { name: "Accueil", href: "/", icon: LayoutDashboard, exact: true },
  { name: "Stock", href: "/stock", icon: Package },
  { name: "Ventes", href: "/sales", icon: ShoppingCart },
  { name: "Clients", href: "/clients", icon: Users },
]

export function MobileBottomNav({ onMore }: Props) {
  const location = useLocation()

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/90 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-4px_20px_-4px_rgba(15,23,42,0.08)] pb-safe">
      <div className="grid grid-cols-5 px-2 pt-2 pb-1">
        {items.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.href
            : location.pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl transition-all relative",
                isActive ? "text-indigo-600" : "text-slate-400 hover:text-slate-600 active:text-slate-700",
              )}
            >
              {isActive && (
                <span className="absolute top-0 h-1 w-8 rounded-full gradient-primary" />
              )}
              <div
                className={cn(
                  "flex items-center justify-center h-9 w-9 rounded-xl transition-all",
                  isActive ? "bg-indigo-50" : "bg-transparent",
                )}
              >
                <Icon
                  className={cn("h-5 w-5 transition-transform", isActive && "scale-110")}
                  strokeWidth={isActive ? 2.4 : 2}
                />
              </div>
              <span className={cn("text-[10px] font-medium leading-none", isActive && "font-semibold")}>
                {item.name}
              </span>
            </Link>
          )
        })}

        <button
          type="button"
          onClick={onMore}
          className="flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl text-slate-400 hover:text-slate-600 active:text-slate-700 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-center h-9 w-9 rounded-xl">
            <MoreHorizontal className="h-5 w-5" strokeWidth={2} />
          </div>
          <span className="text-[10px] font-medium leading-none">Plus</span>
        </button>
      </div>
    </nav>
  )
}
