import { useMemo, useState } from "react"
import { Search, Package, Layers } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import type { Phone } from "@/types"

const COLOR_SWATCH: Record<string, string> = {
  noir: "#1f2937", noire: "#1f2937",
  blanc: "#e2e8f0", blanche: "#e2e8f0",
  bleu: "#3b82f6", bleue: "#3b82f6",
  rouge: "#ef4444",
  violet: "#8b5cf6", violette: "#8b5cf6",
  or: "#f59e0b",
  gris: "#9ca3af", grise: "#9ca3af",
  vert: "#10b981", verte: "#10b981",
  rose: "#ec4899",
  jaune: "#eab308",
  orange: "#f97316",
  argent: "#cbd5e1",
  titanium: "#94a3b8",
  naturel: "#d4a76a", naturelle: "#d4a76a",
  indigo: "#6366f1",
  black: "#1f2937",
  white: "#e2e8f0",
  blue: "#3b82f6",
  red: "#ef4444",
  gold: "#f59e0b",
  gray: "#9ca3af", grey: "#9ca3af",
  green: "#10b981",
  pink: "#ec4899",
  purple: "#8b5cf6",
  silver: "#cbd5e1",
}

function swatch(color: string): string {
  return COLOR_SWATCH[color.toLowerCase()] ?? "#94a3b8"
}

function barColor(color: string): string {
  const c = swatch(color)
  // white / argent → use slate so the bar is visible
  return c === "#e2e8f0" || c === "#cbd5e1" ? "#94a3b8" : c
}

interface StockGroup {
  key: string
  brand: string
  model: string
  capacity: string
  color: string
  count: number
}

interface Props {
  phones: Phone[]
}

const PAGE_SIZE = 10

export function StockBreakdownWidget({ phones }: Props) {
  const [search, setSearch] = useState("")
  const [brandFilter, setBrandFilter] = useState("all")
  const [shown, setShown] = useState(PAGE_SIZE)

  const groups = useMemo<StockGroup[]>(() => {
    const map = new Map<string, StockGroup>()
    for (const phone of phones) {
      if (phone.status !== "disponible") continue
      const key = `${phone.brand}|${phone.model}|${phone.capacity}|${phone.color}`
      const g = map.get(key)
      if (g) { g.count++; continue }
      map.set(key, { key, brand: phone.brand, model: phone.model, capacity: phone.capacity, color: phone.color, count: 1 })
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count)
  }, [phones])

  const brands = useMemo(
    () => [...new Set(groups.map((g) => g.brand))].sort(),
    [groups],
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return groups.filter((g) => {
      if (brandFilter !== "all" && g.brand !== brandFilter) return false
      if (!q) return true
      return (
        g.brand.toLowerCase().includes(q) ||
        g.model.toLowerCase().includes(q) ||
        g.capacity.toLowerCase().includes(q) ||
        g.color.toLowerCase().includes(q)
      )
    })
  }, [groups, search, brandFilter])

  const maxCount = filtered[0]?.count ?? 1
  const displayed = filtered.slice(0, shown)
  const hasMore = shown < filtered.length
  const totalAvailable = groups.reduce((s, g) => s + g.count, 0)

  if (groups.length === 0) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-soft overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
              <Layers className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Détail du stock disponible</h3>
              <p className="text-xs text-slate-500 mt-0.5">Répartition par modèle, capacité et couleur</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center px-6">
          <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Package className="h-7 w-7 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700">Aucun stock disponible</p>
          <p className="text-xs text-slate-500 mt-1">Ajoutez des appareils pour voir les analytics</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 shadow-soft overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-3 px-4 py-4 border-b border-slate-100 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
            <Layers className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-900">Détail du stock disponible</h3>
            <p className="text-xs text-slate-500 mt-0.5">Répartition par modèle, capacité et couleur</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-600 ring-1 ring-indigo-100">
            {groups.length} variante{groups.length > 1 ? "s" : ""}
          </span>
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 ring-1 ring-emerald-100">
            {totalAvailable} dispo
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 px-4 py-3 border-b border-slate-100 sm:flex-row sm:px-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Modèle, capacité, couleur..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShown(PAGE_SIZE) }}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Select value={brandFilter} onValueChange={(v) => { setBrandFilter(v); setShown(PAGE_SIZE) }}>
          <SelectTrigger className="h-8 w-full text-sm sm:w-[160px]">
            <SelectValue placeholder="Marque" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les marques</SelectItem>
            {brands.map((b) => (
              <SelectItem key={b} value={b}>{b}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-50">
        {displayed.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-slate-500">
            Aucun résultat pour cette recherche
          </div>
        ) : (
          displayed.map((g, i) => {
            const pct = Math.round((g.count / maxCount) * 100)
            const dot = swatch(g.color)
            const bar = barColor(g.color)
            const isFirst = i === 0 && !search.trim() && brandFilter === "all"

            return (
              <div
                key={g.key}
                className={`group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50/70 sm:px-6 ${isFirst ? "bg-indigo-50/25" : ""}`}
              >
                {/* Rank */}
                <span className="shrink-0 w-5 text-center text-[11px] font-bold text-slate-300 group-hover:text-slate-400 tabular-nums">
                  {i + 1}
                </span>

                {/* Color swatch dot */}
                <span
                  className="shrink-0 h-3.5 w-3.5 rounded-full border border-black/10 shadow-sm"
                  style={{ background: dot }}
                  title={g.color || "—"}
                />

                {/* Labels + bar */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                    <span className="text-sm font-semibold text-slate-800 leading-snug">
                      {g.brand} {g.model}
                    </span>
                    {g.capacity && (
                      <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500 leading-none">
                        {g.capacity}
                      </span>
                    )}
                    {g.color && (
                      <span className="text-[11px] text-slate-400 font-medium capitalize leading-none">
                        {g.color}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${pct}%`, background: bar }}
                    />
                  </div>
                </div>

                {/* Count */}
                <div className="shrink-0 flex flex-col items-end ml-1">
                  <span className="text-lg font-bold text-slate-900 leading-none tabular-nums">{g.count}</span>
                  <span className="text-[10px] text-slate-400 font-medium mt-0.5">dispo</span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/40 sm:px-6">
        <span className="text-xs text-slate-400">
          {Math.min(shown, filtered.length)} / {filtered.length} variante{filtered.length > 1 ? "s" : ""}
        </span>
        {hasMore ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
            onClick={() => setShown((s) => s + PAGE_SIZE)}
          >
            Voir {Math.min(PAGE_SIZE, filtered.length - shown)} de plus
          </Button>
        ) : shown > PAGE_SIZE ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100"
            onClick={() => setShown(PAGE_SIZE)}
          >
            Réduire
          </Button>
        ) : null}
      </div>
    </div>
  )
}
