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
import { phonesApi, salesApi, clientsApi, alertsApi, movementsApi, sortiesApi } from "@/api"
import { mockUsers } from "@/mock/data"

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

  // ─── Phone ────────────────────────────────────────────────────────────────
  addPhone: (phone: Omit<Phone, "id" | "status" | "addedAt">, userId: string) => Promise<Phone>
  updatePhone: (id: string, data: Partial<Phone>) => Promise<void>
  deletePhone: (id: string, userId: string) => Promise<boolean>
  /** Charge un téléphone par id (ex. hors page listée limit=500) et fusionne ventes / stock local */
  fetchPhoneById: (id: string) => Promise<Phone | null>

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

  // ─── Client ───────────────────────────────────────────────────────────────
  addClient: (data: Omit<Client, "id" | "createdAt" | "totalPurchases" | "totalDebt">) => Promise<Client>
  updateClient: (id: string, data: Partial<Client>) => Promise<void>

  // ─── Alert ────────────────────────────────────────────────────────────────
  markAlertViewed: (id: string) => Promise<void>
  resolveAlert: (id: string) => Promise<void>
  refreshAlerts: () => Promise<void>

  // ─── Sorties ──────────────────────────────────────────────────────────────
  createSortie: (data: { personName: string; phoneId: string; motif: string }) => Promise<PhoneExit>
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
  loadAll: async () => {
    if (get().loading) return
    set({ loading: true })
    try {
      // Refresh alerts first (regenerates expired credits, old stock, overdue exits…),
      // then list. If refresh fails, fall back to listing existing alerts.
      const alertsPromise = alertsApi
        .refresh()
        .then(() => alertsApi.list())
        .catch(() => alertsApi.list())

      const [phonesRes, salesRes, clientsRes, movementsRes, alertsRes, sortiesRes] = await Promise.all([
        phonesApi.list({ limit: 500 }),
        salesApi.list({ limit: 500 }),
        clientsApi.list(),
        movementsApi.list({ limit: 500 }),
        alertsPromise,
        sortiesApi.list(),
      ])
      set({
        phones: phonesRes.data.data,
        sales: salesRes.data.data,
        clients: clientsRes.data,
        movements: movementsRes.data.data,
        alerts: alertsRes.data,
        sorties: sortiesRes.data,
        initialized: true,
      })
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
      return true
    } catch {
      return false
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
        const movRes = await movementsApi.list({ limit: 500 })
        set({ movements: movRes.data.data })
      } catch {
        /* le téléphone est chargé même si les mouvements ne se rafraîchissent pas */
      }
      return phone
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
                payments: sl.payments.map(p => (p.id === paymentId ? { ...p, ...updated } : p)),
              }
            : sl,
        ),
      }))
      return updated
    } catch {
      return null
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
    await alertsApi.refresh()
    const res = await alertsApi.list()
    set({ alerts: res.data })
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
      const movementsRes = await movementsApi.list({ limit: 500 })
      set({ movements: movementsRes.data.data })
    } catch {
      /* la sortie est enregistrée même si le rafraîchissement des mouvements échoue */
    }
    return exit
  },

  returnSortie: async (id, opts) => {
    const res = await sortiesApi.return(id, opts)
    const exit = res.data
    set(s => ({
      sorties: s.sorties.map(x => (x.id === id ? exit : x)),
      phones: s.phones.map(p =>
        p.id === exit.phoneId ? { ...p, status: "disponible" as const } : p,
      ),
      alerts: s.alerts.map(a =>
        a.type === "sortie_echeance" && a.relatedId === id ? { ...a, status: "resolue" as const } : a,
      ),
    }))
    try {
      const movementsRes = await movementsApi.list({ limit: 500 })
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
