import { Search, Smartphone, Check, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Phone } from "@/types"

interface PhoneSelectorProps {
  phones: Phone[]
  selectedPhoneId: string
  onSelect: (phoneId: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

const brandColors: Record<string, string> = {
  Apple: "from-slate-700 to-slate-900",
  Samsung: "from-blue-600 to-indigo-700",
  Xiaomi: "from-orange-500 to-red-600",
  Huawei: "from-red-500 to-pink-600",
  Tecno: "from-violet-500 to-purple-600",
  Infinix: "from-cyan-500 to-blue-600",
  default: "from-indigo-500 to-purple-600",
}

function getBrandGradient(brand: string): string {
  return brandColors[brand] ?? brandColors.default
}

export function PhoneSelector({
  phones,
  selectedPhoneId,
  onSelect,
  searchQuery,
  onSearchChange,
}: PhoneSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-slate-700">Téléphone emprunté</Label>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
          <Sparkles className="h-3 w-3 text-indigo-500" />
          {phones.length} disponible{phones.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Search bar */}
      <div className="relative group">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        <Input
          className="pl-10 h-11"
          placeholder="Rechercher par marque, modèle ou IMEI…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Phone grid */}
      {phones.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/40 p-10 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-3">
            <Smartphone className="h-7 w-7 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700">Aucun téléphone disponible</p>
          <p className="text-xs text-slate-500 mt-1">
            Tous les appareils sont en stock ou en sortie
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
          {phones.map((phone) => {
            const isSelected = selectedPhoneId === phone.id
            const gradient = getBrandGradient(phone.brand)
            return (
              <button
                key={phone.id}
                type="button"
                onClick={() => onSelect(phone.id)}
                className={`group relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-300 ${
                  isSelected
                    ? "bg-white border-2 border-indigo-500 shadow-glow"
                    : "bg-white border-2 border-slate-200 hover:border-slate-300 hover:shadow-elevated"
                }`}
              >
                {/* Top gradient accent for selected */}
                {isSelected && (
                  <div className="absolute top-0 left-0 right-0 h-1 gradient-primary" />
                )}

                <div className="flex items-start gap-3">
                  {/* Phone icon with brand color */}
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-sm transition-transform duration-300 group-hover:scale-105`}
                  >
                    <Smartphone className="h-5 w-5 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-900 truncate">
                          {phone.brand}
                        </p>
                        <p className="text-xs text-slate-600 font-medium truncate">
                          {phone.model}
                        </p>
                      </div>

                      {/* Selection indicator */}
                      <div
                        className={`flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-300 ${
                          isSelected
                            ? "h-5 w-5 bg-indigo-600 shadow-glow"
                            : "h-5 w-5 border-2 border-slate-300 group-hover:border-indigo-300"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                      </div>
                    </div>

                    {/* Specs chips */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {phone.capacity}
                      </span>
                      <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {phone.color}
                      </span>
                    </div>

                    {/* IMEI */}
                    <p className="mt-2 font-mono text-[11px] text-slate-500 truncate">
                      {phone.imei}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Selection summary */}
      {selectedPhoneId && phones.find((p) => p.id === selectedPhoneId) && (
        <div className="rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/60 p-3 flex items-center gap-3 animate-scale-in">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg gradient-primary shadow-glow">
            <Check className="h-4 w-4 text-white" strokeWidth={3} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900">
              {phones.find((p) => p.id === selectedPhoneId)?.brand}{" "}
              {phones.find((p) => p.id === selectedPhoneId)?.model}
            </p>
            <p className="text-xs text-slate-600 font-mono truncate">
              {phones.find((p) => p.id === selectedPhoneId)?.imei}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
