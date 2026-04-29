/**
 * Couche de service API — tous les appels REST vers le backend GlobalTrack
 */

import { apiClient } from './client'
import type {
  User, Phone, Client, Sale, Payment, StockMovement, Alert, ActivityLog, PhoneExit,
} from '@/types'

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<{ accessToken: string; refreshToken: string; user: User }>('/auth/login', { email, password }),

  logout: (refreshToken?: string) =>
    apiClient.post('/auth/logout', { refreshToken }),

  me: () =>
    apiClient.get<User>('/auth/me'),

  refresh: (refreshToken: string) =>
    apiClient.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken }),
}

// ─── Phones ───────────────────────────────────────────────────────────────────
export interface PhoneFilters {
  brand?: string
  status?: string
  search?: string
  page?: number
  limit?: number
}

export const phonesApi = {
  list: (filters?: PhoneFilters) =>
    apiClient.get<{ data: Phone[]; total: number; page: number; limit: number }>('/phones', { params: filters }),

  available: () =>
    apiClient.get<Phone[]>('/phones/available'),

  stats: () =>
    apiClient.get<Array<{ brand: string; count: number }>>('/phones/stats'),

  get: (id: string) =>
    apiClient.get<Phone & { movements: StockMovement[]; sales: Sale[] }>(`/phones/${id}`),

  create: (data: Omit<Phone, 'id' | 'addedAt' | 'addedBy' | 'status'>) =>
    apiClient.post<Phone>('/phones', data),

  update: (id: string, data: Partial<Phone>) =>
    apiClient.patch<Phone>(`/phones/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/phones/${id}`),
}

// ─── Clients ──────────────────────────────────────────────────────────────────
export const clientsApi = {
  list: (search?: string) =>
    apiClient.get<(Client & { totalDebt: number })[]>('/clients', { params: { search } }),

  get: (id: string) =>
    apiClient.get<Client & { totalDebt: number; sales: Sale[] }>(`/clients/${id}`),

  debt: (id: string) =>
    apiClient.get<{ totalDebt: number }>(`/clients/${id}/debt`),

  create: (data: Pick<Client, 'name' | 'phone' | 'email' | 'address'>) =>
    apiClient.post<Client & { totalDebt: number }>('/clients', data),

  update: (id: string, data: Partial<Client>) =>
    apiClient.patch<Client>(`/clients/${id}`, data),
}

// ─── Sales ────────────────────────────────────────────────────────────────────
export interface SaleFilters {
  type?: 'cash' | 'credit'
  paymentStatus?: string
  clientId?: string
  search?: string
  overdue?: boolean
  page?: number
  limit?: number
}

export const salesApi = {
  list: (filters?: SaleFilters) =>
    apiClient.get<{ data: Sale[]; total: number; page: number; limit: number }>('/sales', { params: filters }),

  get: (id: string) =>
    apiClient.get<Sale>(`/sales/${id}`),

  create: (data: {
    phoneId: string
    clientId: string
    type: 'cash' | 'credit'
    listPriceAtSale?: number
    totalAmount: number
    paidAmount?: number
    dueDate?: string
    notes?: string
    paymentMethod?: string
    depositProof?: string
  }) => apiClient.post<Sale>('/sales', data),

  update: (id: string, data: { notes?: string; dueDate?: string }) =>
    apiClient.patch<Sale>(`/sales/${id}`, data),

  addPayment: (saleId: string, data: { amount: number; method?: string; notes?: string; date?: string; depositProof?: string }) =>
    apiClient.post<{ payment: Payment; sale: Sale }>(`/sales/${saleId}/payments`, data),

  updatePaymentDepositProof: (saleId: string, paymentId: string, data: { depositProof: string }) =>
    apiClient.patch<Payment>(`/sales/${saleId}/payments/${paymentId}`, data),
}

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersApi = {
  list: () =>
    apiClient.get<User[]>('/users'),

  get: (id: string) =>
    apiClient.get<User & { salesCount: number; activityCount: number }>(`/users/${id}`),

  create: (data: Omit<User, 'id' | 'createdAt' | 'isActive'> & { password: string }) =>
    apiClient.post<User>('/users', data),

  update: (id: string, data: Partial<User> & { password?: string }) =>
    apiClient.patch<User>(`/users/${id}`, data),

  activity: (id: string) =>
    apiClient.get<ActivityLog[]>(`/users/${id}/activity`),
}

// ─── IMEI ─────────────────────────────────────────────────────────────────────
export interface IMEICheckResult {
  valid: boolean
  imei: string
  format: { ok: boolean; error?: string }
  luhn: { ok: boolean; error?: string }
  tac: {
    ok: boolean
    brand?: string
    model?: string
    marketingName?: string
    source: 'api' | 'local' | 'none'
  }
  blacklist: { checked: boolean; clean?: boolean; status?: string }
  uniqueness: { isUnique: boolean; duplicatePhoneId?: string }
  errors: string[]
  warnings: string[]
}

export const imeiApi = {
  check: (imei: string, options?: { checkBlacklist?: boolean; excludeId?: string }) =>
    apiClient.get<IMEICheckResult>(`/imei/check/${imei}`, { params: options }),

  quickCheck: (imei: string) =>
    apiClient.get<{ valid: boolean; error?: string }>(`/imei/quick/${imei}`),
}

// ─── Alerts ───────────────────────────────────────────────────────────────────
export const alertsApi = {
  list: (filters?: { type?: string; status?: string }) =>
    apiClient.get<Alert[]>('/alerts', { params: filters }),

  count: () =>
    apiClient.get<{ count: number }>('/alerts/count'),

  refresh: () =>
    apiClient.post<{ newAlertsCount: number }>('/alerts/refresh'),

  update: (id: string, status: 'vue' | 'resolue') =>
    apiClient.patch<Alert>(`/alerts/${id}`, { status }),

  delete: (id: string) =>
    apiClient.delete(`/alerts/${id}`),
}

// ─── Movements ────────────────────────────────────────────────────────────────
export const movementsApi = {
  list: (filters?: { phoneId?: string; type?: string; page?: number; limit?: number }) =>
    apiClient.get<{ data: StockMovement[]; total: number }>('/movements', { params: filters }),
}

// ─── Sorties (emprunt 48 h) ───────────────────────────────────────────────────
export const sortiesApi = {
  list: () =>
    apiClient.get<PhoneExit[]>('/sorties'),

  create: (data: { personName: string; phoneId: string; motif: string }) =>
    apiClient.post<PhoneExit>('/sorties', data),

  return: (id: string, body?: { notes?: string; returnProof?: string }) =>
    apiClient.post<PhoneExit>(`/sorties/${id}/return`, {
      notes: body?.notes ?? '',
      returnProof: body?.returnProof ?? '',
    }),
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export interface DashboardStats {
  totalStock: number
  soldToday: number
  activeCredits: number
  totalDebt: number
  stockValue: number
  monthlyRevenue: number
  newAlerts: number
}

export const dashboardApi = {
  stats: () =>
    apiClient.get<DashboardStats>('/dashboard/stats'),

  chartData: () =>
    apiClient.get<Array<{ month: string; revenue: number; sales: number }>>('/dashboard/chart-data'),

  recentActivity: () =>
    apiClient.get<ActivityLog[]>('/dashboard/recent-activity'),
}
