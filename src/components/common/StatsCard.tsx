import type { LucideIcon } from "lucide-react"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: { value: number; label: string }
  className?: string
  iconColor?: string
  variant?: "default" | "primary" | "success" | "warning" | "danger"
}

const variantStyles = {
  default: {
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    accent: "from-slate-100/50 to-transparent",
  },
  primary: {
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    accent: "from-indigo-100/40 to-transparent",
  },
  success: {
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    accent: "from-emerald-100/40 to-transparent",
  },
  warning: {
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    accent: "from-amber-100/40 to-transparent",
  },
  danger: {
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    accent: "from-red-100/40 to-transparent",
  },
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  className,
  iconColor,
  variant = "default",
}: StatsCardProps) {
  const styles = variantStyles[variant]
  const isPositive = trend && trend.value >= 0

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-6 shadow-soft hover:shadow-premium transition-all duration-300",
        className,
      )}
    >
      {/* Background accent */}
      <div
        className={cn(
          "absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br opacity-60 transition-all duration-500 group-hover:scale-110",
          styles.accent,
        )}
      />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="space-y-2 min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {title}
          </p>
          <p className="text-3xl font-bold text-slate-900 tracking-tight truncate">
            {value}
          </p>
          {trend && (
            <div
              className={cn(
                "inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5",
                isPositive
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700",
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>
                {isPositive ? "+" : ""}
                {trend.value}%
              </span>
              <span className="text-slate-500 font-normal">{trend.label}</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "h-12 w-12 rounded-xl flex items-center justify-center shadow-sm shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3",
            styles.iconBg,
          )}
        >
          <Icon className={cn("h-6 w-6", iconColor || styles.iconColor)} />
        </div>
      </div>
    </div>
  )
}
