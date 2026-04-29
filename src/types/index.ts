export type UserRole = "admin" | "vendeur" | "gestionnaire"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  phone: string
  avatar?: string
  createdAt: string
  isActive: boolean
}

export type PhoneStatus = "disponible" | "vendu" | "credit" | "sortie"

export interface Phone {
  id: string
  brand: string
  model: string
  capacity: string
  color: string
  sellingPrice: number
  /** Prix d'achat (FCFA), optionnel */
  purchasePrice?: number | null
  imei: string
  status: PhoneStatus
  photos: string[]
  addedAt: string
  addedBy: string
  notes?: string
}

export type SaleType = "cash" | "credit"

export type PaymentStatus = "paye" | "partiel" | "impaye"

export interface Payment {
  id: string
  saleId: string
  amount: number
  date: string
  receivedBy: string
  /** Présent sur les réponses API Prisma si `receivedBy` n’est pas mappé */
  receivedById?: string
  method: string
  notes?: string
  /** Capture / preuve de dépôt bancaire (data URL), vide si non fournie */
  depositProof?: string
}

export interface Sale {
  id: string
  phoneId: string
  clientId: string
  sellerId: string
  type: SaleType
  /** Prix catalogue / fiche stock au moment de la vente (null pour les ventes créées avant ce champ). */
  listPriceAtSale?: number | null
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  payments: Payment[]
  paymentStatus: PaymentStatus
  date: string
  dueDate?: string
  notes?: string
}

export interface Client {
  id: string
  name: string
  phone: string
  email?: string
  address?: string
  createdAt: string
  totalPurchases: number
  totalDebt: number
}

export type PhoneExitStatus = "en_cours" | "retournee"

/** Sortie (emprunt téléphone — délai 48 h) — réponse API GET /api/sorties */
export interface PhoneExit {
  id: string
  personName: string
  motif: string
  phoneId: string
  phone: Phone
  dueAt: string
  status: PhoneExitStatus
  createdAt: string
  returnedAt: string | null
  /** Photo / capture prouvant que l’appareil est revenu (data URL), si fournie au retour */
  returnProof?: string
  createdById: string
  createdBy: { id: string; name: string }
}

export type MovementType = "entree" | "vente" | "retour" | "sortie" | "retour_sortie"

export interface StockMovement {
  id: string
  phoneId: string
  type: MovementType
  date: string
  performedBy: string
  notes?: string
}

export type AlertType = "stock_ancien" | "credit_retard" | "incoherence" | "sortie_echeance"

export type AlertStatus = "nouvelle" | "vue" | "resolue"

export interface Alert {
  id: string
  type: AlertType
  title: string
  description: string
  status: AlertStatus
  relatedId?: string
  createdAt: string
}

export interface ActivityLog {
  id: string
  userId: string
  action: string
  details: string
  timestamp: string
}

export interface DashboardStats {
  totalStock: number
  soldToday: number
  activeCredits: number
  totalDebt: number
  stockValue: number
  monthlyRevenue: number
}
