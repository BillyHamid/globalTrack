import { useEffect, useState } from "react"
import { Cloud, CloudCheck, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DraftIndicatorProps {
  /** Watch value — when it changes, we briefly show "Saving…" then "Saved" */
  watch: unknown
  /** Called when user clicks "Réinitialiser" */
  onReset?: () => void
  className?: string
}

export function DraftIndicator({ watch, onReset, className }: DraftIndicatorProps) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle")

  useEffect(() => {
    setStatus("saving")
    const t1 = setTimeout(() => setStatus("saved"), 400)
    const t2 = setTimeout(() => setStatus("idle"), 2400)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [watch])

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 ${className ?? ""}`}
    >
      {status === "saving" ? (
        <>
          <Cloud className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
          <span>Enregistrement…</span>
        </>
      ) : (
        <>
          <CloudCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Brouillon enregistré</span>
        </>
      )}
      {onReset && (
        <>
          <span className="h-3 w-px bg-slate-300" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-5 px-1.5 -mr-1.5 text-[11px] font-medium text-slate-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-3 w-3 mr-0.5" />
            Réinitialiser
          </Button>
        </>
      )}
    </div>
  )
}
