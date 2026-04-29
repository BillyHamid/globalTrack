import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Smartphone, Eye, EyeOff, Sparkles, Lock, Mail, ArrowRight, Loader2,
  TrendingUp, Package, ShieldCheck, Zap, BarChart3, CheckCircle2,
} from "lucide-react"
import { useAuthStore } from "@/features/auth/store"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    const success = await login(email, password)
    if (success) {
      navigate("/")
    } else {
      setError("Email ou mot de passe incorrect")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-slate-950">
      {/* ─── Animated background ─────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        {/* Mesh gradients */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-indigo-500/30 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/30 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: "10s", animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-pink-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: "12s", animationDelay: "2s" }} />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />

        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* ─── LEFT SIDE — Hero with floating product mockup ──────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 items-center justify-center p-12 xl:p-16">
        <div className="relative max-w-xl w-full">
          {/* Logo + brand */}
          <div className="flex items-center gap-3 mb-12 animate-fade-in">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl blur-xl opacity-60" />
              <div className="relative h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <p className="text-xl font-bold text-white tracking-tight">GlobalTrack</p>
              <p className="text-[10px] text-indigo-300 uppercase tracking-widest font-semibold">Mobile Manager</p>
            </div>
          </div>

          {/* Main headline */}
          <div className="space-y-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
              <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
              <span className="text-xs font-semibold text-white tracking-wide">Édition 2026 — Premium</span>
            </div>

            <h1 className="text-5xl xl:text-6xl font-bold tracking-tight text-white leading-[1.1] text-balance">
              Votre business mobile,{" "}
              <span className="bg-gradient-to-r from-indigo-300 via-pink-300 to-yellow-200 bg-clip-text text-transparent">
                à la perfection.
              </span>
            </h1>

            <p className="text-lg text-slate-300 leading-relaxed max-w-md text-balance">
              Stock, ventes, crédits, sorties — pilotez chaque opération avec une précision chirurgicale.
            </p>
          </div>

          {/* Floating product mockup */}
          <div className="relative mt-12 animate-fade-in" style={{ animationDelay: "300ms" }}>
            {/* Main dashboard card */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl blur-2xl opacity-40" />
              <div className="relative rounded-2xl bg-white/[0.07] backdrop-blur-xl border border-white/15 p-5 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Dashboard</p>
                      <p className="text-[10px] text-slate-400">Activité du jour</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-semibold text-emerald-300">Live</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5 mb-4">
                  {[
                    { label: "Stock", value: "127", icon: Package, color: "from-indigo-400 to-blue-500" },
                    { label: "Ventes", value: "23", icon: TrendingUp, color: "from-emerald-400 to-teal-500" },
                    { label: "Sécurité", value: "100%", icon: ShieldCheck, color: "from-amber-400 to-orange-500" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl bg-white/[0.05] border border-white/10 p-2.5">
                      <div className={`h-6 w-6 rounded-md bg-gradient-to-br ${stat.color} flex items-center justify-center mb-1.5`}>
                        <stat.icon className="h-3 w-3 text-white" />
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">{stat.label}</p>
                      <p className="text-sm font-bold text-white tabular-nums">{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Mini bar chart */}
                <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
                  <div className="flex items-end justify-between gap-1 h-16">
                    {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col gap-0.5">
                        <div
                          className="rounded-sm bg-gradient-to-t from-indigo-500 to-indigo-400"
                          style={{ height: `${h}%`, animationDelay: `${i * 100}ms` }}
                        />
                        <div
                          className="rounded-sm bg-gradient-to-t from-amber-500/60 to-amber-400/60"
                          style={{ height: `${h * 0.4}%` }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating notification card — top right */}
            <div className="absolute -top-6 -right-4 rounded-xl bg-white/[0.08] backdrop-blur-xl border border-white/20 p-3 shadow-2xl max-w-[200px] animate-fade-in" style={{ animationDelay: "600ms" }}>
              <div className="flex items-start gap-2">
                <div className="h-7 w-7 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white">Vente confirmée</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">iPhone 15 Pro · 850 000 FC</p>
                </div>
              </div>
            </div>

            {/* Floating speed card — bottom left */}
            <div className="absolute -bottom-6 -left-4 rounded-xl bg-white/[0.08] backdrop-blur-xl border border-white/20 p-3 shadow-2xl animate-fade-in" style={{ animationDelay: "800ms" }}>
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-yellow-300" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Temps réel</p>
                  <p className="text-xs font-bold text-white">~120ms</p>
                </div>
              </div>
            </div>
          </div>

          {/* Trust signals */}
          <div className="grid grid-cols-3 gap-3 mt-16 pt-8 border-t border-white/10 animate-fade-in" style={{ animationDelay: "500ms" }}>
            {[
              { value: "100%", label: "Traçable" },
              { value: "24/7", label: "Disponible" },
              { value: "SSL", label: "Sécurisé" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-white tracking-tight">{s.value}</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── RIGHT SIDE — Login form ────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile branding */}
          <div className="lg:hidden text-center mb-8 animate-fade-in">
            <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl items-center justify-center mb-4">
              <Smartphone className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">GlobalTrack</h1>
          </div>

          {/* Login card with glassmorphism */}
          <div className="relative animate-fade-in" style={{ animationDelay: "200ms" }}>
            <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500/30 via-purple-500/20 to-pink-500/30 rounded-3xl blur-xl opacity-70" />

            <div className="relative rounded-3xl bg-white/[0.08] backdrop-blur-2xl border border-white/15 p-8 lg:p-10 shadow-2xl">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white tracking-tight">
                  Bon retour 👋
                </h2>
                <p className="text-slate-400 mt-2">
                  Connectez-vous pour reprendre votre activité
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/30 backdrop-blur-sm px-4 py-3 flex items-start gap-3 animate-scale-in">
                    <div className="h-2 w-2 rounded-full bg-red-400 mt-2 shrink-0 animate-pulse" />
                    <p className="text-sm text-red-200 font-medium">{error}</p>
                  </div>
                )}

                {/* Email field */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Email
                  </label>
                  <div className={`relative transition-all duration-300 ${emailFocused ? "scale-[1.01]" : ""}`}>
                    <div
                      className={`absolute -inset-px rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 transition-opacity duration-300 ${
                        emailFocused ? "opacity-100" : "opacity-0"
                      }`}
                      style={{ filter: "blur(4px)" }}
                    />
                    <div className="relative">
                      <Mail
                        className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-300 ${
                          emailFocused ? "text-indigo-300" : "text-slate-500"
                        }`}
                      />
                      <input
                        id="email"
                        type="email"
                        placeholder="vous@exemple.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        required
                        autoComplete="email"
                        className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium placeholder:text-slate-500 placeholder:font-normal outline-none transition-all duration-300 focus:bg-white/[0.07] focus:border-indigo-400/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Password field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Mot de passe
                    </label>
                    <button
                      type="button"
                      className="text-xs font-semibold text-indigo-300 hover:text-indigo-200 transition-colors"
                    >
                      Oublié ?
                    </button>
                  </div>
                  <div className={`relative transition-all duration-300 ${passwordFocused ? "scale-[1.01]" : ""}`}>
                    <div
                      className={`absolute -inset-px rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 transition-opacity duration-300 ${
                        passwordFocused ? "opacity-100" : "opacity-0"
                      }`}
                      style={{ filter: "blur(4px)" }}
                    />
                    <div className="relative">
                      <Lock
                        className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-300 ${
                          passwordFocused ? "text-indigo-300" : "text-slate-500"
                        }`}
                      />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        required
                        autoComplete="current-password"
                        className="w-full h-12 pl-11 pr-12 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium placeholder:text-slate-500 placeholder:font-normal outline-none transition-all duration-300 focus:bg-white/[0.07] focus:border-indigo-400/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submit button with shimmer */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full h-12 rounded-xl overflow-hidden font-semibold text-white shadow-2xl shadow-indigo-500/30 transition-all duration-300 hover:shadow-indigo-500/50 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {/* Gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_100%] animate-shimmer-bg" />

                  {/* Shimmer effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

                  <span className="relative flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Connexion en cours…
                      </>
                    ) : (
                      <>
                        Se connecter
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </>
                    )}
                  </span>
                </button>

                {/* Divider */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                    <span className="bg-transparent px-3 text-slate-500 font-semibold">
                      Comptes de démo
                    </span>
                  </div>
                </div>

                {/* Demo accounts */}
                <div className="space-y-2">
                  {[
                    { email: "sana.djibrill@globaltrack.cd", role: "Admin", color: "from-indigo-500 to-purple-500" },
                    { email: "sana.mohamadi@globaltrack.cd", role: "Vendeur", color: "from-emerald-500 to-teal-500" },
                  ].map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => {
                        setEmail(acc.email)
                        setPassword("globaltrack2024")
                      }}
                      className="w-full group flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-white/20 transition-all"
                    >
                      <div
                        className={`h-8 w-8 rounded-lg bg-gradient-to-br ${acc.color} flex items-center justify-center shrink-0 shadow-lg`}
                      >
                        <span className="text-xs font-bold text-white">
                          {acc.role[0]}
                        </span>
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-xs font-mono text-white truncate">{acc.email}</p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {acc.role} · cliquer pour pré-remplir
                        </p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}

                  <div className="text-[10px] text-slate-500 text-center pt-2">
                    Mot de passe :{" "}
                    <span className="font-mono font-semibold text-slate-400">
                      globaltrack2024
                    </span>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Footer */}
          <p className="text-xs text-slate-500 text-center mt-6 animate-fade-in" style={{ animationDelay: "400ms" }}>
            © 2026 GlobalTrack — Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  )
}
