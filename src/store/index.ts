/**
 * Store global — façade vers le backend REST API
 *
 * Stratégie : les actions appellent l'API, puis synchronisent l'état local.
 * L'interface (useAppStore) est conservée à l'identique pour ne pas modifier
 * les composants existants. Les méthodes asynchrones retournent une promesse.
 */

import { create } from "zustand"
import type {
  Phone, Sale, Client, StockMovement, Alert, ActivityLog, Payment, PhoneExit,
} from "@/types"
import axios from "axios"
import {
  dashboardBundleApi,
  DEFAULT_LIST_LIMIT,
  phonesApi,
  salesApi,
  clientsApi,
  alertsApi,
  movementsApi,
  sortiesApi,
} from "@/api"
import type { DashboardBundle } from "@/api"
import { mockUsers } from "@/mock/data"

const ALERTS_REFRESH_TTL_MS = 30_000
let refreshAlertsInFlight: Promise<void> | null = null
let lastAlertsRefreshAt = 0

function extractAxiosError(e: unknown): string | undefined {
  if (axios.isAxiosError(e) && e.response?.data && typeof e.response.data === "object") {
    const d = e.response.data as { error?: string }
    if (typeof d.error === "string") return d.error
  }
}

interface AppStore {
  // ─── État ────────────────────────────────────────────────────────────────
  phones: Phone[]
  sales: Sale[]
  clients: Client[]
  movements: StockMovement[]
  alerts: Alert[]
  sorties: PhoneExit[]
  activityLogs: ActivityLog[]
  loading: boolean
  initialized: boolean

  // ─── Initialisation ───────────────────────────────────────────────────────
  loadAll: () => Promise<void>
  /** Hydrate l’état depuis GET /api/dashboard (bundle unique). */
  hydrateFromBundle: (bundle: DashboardBundle) => void
  /** Après logout : vider le cache applicatif local. */
  resetSession: () => void

  // ─── Phone ────────────────────────────────────────────────────────────────
  addPhone: (phone: Omit<Phone, "id" | "status" | "addedAt">, userId: string) => Promise<Phone>
  updatePhone: (id: string, data: Partial<Phone>) => Promise<void>
  deletePhone: (id: string, userId: string) => Promise<{ ok: boolean; error?: string }>
  /** Charge un téléphone par id (hors fenêtre du bundle) et fusionne ventes / stock local */
  fetchPhoneById: (id: string) => Promise<Phone | null>

  /** Charge une vente par id avec paiements complets (incluant depositProof) et met à jour le store */
  fetchSaleById: (id: string) => Promise<Sale | null>

  // ─── Sale ─────────────────────────────────────────────────────────────────
  createSale: (data: {
    phoneId: string; clientId: string; sellerId: string
    type: "cash" | "credit"
    listPriceAtSale?: number
    totalAmount: number; paidAmount: number; dueDate?: string
    paymentMethod?: string
    depositProof?: string
  }) => Promise<Sale>
  addPayment: (
    saleId: string,
    params: { amount: number; method: string; depositProof?: string },
  ) => Promise<Payment | null>
  updatePaymentDepositProof: (saleId: string, paymentId: string, depositProof: string) => Promise<Payment | null>
  softCancelSale: (saleId: string) => Promise<{ ok: boolean; error?: string }>
  deleteSale: (saleId: string) => Promise<{ ok: boolean; error?: string }>
  verifySale: (saleId: string, data: { status: 'approuve' | 'anomalie'; comment?: string }) => Promise<{ ok: boolean; error?: string }>

  // ─── Client ───────────────────────────────────────────────────────────────
  addClient: (data: Omit<Client, "id" | "createdAt" | "totalPurchases" | "totalDebt">) => Promise<Client>
  updateClient: (id: string, data: Partial<Client>) => Promise<void>

  // ─── Alert ────────────────────────────────────────────────────────────────
  markAlertViewed: (id: string) => Promise<void>
  resolveAlert: (id: string) => Promise<void>
  refreshAlerts: () => Promise<void>

  // ─── Sorties ──────────────────────────────────────────────────────────────
  createSortie: (data: { clientId: string; phoneId: string; motif: string }) => Promise<PhoneExit>
  returnSortie: (id: string, opts?: { notes?: string; returnProof?: string }) => Promise<PhoneExit>

  // ─── Computed ─────────────────────────────────────────────────────────────
  getPhone: (id: string) => Phone | undefined
  getSale: (id: string) => Sale | undefined
  getClient: (id: string) => Client | undefined
  getUser: (id: string) => typeof mockUsers[number] | undefined
  getPhoneMovements: (phoneId: string) => StockMovement[]
  getClientSales: (clientId: string) => Sale[]
  getClientDebt: (clientId: string) => number
  getAvailablePhones: () => Phone[]
  getActiveCredits: () => Sale[]
  getOverdueCredits: () => Sale[]
  getStockByBrand: () => { name: string; value: number }[]
  getNewAlertsCount: () => number
  isIMEIUnique: (imei: string, excludePhoneId?: string) => boolean
}

export const useAppStore = create<AppStore>((set, get) => ({
  phones: [],
  sales: [],
  clients: [],
  movements: [],
  alerts: [],
  sorties: [],
  activityLogs: [],
  loading: false,
  initialized: false,

  // ─── Initialisation ───────────────────────────────────────────────────────
  hydrateFromBundle: (bundle) => {
    const movements = bundle.movements.map((m) => {
      const pb = m.performedBy as unknown
      const performedBy =
        typeof pb === "string"
          ? pb
          : pb && typeof pb === "object" && pb !== null && "id" in pb
            ? String((pb as { id: string }).id)
            : (m as { performedById?: string }).performedById ?? ""
      return { ...m, performedBy } as StockMovement
    })
    set({
      phones: bundle.phones,
      sales: bundle.sales,
      clients: bundle.clients,
      movements,
      alerts: bundle.alerts,
      sorties: bundle.sorties,
      initialized: true,
      loading: false,
    })
  },

  resetSession: () => {
    set({
      phones: [],
      sales: [],
      clients: [],
      movements: [],
      alerts: [],
      sorties: [],
      activityLogs: [],
      initialized: false,
      loading: false,
    })
  },

  loadAll: async () => {
    if (get().loading) return
    set({ loading: true })
    try {
      const { data } = await dashboardBundleApi.get({ limit: DEFAULT_LIST_LIMIT })
      get().hydrateFromBundle(data)
    } finally {
      set({ loading: false })
    }
  },

  // ─── Phone ────────────────────────────────────────────────────────────────
  addPhone: async (data, _userId) => {
    const res = await phonesApi.create(data as Parameters<typeof phonesApi.create>[0])
    const phone = res.data
    set(s => ({ phones: [phone, ...s.phones] }))
    return phone
  },

  updatePhone: async (id, data) => {
    const res = await phonesApi.update(id, data)
    set(s => ({ phones: s.phones.map(p => p.id === id ? res.data : p) }))
  },

  deletePhone: async (id, _userId) => {
    try {
      await phonesApi.delete(id)
      set(s => ({
        phones: s.phones.filter(p => p.id !== id),
        movements: s.movements.filter(m => m.phoneId !== id),
      }))
      return { ok: true }
    } catch (e) {
      return { ok: false, error: extractAxiosError(e) }
    }
  },

  fetchPhoneById: async (id) => {
    try {
      const res = await phonesApi.get(id)
      const data = res.data
      const embeddedSales = data.sales ?? []
      const { movements: _mov, sales: _sales, ...phoneRest } = data
      const phone = phoneRest as Phone
      set(s => ({
        phones: s.phones.some(p => p.id === id)
          ? s.phones.map(p => (p.id === id ? phone : p))
          : [phone, ...s.phones],
        sales: [
          ...embeddedSales,
          ...s.sales.filter(sl => !embeddedSales.some((e) => e.id === sl.id)),
        ],
      }))
      try {
        const movRes = await movementsApi.list({ limit: DEFAULT_LIST_LIMIT })
        set({ movements: movRes.data.data })
      } catch {
        /* le téléphone est chargé même si les mouvements ne se rafraîchissent pas */
      }
      return phone
    } catch {
      return null
    }
  },

  fetchSaleById: async (id) => {
    try {
      const res = await salesApi.get(id)
      const sale = res.data as Sale
      set(s => ({
        sales: s.sales.some(sl => sl.id === id)
          ? s.sales.map(sl => sl.id === id ? { ...sl, ...sale } : sl)
          : [sale, ...s.sales],
      }))
      return sale
    } catch {
      return null
    }
  },

  // ─── Sale ─────────────────────────────────────────────────────────────────
  createSale: async (data) => {
    const res = await salesApi.create({
      phoneId: data.phoneId,
      clientId: data.clientId,
      type: data.type,
      listPriceAtSale: data.listPriceAtSale,
      totalAmount: data.totalAmount,
      paidAmount: data.paidAmount,
      dueDate: data.dueDate,
      paymentMethod: data.paymentMethod,
      depositProof: data.depositProof,
    })
    const sale = res.data

    // Mettre à jour le statut du téléphone en local
    const newPhoneStatus = data.type === "cash" || sale.remainingAmount <= 0 ? "vendu" : "credit"
    set(s => ({
      sales: [sale, ...s.sales],
      phones: s.phones.map(p => p.id === data.phoneId ? { ...p, status: newPhoneStatus as Phone["status"] } : p),
      clients: s.clients.map(c =>
        c.id === data.clientId
          ? { ...c, totalPurchases: c.totalPurchases + 1, totalDebt: c.totalDebt + (sale.remainingAmount ?? 0) }
          : c
      ),
    }))
    return sale
  },

  addPayment: async (saleId, params) => {
    try {
      const { amount, method, depositProof } = params
      const res = await salesApi.addPayment(saleId, {
        amount,
        method,
        ...(depositProof ? { depositProof } : {}),
      })
      const { payment, sale: updatedSale } = res.data

      set(s => ({
        sales: s.sales.map(sl =>
          sl.id === saleId
            ? { ...sl, ...updatedSale, payments: [...(sl.payments ?? []), payment] }
            : sl
        ),
        phones: updatedSale.paymentStatus === "paye"
          ? s.phones.map(p => p.id === updatedSale.phoneId ? { ...p, status: "vendu" as const } : p)
          : s.phones,
        clients: s.clients.map(c =>
          c.id === updatedSale.clientId
            ? { ...c, totalDebt: Math.max(0, c.totalDebt - amount) }
            : c
        ),
      }))
      return payment
    } catch {
      return null
    }
  },

  updatePaymentDepositProof: async (saleId, paymentId, depositProof) => {
    try {
      const res = await salesApi.updatePaymentDepositProof(saleId, paymentId, { depositProof })
      const updated = res.data
      set(s => ({
        sales: s.sales.map(sl =>
          sl.id === saleId
            ? {
                ...sl,
                payments: (sl.payments ?? []).map(p => (p.id === paymentId ? { ...p, ...updated } : p)),
              }
            : sl,
        ),
      }))
      return updated
    } catch {
      return null
    }
  },

  softCancelSale: async (saleId) => {
    try {
      const res = await salesApi.softCancel(saleId)
      const updated = res.data
      set(s => ({
        sales: s.sales.map(sl => sl.id === saleId ? { ...sl, ...updated } : sl),
        phones: s.phones.map(p => p.id === updated.phoneId ? { ...p, status: "disponible" as const } : p),
        clients: s.clients.map(c =>
          c.id === updated.clientId
            ? { ...c, totalPurchases: Math.max(0, c.totalPurchases - 1) }
            : c
        ),
      }))
      return { ok: true }
    } catch (e) {
      return { ok: false, error: extractAxiosError(e) }
    }
  },

  verifySale: async (saleId, data) => {
    try {
      const res = await salesApi.verify(saleId, data)
      const updated = res.data
      set(s => ({
        sales: s.sales.map(sl => sl.id === saleId ? { ...sl, ...updated } : sl),
      }))
      return { ok: true }
    } catch (e) {
      return { ok: false, error: extractAxiosError(e) }
    }
  },

  deleteSale: async (saleId) => {
    try {
      const sale = get().sales.find(s => s.id === saleId)
      await salesApi.delete(saleId)
      const shouldRestoreStock = sale != null && sale.status !== "annulée"
      set(s => ({
        sales: s.sales.filter(sl => sl.id !== saleId),
        phones: shouldRestoreStock
          ? s.phones.map(p => p.id === sale!.phoneId ? { ...p, status: "disponible" as const } : p)
          : s.phones,
        clients: shouldRestoreStock
          ? s.clients.map(c =>
              c.id === sale!.clientId
                ? { ...c, totalPurchases: Math.max(0, c.totalPurchases - 1) }
                : c
            )
          : s.clients,
      }))
      try {
        const movementsRes = await movementsApi.list({ limit: DEFAULT_LIST_LIMIT })
        set({ movements: movementsRes.data.data })
      } catch {
        /* la vente est supprimée même si le rafraîchissement des mouvements échoue */
      }
      return { ok: true }
    } catch (e) {
      return { ok: false, error: extractAxiosError(e) }
    }
  },

  // ─── Client ───────────────────────────────────────────────────────────────
  addClient: async (data) => {
    const res = await clientsApi.create(data)
    const client = res.data
    set(s => ({ clients: [client, ...s.clients] }))
    return client
  },

  updateClient: async (id, data) => {
    const res = await clientsApi.update(id, data)
    set(s => ({ clients: s.clients.map(c => c.id === id ? { ...c, ...res.data } : c) }))
  },

  // ─── Alert ────────────────────────────────────────────────────────────────
  markAlertViewed: async (id) => {
    await alertsApi.update(id, "vue")
    set(s => ({ alerts: s.alerts.map(a => a.id === id ? { ...a, status: "vue" as const } : a) }))
  },

  resolveAlert: async (id) => {
    await alertsApi.update(id, "resolue")
    set(s => ({ alerts: s.alerts.map(a => a.id === id ? { ...a, status: "resolue" as const } : a) }))
  },

  refreshAlerts: async () => {
    if (refreshAlertsInFlight) return refreshAlertsInFlight

    const now = Date.now()
    const isStale = now - lastAlertsRefreshAt > ALERTS_REFRESH_TTL_MS
    const hasNoData = get().alerts.length === 0
    if (!isStale && !hasNoData) return

    refreshAlertsInFlight = (async () => {
      try {
        await alertsApi.refresh()
        lastAlertsRefreshAt = Date.now()
      } finally {
        refreshAlertsInFlight = null
      }

      const res = await alertsApi.list()
      set({ alerts: res.data })
    })()

    return refreshAlertsInFlight
  },

  createSortie: async (data) => {
    const res = await sortiesApi.create(data)
    const exit = res.data
    set(s => ({
      sorties: [exit, ...s.sorties],
      phones: s.phones.map(p =>
        p.id === exit.phoneId ? { ...p, status: "sortie" as const } : p,
      ),
    }))
    try {
      const movementsRes = await movementsApi.list({ limit: DEFAULT_LIST_LIMIT })
      set({ movements: movementsRes.data.data })
    } catch {
      /* la sortie est enregistrée même si le rafraîchissement des mouvements échoue */
    }
    return exit
  },

  returnSortie: async (id, opts) => {
    const res = await sortiesApi.return(id, opts)
    const exit = res.data
    set(s => {
      const phoneInStore = s.phones.some(p => p.id === exit.phoneId)
      return {
        sorties: s.sorties.map(x => (x.id === id ? exit : x)),
        phones: phoneInStore
          ? s.phones.map(p => p.id === exit.phoneId ? { ...p, status: "disponible" as const } : p)
          : [...s.phones, { ...exit.phone, status: "disponible" as const, photos: [] }],
        alerts: s.alerts.map(a =>
          a.type === "sortie_echeance" && a.relatedId === id ? { ...a, status: "resolue" as const } : a,
        ),
      }
    })
    try {
      const movementsRes = await movementsApi.list({ limit: DEFAULT_LIST_LIMIT })
      set({ movements: movementsRes.data.data })
    } catch {
      /* le retour est déjà enregistré côté serveur */
    }
    return exit
  },

  // ─── Computed (synchrones — opèrent sur l'état local) ─────────────────────
  getPhone: (id) => get().phones.find(p => p.id === id),
  getSale: (id) => get().sales.find(s => s.id === id),
  getClient: (id) => get().clients.find(c => c.id === id),
  getUser: (id) => mockUsers.find(u => u.id === id),

  getPhoneMovements: (phoneId) =>
    get().movements
      .filter(m => m.phoneId === phoneId)
      .sort((a, b) => b.date.localeCompare(a.date)),

  getClientSales: (clientId) => get().sales.filter(s => s.clientId === clientId),

  getClientDebt: (clientId) =>
    get().sales
      .filter(s => s.clientId === clientId && s.type === "credit" && s.paymentStatus !== "paye")
      .reduce((sum, s) => sum + s.remainingAmount, 0),

  getAvailablePhones: () => get().phones.filter(p => p.status === "disponible"),

  getActiveCredits: () => get().sales.filter(s => s.type === "credit" && s.paymentStatus !== "paye"),

  getOverdueCredits: () => {
    const today = new Date().toISOString().slice(0, 10)
    return get().sales.filter(
      s => s.type === "credit" && s.paymentStatus !== "paye" && s.dueDate && s.dueDate < today
    )
  },

  getStockByBrand: () => {
    const brandMap = new Map<string, number>()
    get().phones
      .filter(p => p.status === "disponible")
      .forEach(p => brandMap.set(p.brand, (brandMap.get(p.brand) ?? 0) + 1))
    return Array.from(brandMap, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  },

  getNewAlertsCount: () => get().alerts.filter(a => a.status === "nouvelle").length,

  isIMEIUnique: (imei, excludePhoneId) =>
    !get().phones.some(p => p.imei === imei && p.id !== excludePhoneId),
}))
