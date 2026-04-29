import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface PaymentProgressProps {
  total: number
  paid: number
  className?: string
  showLabels?: boolean
}

export function PaymentProgress({ total, paid, className, showLabels = true }: PaymentProgressProps) {
  const percentage = total > 0 ? Math.round((paid / total) * 100) : 0
  const remaining = total - paid

  return (
    <div className={cn("space-y-2", className)}>
      {showLabels && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {formatCurrency(paid)} / {formatCurrency(total)}
          </span>
          <span className="font-medium">{percentage}%</span>
        </div>
      )}
      <Progress
        value={percentage}
        className={cn(
          "h-2",
          percentage === 100 ? "[&>div]:bg-emerald-500" :
          percentage > 50 ? "[&>div]:bg-blue-500" :
          percentage > 0 ? "[&>div]:bg-amber-500" :
          "[&>div]:bg-red-500"
        )}
      />
      {showLabels && remaining > 0 && (
        <p className="text-xs text-muted-foreground">Reste: {formatCurrency(remaining)}</p>
      )}
    </div>
  )
}
