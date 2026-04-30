import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Smartphone, Eye, EyeOff, Lock, Mail, ArrowRight, Loader2,
  TrendingUp, Package, ShieldCheck, BarChart3, CheckCircle2,
  Star, Globe, Activity,
} from "lucide-react"
import { useAuthStore } from "@/features/auth/store"

const ORBS = [
  { size: 700, color: "bg-indigo-600/25", top: "-10%", left: "-5%", delay: "0s", duration: "18s" },
  { size: 600, color: "bg-purple-600/20", top: "60%", left: "60%", delay: "3s", duration: "22s" },
  { size: 500, color: "bg-blue-500/15", top: "30%", left: "40%", delay: "6s", duration: "20s" },
  { size: 400, color: "bg-pink-500/10", top: "70%", left: "10%", delay: "9s", duration: "25s" },
]

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  size: Math.random() * 3 + 1,
  x: Math.random() * 100,
  y: Math.random() * 100,
  delay: Math.random() * 5,
  duration: Math.random() * 3 + 4,
}))

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

  const prefillAccount = (acc: { email: string }) => {
    setEmail(acc.email)
    setPassword("globaltrack2024")
    setError("")
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-[#070b18]">
      {/* ─── Aurora background ─────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        {ORBS.map((orb, i) => (
          <div
            key={i}
            className={`absolute rounded-full ${orb.color} blur-[120px] animate-aurora`}
            style={{
              width: orb.size,
              height: orb.size,
              top: orb.top,
              left: orb.left,
              animationDelay: orb.delay,
              animationDuration: orb.duration,
            }}
          />
        ))}

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Particles */}
        {PARTICLES.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full bg-white/20"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
              animation: `gradient-shift ${p.duration}s ease-in-out ${p.delay}s infinite`,
            }}
          />
        ))}

        {/* Radial vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(7,11,24,0.6)_70%)]" />
      </div>

      {/* ─── LEFT — Showcase ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] relative z-10 items-center justify-center p-12 xl:p-20">
        <div className="relative max-w-xl w-full">
          {/* Brand */}
          <div className="flex items-center gap-4 mb-14 animate-fade-in">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl blur-xl opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-2xl ring-1 ring-white/20">
                <Smartphone className="h-7 w-7 text-white" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-white tracking-tight">GlobalTrack</p>
              <p className="text-[11px] text-indigo-300/80 uppercase tracking-[0.2em] font-semibold">Mobile Manager</p>
            </div>
          </div>

          {/* Headline */}
          <div className="space-y-7 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/10 shadow-lg shadow-indigo-500/5">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-slate-200 tracking-wide">Plateforme active — v2.0</span>
            </div>

            <h1 className="text-[3.2rem] xl:text-[3.8rem] font-extrabold tracking-tight text-white leading-[1.08]">
              Gérez votre stock{" "}
              <span className="relative">
                <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                  avec excellence.
                </span>
                <span className="absolute -bottom-2 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full opacity-60" />
              </span>
            </h1>

            <p className="text-lg text-slate-400 leading-relaxed max-w-md font-light">
              Une solution complète pour le suivi de stock, les ventes, les crédits et les sorties —
              conçue pour les professionnels du mobile.
            </p>
          </div>

          {/* Dashboard mockup */}
          <div className="relative mt-14 animate-fade-in animate-float" style={{ animationDelay: "300ms" }}>
            <div className="absolute -inset-4 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent rounded-3xl blur-2xl" />

            <div className="relative rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] p-6 shadow-[0_20px_60px_-15px_rgba(79,70,229,0.3)]">
              {/* Mockup header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ring-1 ring-white/10">
                    <BarChart3 className="h-4.5 w-4.5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Tableau de bord</p>
                    <p className="text-[10px] text-slate-500">Mise à jour en temps réel</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <Activity className="h-3 w-3 text-emerald-400" />
                  <span className="text-[10px] font-bold text-emerald-300">En ligne</span>
                </div>
              </div>

              {/* KPI row */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: "En stock", value: "127", sub: "+12 ce mois", icon: Package, gradient: "from-indigo-500/20 to-indigo-600/10", accent: "text-indigo-300", border: "border-indigo-500/15" },
                  { label: "Ventes", value: "23", sub: "+8.2%", icon: TrendingUp, gradient: "from-emerald-500/20 to-emerald-600/10", accent: "text-emerald-300", border: "border-emerald-500/15" },
                  { label: "Fiabilité", value: "99.9%", sub: "Uptime", icon: ShieldCheck, gradient: "from-amber-500/20 to-amber-600/10", accent: "text-amber-300", border: "border-amber-500/15" },
                ].map((stat) => (
                  <div key={stat.label} className={`rounded-xl bg-gradient-to-br ${stat.gradient} border ${stat.border} p-3`}>
                    <stat.icon className={`h-4 w-4 ${stat.accent} mb-2`} />
                    <p className="text-lg font-bold text-white tabular-nums">{stat.value}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[10px] text-slate-400">{stat.label}</p>
                      <p className={`text-[10px] font-semibold ${stat.accent}`}>{stat.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chart bars */}
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Ventes mensuelles</p>
                  <p className="text-[10px] text-indigo-300 font-bold">6 derniers mois</p>
                </div>
                <div className="flex items-end gap-1.5 h-20">
                  {[35, 52, 45, 68, 58, 82, 72, 95, 65, 78, 88, 70].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-sm overflow-hidden" style={{ height: `${h}%` }}>
                      <div className="w-full h-full bg-gradient-to-t from-indigo-600/80 to-indigo-400/60 hover:from-indigo-500 hover:to-indigo-300 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating cards */}
            <div className="absolute -top-5 -right-6 rounded-xl bg-white/[0.08] backdrop-blur-xl border border-white/15 p-3.5 shadow-2xl animate-fade-in" style={{ animationDelay: "700ms" }}>
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/15 flex items-center justify-center ring-1 ring-emerald-500/20">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Vente confirmée</p>
                  <p className="text-[10px] text-slate-400">iPhone 15 Pro · $850</p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-6 rounded-xl bg-white/[0.08] backdrop-blur-xl border border-white/15 p-3.5 shadow-2xl animate-fade-in" style={{ animationDelay: "900ms" }}>
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-purple-500/15 flex items-center justify-center ring-1 ring-purple-500/20">
                  <Star className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Satisfaction</p>
                  <p className="text-sm font-bold text-white">4.9/5</p>
                </div>
              </div>
            </div>
          </div>

          {/* Trust row */}
          <div className="grid grid-cols-3 gap-6 mt-20 pt-8 border-t border-white/[0.06] animate-fade-in" style={{ animationDelay: "500ms" }}>
            {[
              { icon: ShieldCheck, value: "SSL 256-bit", label: "Chiffrement" },
              { icon: Globe, value: "24/7", label: "Disponibilité" },
              { icon: Activity, value: "< 100ms", label: "Latence" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <s.icon className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-sm font-bold text-white">{s.value}</p>
                  <p className="text-[10px] text-slate-500 font-medium">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── RIGHT — Login form ────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16 relative z-10">
        <div className="w-full max-w-[420px]">
          {/* Mobile brand */}
          <div className="lg:hidden text-center mb-10 animate-fade-in">
            <div className="relative inline-flex">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl blur-xl opacity-60" />
              <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-2xl ring-1 ring-white/20">
                <Smartphone className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mt-5">GlobalTrack</h1>
            <p className="text-sm text-slate-400 mt-1">Mobile Manager</p>
          </div>

          {/* Card */}
          <div className="relative animate-fade-in" style={{ animationDelay: "200ms" }}>
            {/* Outer glow */}
            <div className="absolute -inset-px rounded-[28px] bg-gradient-to-br from-indigo-500/40 via-purple-500/20 to-pink-500/30 opacity-60 blur-sm" />
            <div className="absolute -inset-3 rounded-[32px] bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 blur-xl" />

            <div className="relative rounded-[28px] bg-white/[0.06] backdrop-blur-2xl border border-white/[0.1] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)]">
              {/* Card header accent line */}
              <div className="h-[2px] rounded-t-[28px] bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />

              <div className="p-8 lg:p-10">
                <div className="mb-9">
                  <h2 className="text-[1.75rem] font-bold text-white tracking-tight leading-tight">
                    Connectez-vous
                  </h2>
                  <p className="text-slate-400 mt-2 text-[15px]">
                    Accédez à votre espace de gestion
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="rounded-xl bg-red-500/[0.08] border border-red-500/20 px-4 py-3.5 flex items-center gap-3 animate-scale-in">
                      <div className="h-5 w-5 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
                        <div className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                      </div>
                      <p className="text-sm text-red-200/90 font-medium">{error}</p>
                    </div>
                  )}

                  {/* Email */}
                  <div className="space-y-2.5">
                    <label htmlFor="email" className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.12em]">
                      Adresse email
                    </label>
                    <div className={`relative transition-all duration-300 ${emailFocused ? "scale-[1.01]" : ""}`}>
                      <div
                        className={`absolute -inset-[1px] rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 transition-opacity duration-500 ${
                          emailFocused ? "opacity-100" : "opacity-0"
                        }`}
                      />
                      <div className="relative">
                        <Mail
                          className={`absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] transition-all duration-300 ${
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
                          className="w-full h-[52px] pl-12 pr-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm font-medium placeholder:text-slate-600 outline-none transition-all duration-300 focus:bg-white/[0.07]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="password" className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.12em]">
                        Mot de passe
                      </label>
                      <button type="button" className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                        Mot de passe oublié ?
                      </button>
                    </div>
                    <div className={`relative transition-all duration-300 ${passwordFocused ? "scale-[1.01]" : ""}`}>
                      <div
                        className={`absolute -inset-[1px] rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 transition-opacity duration-500 ${
                          passwordFocused ? "opacity-100" : "opacity-0"
                        }`}
                      />
                      <div className="relative">
                        <Lock
                          className={`absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] transition-all duration-300 ${
                            passwordFocused ? "text-indigo-300" : "text-slate-500"
                          }`}
                        />
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onFocus={() => setPasswordFocused(true)}
                          onBlur={() => setPasswordFocused(false)}
                          required
                          autoComplete="current-password"
                          className="w-full h-[52px] pl-12 pr-14 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm font-medium placeholder:text-slate-600 outline-none transition-all duration-300 focus:bg-white/[0.07]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={loading}
                      className="group relative w-full h-[52px] rounded-xl overflow-hidden font-semibold text-white transition-all duration-300 hover:scale-[1.015] active:scale-[0.985] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_100%] animate-shimmer-bg" />
                      <div className="absolute inset-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]" />
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/[0.12] to-transparent translate-x-[-100%] group-hover:translate-x-[100%] [transition:transform_0.8s]" />
                      <span className="relative flex items-center justify-center gap-2.5 text-[15px]">
                        {loading ? (
                          <>
                            <Loader2 className="h-4.5 w-4.5 animate-spin" />
                            Connexion…
                          </>
                        ) : (
                          <>
                            Se connecter
                            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                          </>
                        )}
                      </span>
                    </button>
                  </div>

                  {/* Separator */}
                  <div className="relative py-3">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/[0.06]" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-4 text-[10px] uppercase tracking-[0.15em] text-slate-500 font-semibold bg-transparent">
                        Accès rapide
                      </span>
                    </div>
                  </div>

                  {/* Demo accounts */}
                  <div className="space-y-2.5">
                    {[
                      { email: "sana.djibrill@globaltrack.cd", role: "Administrateur", initials: "SD", gradient: "from-indigo-500 to-purple-600", ring: "ring-indigo-500/30" },
                      { email: "sana.mohamadi@globaltrack.cd", role: "Vendeur", initials: "SM", gradient: "from-emerald-500 to-teal-600", ring: "ring-emerald-500/30" },
                      { email: "bernadette@globaltrack.cd", role: "Vendeur", initials: "BE", gradient: "from-amber-500 to-orange-600", ring: "ring-amber-500/30" },
                    ].map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => prefillAccount(acc)}
                        className="w-full group flex items-center gap-3.5 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300"
                      >
                        <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${acc.gradient} flex items-center justify-center shrink-0 shadow-lg ring-1 ${acc.ring}`}>
                          <span className="text-[11px] font-bold text-white">{acc.initials}</span>
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-[13px] font-medium text-slate-200 truncate group-hover:text-white transition-colors">{acc.email}</p>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5">{acc.role}</p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    ))}

                    <p className="text-[10px] text-slate-600 text-center pt-2 select-all">
                      Mot de passe : <span className="font-mono font-semibold text-slate-400">globaltrack2024</span>
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-[11px] text-slate-600 text-center mt-8 animate-fade-in" style={{ animationDelay: "500ms" }}>
            © 2026 GlobalTrack · Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  )
}
