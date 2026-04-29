import type { LucideIcon } from "lucide-react"
import { ArrowDownCircle, ShoppingCart, RotateCcw, DoorOpen, Home } from "lucide-react"

/** Affichage sécurisé d’un mouvement de stock (évite crash si type inconnu en base). */
export interface MovementVisual {
  label: string
  color: string
  icon: LucideIcon
}

const movementVisualMap: Record<string, MovementVisual> = {
  entree: { label: "Entrée en stock", color: "bg-emerald-500", icon: ArrowDownCircle },
  vente: { label: "Vente", color: "bg-blue-500", icon: ShoppingCart },
  retour: { label: "Retour", color: "bg-amber-500", icon: RotateCcw },
  sortie: { label: "Sortie (emprunt)", color: "bg-violet-500", icon: DoorOpen },
  retour_sortie: { label: "Retour de sortie", color: "bg-teal-500", icon: Home },
}

export function getMovementVisual(type: string): MovementVisual {
  return movementVisualMap[type] ?? {
    label: type ? `Mouvement (${type})` : "Mouvement",
    color: "bg-slate-500",
    icon: ArrowDownCircle,
  }
}
