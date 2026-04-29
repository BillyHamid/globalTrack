import { Badge } from "@/components/ui/badge"
import type { PhoneStatus, PaymentStatus, AlertStatus } from "@/types"

const phoneStatusConfig: Record<PhoneStatus, { label: string; variant: "success" | "secondary" | "warning" | "info"; dot: string }> = {
  disponible: { label: "Disponible", variant: "success", dot: "bg-emerald-500" },
  vendu: { label: "Vendu", variant: "secondary", dot: "bg-slate-400" },
  credit: { label: "Crédit", variant: "warning", dot: "bg-amber-500" },
  sortie: { label: "Sortie", variant: "info", dot: "bg-blue-500" },
}

const paymentStatusConfig: Record<PaymentStatus, { label: string; variant: "success" | "warning" | "destructive"; dot: string }> = {
  paye: { label: "Payé", variant: "success", dot: "bg-emerald-500" },
  partiel: { label: "Partiel", variant: "warning", dot: "bg-amber-500" },
  impaye: { label: "Impayé", variant: "destructive", dot: "bg-red-500" },
}

const alertStatusConfig: Record<AlertStatus, { label: string; variant: "destructive" | "warning" | "success"; dot: string }> = {
  nouvelle: { label: "Nouvelle", variant: "destructive", dot: "bg-red-500" },
  vue: { label: "Vue", variant: "warning", dot: "bg-amber-500" },
  resolue: { label: "Résolue", variant: "success", dot: "bg-emerald-500" },
}

function BadgeWithDot({ label, variant, dot }: { label: string; variant: "success" | "secondary" | "warning" | "destructive" | "info"; dot: string }) {
  return (
    <Badge variant={variant} className="font-semibold">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </Badge>
  )
}

export function PhoneStatusBadge({ status }: { status: PhoneStatus }) {
  const config = phoneStatusConfig[status]
  return <BadgeWithDot label={config.label} variant={config.variant} dot={config.dot} />
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const config = paymentStatusConfig[status]
  return <BadgeWithDot label={config.label} variant={config.variant} dot={config.dot} />
}

export function AlertStatusBadge({ status }: { status: AlertStatus }) {
  const config = alertStatusConfig[status]
  return <BadgeWithDot label={config.label} variant={config.variant} dot={config.dot} />
}
