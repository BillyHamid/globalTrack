import type {
  User, Phone, Client, Sale, Payment,
  StockMovement, Alert, ActivityLog,
} from "@/types"

export const mockUsers: User[] = [
  { id: "u1", name: "Sana DJibrill", email: "sana.djibrill@globaltrack.cd", role: "admin", phone: "+243 991 234 567", createdAt: "2025-01-15", isActive: true },
  { id: "u2", name: "Sana Mohamadi", email: "sana.mohamadi@globaltrack.cd", role: "vendeur", phone: "+243 992 345 678", createdAt: "2025-02-01", isActive: true },
  { id: "u3", name: "Bernadette", email: "bernadette@globaltrack.cd", role: "vendeur", phone: "+243 993 456 789", createdAt: "2025-03-10", isActive: true },
  { id: "u4", name: "Compte gestion (inactif)", email: "gestion@globaltrack.cd", role: "gestionnaire", phone: "+243 994 567 890", createdAt: "2025-04-05", isActive: false },
]

/** Stock démo : uniquement Apple (iPhone, iPad, Watch, MacBook) et Samsung */
export const mockPhones: Phone[] = [
  { id: "p1", brand: "Samsung", model: "Galaxy S24 Ultra", capacity: "256GB", color: "Noir", sellingPrice: 700000, imei: "353456789012345", status: "disponible", photos: [], addedAt: "2026-01-10", addedBy: "u1" },
  { id: "p2", brand: "iPhone", model: "15 Pro Max", capacity: "256GB", color: "Titane Bleu", sellingPrice: 800000, imei: "353456789012346", status: "vendu", photos: [], addedAt: "2026-01-12", addedBy: "u1" },
  { id: "p3", brand: "Samsung", model: "Galaxy A54", capacity: "128GB", color: "Blanc", sellingPrice: 230000, imei: "353456789012347", status: "credit", photos: [], addedAt: "2026-01-15", addedBy: "u4" },
  { id: "p4", brand: "iPhone", model: "14", capacity: "128GB", color: "Bleu", sellingPrice: 420000, imei: "353456789012348", status: "disponible", photos: [], addedAt: "2026-01-18", addedBy: "u1" },
  { id: "p5", brand: "iPad", model: "Pro 11 M4", capacity: "128GB", color: "Gris sidéral", sellingPrice: 170000, imei: "353456789012349", status: "vendu", photos: [], addedAt: "2026-01-20", addedBy: "u4" },
  { id: "p6", brand: "Samsung", model: "Galaxy S23", capacity: "128GB", color: "Noir", sellingPrice: 390000, imei: "353456789012350", status: "disponible", photos: [], addedAt: "2026-01-22", addedBy: "u1" },
  { id: "p7", brand: "iPhone", model: "13", capacity: "128GB", color: "Minuit", sellingPrice: 330000, imei: "353456789012351", status: "credit", photos: [], addedAt: "2026-01-25", addedBy: "u4" },
  { id: "p8", brand: "Watch", model: "Ultra 2", capacity: "64GB", color: "Titane naturel", sellingPrice: 140000, imei: "353456789012352", status: "vendu", photos: [], addedAt: "2026-02-01", addedBy: "u1" },
  { id: "p9", brand: "Samsung", model: "Galaxy Z Flip 5", capacity: "256GB", color: "Lavande", sellingPrice: 510000, imei: "353456789012353", status: "disponible", photos: [], addedAt: "2026-02-03", addedBy: "u4" },
  { id: "p10", brand: "iPhone", model: "15", capacity: "128GB", color: "Rose", sellingPrice: 500000, imei: "353456789012354", status: "disponible", photos: [], addedAt: "2026-02-05", addedBy: "u1" },
  { id: "p11", brand: "iPad", model: "Air 13 M2", capacity: "256GB", color: "Bleu", sellingPrice: 290000, imei: "353456789012355", status: "vendu", photos: [], addedAt: "2026-02-08", addedBy: "u4" },
  { id: "p12", brand: "Samsung", model: "Galaxy A34", capacity: "128GB", color: "Argent", sellingPrice: 190000, imei: "353456789012356", status: "disponible", photos: [], addedAt: "2026-02-10", addedBy: "u1" },
  { id: "p13", brand: "iPhone", model: "SE 2022", capacity: "64GB", color: "Rouge", sellingPrice: 250000, imei: "353456789012357", status: "credit", photos: [], addedAt: "2026-02-12", addedBy: "u1" },
  { id: "p14", brand: "Watch", model: "Series 9", capacity: "32GB", color: "Minuit", sellingPrice: 115000, imei: "353456789012358", status: "vendu", photos: [], addedAt: "2026-02-15", addedBy: "u4" },
  { id: "p15", brand: "Samsung", model: "Galaxy S24", capacity: "128GB", color: "Jaune", sellingPrice: 470000, imei: "353456789012359", status: "disponible", photos: [], addedAt: "2026-02-18", addedBy: "u1" },
  { id: "p16", brand: "iPhone", model: "15 Pro", capacity: "128GB", color: "Titane Noir", sellingPrice: 630000, imei: "353456789012360", status: "disponible", photos: [], addedAt: "2026-02-20", addedBy: "u1" },
  { id: "p17", brand: "MacBook", model: "Air 15 M3", capacity: "256GB", color: "Gris sidéral", sellingPrice: 190000, imei: "353456789012361", status: "vendu", photos: [], addedAt: "2026-02-22", addedBy: "u4" },
  { id: "p18", brand: "Samsung", model: "Galaxy A14", capacity: "64GB", color: "Noir", sellingPrice: 95000, imei: "353456789012362", status: "disponible", photos: [], addedAt: "2026-02-25", addedBy: "u1" },
  { id: "p19", brand: "iPhone", model: "14 Plus", capacity: "128GB", color: "Jaune", sellingPrice: 470000, imei: "353456789012363", status: "credit", photos: [], addedAt: "2026-02-28", addedBy: "u4" },
  { id: "p20", brand: "Samsung", model: "Galaxy Z Fold 5", capacity: "256GB", color: "Noir", sellingPrice: 430000, imei: "353456789012364", status: "disponible", photos: [], addedAt: "2026-03-01", addedBy: "u1" },
  { id: "p21", brand: "Samsung", model: "Galaxy M54", capacity: "128GB", color: "Bleu", sellingPrice: 205000, imei: "353456789012365", status: "disponible", photos: [], addedAt: "2026-03-03", addedBy: "u4" },
  { id: "p22", brand: "iPhone", model: "16 Pro", capacity: "256GB", color: "Desert", sellingPrice: 720000, imei: "353456789012366", status: "disponible", photos: [], addedAt: "2026-03-05", addedBy: "u1" },
  { id: "p23", brand: "MacBook", model: "Pro 14 M3", capacity: "512GB", color: "Argent", sellingPrice: 350000, imei: "353456789012367", status: "vendu", photos: [], addedAt: "2026-03-07", addedBy: "u1" },
  { id: "p24", brand: "Samsung", model: "Galaxy Z Fold 5", capacity: "512GB", color: "Creme", sellingPrice: 780000, imei: "353456789012368", status: "disponible", photos: [], addedAt: "2026-03-10", addedBy: "u4" },
  { id: "p25", brand: "iPhone", model: "16", capacity: "128GB", color: "Blanc", sellingPrice: 540000, imei: "353456789012369", status: "disponible", photos: [], addedAt: "2026-03-12", addedBy: "u1" },
  { id: "p26", brand: "Watch", model: "SE 2", capacity: "32GB", color: "Minuit", sellingPrice: 195000, imei: "353456789012370", status: "disponible", photos: [], addedAt: "2026-03-14", addedBy: "u4" },
  { id: "p27", brand: "Samsung", model: "Galaxy A15", capacity: "128GB", color: "Bleu", sellingPrice: 110000, imei: "353456789012371", status: "vendu", photos: [], addedAt: "2026-03-16", addedBy: "u1" },
  { id: "p28", brand: "MacBook", model: "Air 13 M2", capacity: "256GB", color: "Or", sellingPrice: 80000, imei: "353456789012372", status: "disponible", photos: [], addedAt: "2026-03-18", addedBy: "u1" },
  { id: "p29", brand: "iPhone", model: "14 Pro", capacity: "256GB", color: "Violet", sellingPrice: 550000, imei: "353456789012373", status: "credit", photos: [], addedAt: "2026-03-20", addedBy: "u4" },
  { id: "p30", brand: "Samsung", model: "Galaxy S24+", capacity: "256GB", color: "Violet", sellingPrice: 560000, imei: "353456789012374", status: "disponible", photos: [], addedAt: "2026-03-22", addedBy: "u1" },
]

export const mockClients: Client[] = [
  { id: "c1", name: "Alain Mutombo", phone: "+243 810 111 222", email: "alain@gmail.com", address: "Av. Lumumba, Lubumbashi", createdAt: "2025-06-01", totalPurchases: 3, totalDebt: 0 },
  { id: "c2", name: "Grace Mwamba", phone: "+243 820 222 333", email: "grace@gmail.com", address: "Av. Kasavubu, Kinshasa", createdAt: "2025-07-15", totalPurchases: 2, totalDebt: 120000 },
  { id: "c3", name: "David Kasongo", phone: "+243 830 333 444", createdAt: "2025-08-20", totalPurchases: 1, totalDebt: 210000 },
  { id: "c4", name: "Esther Ngalula", phone: "+243 840 444 555", email: "esther@yahoo.fr", address: "Av. Sendwe, Lubumbashi", createdAt: "2025-09-10", totalPurchases: 4, totalDebt: 0 },
  { id: "c5", name: "François Ilunga", phone: "+243 850 555 666", createdAt: "2025-10-05", totalPurchases: 1, totalDebt: 250000 },
  { id: "c6", name: "Henriette Kabila", phone: "+243 860 666 777", email: "henriette@gmail.com", createdAt: "2025-11-12", totalPurchases: 2, totalDebt: 0 },
  { id: "c7", name: "Joseph Kalala", phone: "+243 870 777 888", address: "Av. Mobutu, Mbujimayi", createdAt: "2025-12-01", totalPurchases: 1, totalDebt: 230000 },
  { id: "c8", name: "Nadine Tshilombo", phone: "+243 880 888 999", email: "nadine@outlook.com", createdAt: "2026-01-05", totalPurchases: 3, totalDebt: 0 },
  { id: "c9", name: "Richard Katumba", phone: "+243 890 999 000", createdAt: "2026-01-20", totalPurchases: 1, totalDebt: 370000 },
  { id: "c10", name: "Sylvie Kazadi", phone: "+243 811 123 456", email: "sylvie@gmail.com", address: "Av. Tshombe, Lubumbashi", createdAt: "2026-02-01", totalPurchases: 2, totalDebt: 0 },
  { id: "c11", name: "Michel Kapend", phone: "+243 821 234 567", createdAt: "2026-02-10", totalPurchases: 1, totalDebt: 0 },
  { id: "c12", name: "Annie Mbombo", phone: "+243 831 345 678", email: "annie@gmail.com", createdAt: "2026-02-20", totalPurchases: 2, totalDebt: 90000 },
  { id: "c13", name: "Didier Lupaka", phone: "+243 841 456 789", createdAt: "2026-03-01", totalPurchases: 1, totalDebt: 0 },
  { id: "c14", name: "Clarisse Muland", phone: "+243 851 567 890", email: "clarisse@yahoo.fr", createdAt: "2026-03-05", totalPurchases: 1, totalDebt: 550000 },
  { id: "c15", name: "Bob Tshibangu", phone: "+243 861 678 901", createdAt: "2026-03-10", totalPurchases: 2, totalDebt: 0 },
]

const makePayments = (saleId: string, amounts: number[], dates: string[]): Payment[] =>
  amounts.map((amount, i) => ({
    id: `pay-${saleId}-${i + 1}`,
    saleId,
    amount,
    date: dates[i],
    receivedBy: i % 2 === 0 ? "u2" : "u3",
    method: i % 3 === 0 ? "cash" : i % 3 === 1 ? "mobile_money" : "virement",
  }))

export const mockSales: Sale[] = [
  { id: "s1", phoneId: "p2", clientId: "c1", sellerId: "u2", type: "cash", listPriceAtSale: 800000, totalAmount: 800000, paidAmount: 800000, remainingAmount: 0, payments: makePayments("s1", [800000], ["2026-01-20"]), paymentStatus: "paye", date: "2026-01-20" },
  { id: "s2", phoneId: "p3", clientId: "c2", sellerId: "u3", type: "credit", listPriceAtSale: 260000, totalAmount: 230000, paidAmount: 110000, remainingAmount: 120000, payments: makePayments("s2", [60000, 50000], ["2026-01-25", "2026-02-10"]), paymentStatus: "partiel", date: "2026-01-25", dueDate: "2026-04-25" },
  { id: "s3", phoneId: "p5", clientId: "c4", sellerId: "u2", type: "cash", listPriceAtSale: 170000, totalAmount: 170000, paidAmount: 170000, remainingAmount: 0, payments: makePayments("s3", [170000], ["2026-01-28"]), paymentStatus: "paye", date: "2026-01-28" },
  { id: "s4", phoneId: "p7", clientId: "c3", sellerId: "u3", type: "credit", listPriceAtSale: 360000, totalAmount: 330000, paidAmount: 120000, remainingAmount: 210000, payments: makePayments("s4", [120000], ["2026-02-01"]), paymentStatus: "partiel", date: "2026-02-01", dueDate: "2026-04-01" },
  { id: "s5", phoneId: "p8", clientId: "c6", sellerId: "u2", type: "cash", totalAmount: 140000, paidAmount: 140000, remainingAmount: 0, payments: makePayments("s5", [140000], ["2026-02-05"]), paymentStatus: "paye", date: "2026-02-05" },
  { id: "s6", phoneId: "p11", clientId: "c8", sellerId: "u3", type: "cash", totalAmount: 290000, paidAmount: 290000, remainingAmount: 0, payments: makePayments("s6", [290000], ["2026-02-12"]), paymentStatus: "paye", date: "2026-02-12" },
  { id: "s7", phoneId: "p13", clientId: "c5", sellerId: "u2", type: "credit", totalAmount: 250000, paidAmount: 0, remainingAmount: 250000, payments: [], paymentStatus: "impaye", date: "2026-02-15", dueDate: "2026-03-15" },
  { id: "s8", phoneId: "p14", clientId: "c10", sellerId: "u3", type: "cash", totalAmount: 115000, paidAmount: 115000, remainingAmount: 0, payments: makePayments("s8", [115000], ["2026-02-18"]), paymentStatus: "paye", date: "2026-02-18" },
  { id: "s9", phoneId: "p17", clientId: "c1", sellerId: "u2", type: "cash", totalAmount: 190000, paidAmount: 190000, remainingAmount: 0, payments: makePayments("s9", [190000], ["2026-02-25"]), paymentStatus: "paye", date: "2026-02-25" },
  { id: "s10", phoneId: "p19", clientId: "c7", sellerId: "u3", type: "credit", totalAmount: 470000, paidAmount: 240000, remainingAmount: 230000, payments: makePayments("s10", [120000, 120000], ["2026-03-01", "2026-03-15"]), paymentStatus: "partiel", date: "2026-03-01", dueDate: "2026-05-01" },
  { id: "s11", phoneId: "p23", clientId: "c4", sellerId: "u2", type: "cash", totalAmount: 350000, paidAmount: 350000, remainingAmount: 0, payments: makePayments("s11", [350000], ["2026-03-08"]), paymentStatus: "paye", date: "2026-03-08" },
  { id: "s12", phoneId: "p27", clientId: "c11", sellerId: "u3", type: "cash", totalAmount: 110000, paidAmount: 110000, remainingAmount: 0, payments: makePayments("s12", [110000], ["2026-03-18"]), paymentStatus: "paye", date: "2026-03-18" },
  { id: "s13", phoneId: "p29", clientId: "c14", sellerId: "u2", type: "credit", totalAmount: 550000, paidAmount: 0, remainingAmount: 550000, payments: [], paymentStatus: "impaye", date: "2026-03-22", dueDate: "2026-04-22" },
  { id: "s14", phoneId: "p1", clientId: "c12", sellerId: "u3", type: "credit", totalAmount: 700000, paidAmount: 610000, remainingAmount: 90000, payments: makePayments("s14", [300000, 310000], ["2026-03-25", "2026-03-30"]), paymentStatus: "partiel", date: "2026-03-25", dueDate: "2026-05-25" },
  { id: "s15", phoneId: "p9", clientId: "c9", sellerId: "u2", type: "credit", totalAmount: 510000, paidAmount: 140000, remainingAmount: 370000, payments: makePayments("s15", [140000], ["2026-03-28"]), paymentStatus: "partiel", date: "2026-03-28", dueDate: "2026-05-28" },
]

export const mockMovements: StockMovement[] = [
  { id: "m1", phoneId: "p1", type: "entree", date: "2026-01-10", performedBy: "u1", notes: "Achat fournisseur Dubai" },
  { id: "m2", phoneId: "p2", type: "entree", date: "2026-01-12", performedBy: "u1" },
  { id: "m3", phoneId: "p2", type: "vente", date: "2026-01-20", performedBy: "u2" },
  { id: "m4", phoneId: "p3", type: "entree", date: "2026-01-15", performedBy: "u4" },
  { id: "m5", phoneId: "p3", type: "vente", date: "2026-01-25", performedBy: "u3" },
  { id: "m6", phoneId: "p5", type: "entree", date: "2026-01-20", performedBy: "u4" },
  { id: "m7", phoneId: "p5", type: "vente", date: "2026-01-28", performedBy: "u2" },
  { id: "m8", phoneId: "p7", type: "entree", date: "2026-01-25", performedBy: "u4" },
  { id: "m9", phoneId: "p7", type: "vente", date: "2026-02-01", performedBy: "u3" },
  { id: "m10", phoneId: "p8", type: "entree", date: "2026-02-01", performedBy: "u1" },
  { id: "m11", phoneId: "p8", type: "vente", date: "2026-02-05", performedBy: "u2" },
  { id: "m12", phoneId: "p11", type: "entree", date: "2026-02-08", performedBy: "u4" },
  { id: "m13", phoneId: "p11", type: "vente", date: "2026-02-12", performedBy: "u3" },
  { id: "m14", phoneId: "p13", type: "entree", date: "2026-02-12", performedBy: "u1" },
  { id: "m15", phoneId: "p13", type: "vente", date: "2026-02-15", performedBy: "u2" },
  { id: "m16", phoneId: "p14", type: "entree", date: "2026-02-15", performedBy: "u4" },
  { id: "m17", phoneId: "p14", type: "vente", date: "2026-02-18", performedBy: "u3" },
  { id: "m18", phoneId: "p17", type: "entree", date: "2026-02-22", performedBy: "u4" },
  { id: "m19", phoneId: "p17", type: "vente", date: "2026-02-25", performedBy: "u2" },
  { id: "m20", phoneId: "p23", type: "entree", date: "2026-03-07", performedBy: "u1" },
  { id: "m21", phoneId: "p23", type: "vente", date: "2026-03-08", performedBy: "u2" },
  { id: "m22", phoneId: "p27", type: "entree", date: "2026-03-16", performedBy: "u1" },
  { id: "m23", phoneId: "p27", type: "vente", date: "2026-03-18", performedBy: "u3" },
  { id: "m24", phoneId: "p29", type: "entree", date: "2026-03-20", performedBy: "u4" },
  { id: "m25", phoneId: "p29", type: "vente", date: "2026-03-22", performedBy: "u2" },
]

export const mockAlerts: Alert[] = [
  { id: "a1", type: "credit_retard", title: "Crédit en retard", description: "iPhone SE 2022 - François Ilunga: 250 000 FCFA impayé depuis le 15/03", status: "nouvelle", relatedId: "s7", createdAt: "2026-03-16" },
  { id: "a2", type: "stock_ancien", title: "Stock ancien", description: "iPhone 14 en stock depuis plus de 60 jours", status: "nouvelle", relatedId: "p4", createdAt: "2026-03-20" },
  { id: "a3", type: "credit_retard", title: "Crédit en retard", description: "iPhone 14 Pro - Clarisse Muland: 550 000 FCFA impayé depuis le 22/03", status: "nouvelle", relatedId: "s13", createdAt: "2026-03-23" },
  { id: "a4", type: "stock_ancien", title: "Stock ancien", description: "Samsung Galaxy S23 en stock depuis plus de 60 jours", status: "vue", relatedId: "p6", createdAt: "2026-03-25" },
  { id: "a5", type: "incoherence", title: "Incohérence stock", description: "Téléphone p1 marqué disponible mais associé à une vente", status: "nouvelle", relatedId: "p1", createdAt: "2026-03-28" },
  { id: "a6", type: "credit_retard", title: "Rappel de paiement", description: "Galaxy A54 - Grace Mwamba: 120 000 FCFA restants, échéance le 25/04", status: "vue", relatedId: "s2", createdAt: "2026-04-01" },
]

export const mockActivityLogs: ActivityLog[] = [
  { id: "log1", userId: "u2", action: "Vente", details: "Vente cash iPhone 15 Pro Max à Alain Mutombo", timestamp: "2026-01-20T10:30:00" },
  { id: "log2", userId: "u3", action: "Vente", details: "Vente crédit Galaxy A54 à Grace Mwamba", timestamp: "2026-01-25T14:15:00" },
  { id: "log3", userId: "u1", action: "Stock", details: "Ajout Samsung Galaxy S23 au stock", timestamp: "2026-01-22T09:00:00" },
  { id: "log4", userId: "u2", action: "Paiement", details: "Paiement reçu de 120 000 FCFA - David Kasongo", timestamp: "2026-02-01T11:00:00" },
  { id: "log5", userId: "u3", action: "Vente", details: "Vente cash iPad Air 13 M2 à Nadine Tshilombo", timestamp: "2026-02-12T15:30:00" },
  { id: "log6", userId: "u2", action: "Vente", details: "Vente crédit iPhone SE 2022 à François Ilunga", timestamp: "2026-02-15T10:00:00" },
  { id: "log7", userId: "u1", action: "Stock", details: "Ajout iPhone 16 Pro au stock", timestamp: "2026-03-05T08:30:00" },
  { id: "log8", userId: "u3", action: "Vente", details: "Vente cash Samsung Galaxy A15 à Michel Kapend", timestamp: "2026-03-18T16:00:00" },
  { id: "log9", userId: "u2", action: "Vente", details: "Vente crédit iPhone 14 Pro à Clarisse Muland", timestamp: "2026-03-22T13:45:00" },
  { id: "log10", userId: "u3", action: "Paiement", details: "Paiement reçu de 120 000 FCFA - Joseph Kalala", timestamp: "2026-03-15T10:30:00" },
]

export const salesChartData = [
  { month: "Oct", cash: 1920000, credit: 1080000 },
  { month: "Nov", cash: 2460000, credit: 1320000 },
  { month: "Dec", cash: 3300000, credit: 900000 },
  { month: "Jan", cash: 2280000, credit: 560000 },
  { month: "Fev", cash: 1680000, credit: 720000 },
  { month: "Mar", cash: 1860000, credit: 1660000 },
]
