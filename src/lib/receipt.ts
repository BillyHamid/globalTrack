import { formatCurrency, formatDate, formatPaymentMethod } from '@/lib/utils'

export interface ReceiptData {
  sale: {
    id: string
    type: 'cash' | 'credit'
    date: string
    totalAmount: number
    paidAmount: number
    remainingAmount: number
    dueDate?: string | null
    payments: Array<{ amount: number; method: string; date: string }>
  }
  phone: { brand: string; model: string; capacity: string; color: string; imei?: string | null }
  client: { name: string; phone: string }
  seller: { name: string }
}

export async function generateReceipt({ sale, phone, client, seller }: ReceiptData): Promise<void> {
  const { default: jsPDF } = await import('jspdf')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' })

  const W = doc.internal.pageSize.getWidth()
  const m = 12
  let y = 14

  const rule = (yy = y) => {
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.4)
    doc.line(m, yy, W - m, yy)
  }

  const section = (label: string) => {
    rule()
    y += 5
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(100, 116, 139)
    doc.text(label, m, y)
    y += 4
  }

  // ── En-tête ──────────────────────────────────────────────
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text('ISTORE', W / 2, y, { align: 'center' })
  y += 6

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text('Gestion de stock & ventes de telephones', W / 2, y, { align: 'center' })
  y += 5

  doc.setFontSize(8)
  doc.text('KOULOUBA en face de l\'ISPP', W / 2, y, { align: 'center' })
  y += 4

  doc.text('OUAGADOUGOU - BURKINA FASO', W / 2, y, { align: 'center' })
  y += 4

  doc.text('(00226) 70 20 34 43', W / 2, y, { align: 'center' })
  y += 7

  rule()
  y += 7

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  doc.text('RECU DE VENTE', W / 2, y, { align: 'center' })
  y += 6

  const ref = 'GT-' + sale.id.slice(-8).toUpperCase()
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text(`Ref : ${ref}`, m, y)
  doc.text(`Date : ${formatDate(sale.date)}`, W - m, y, { align: 'right' })
  y += 8

  // ── Client ───────────────────────────────────────────────
  section('CLIENT')

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  doc.text(client.name, m, y)
  y += 5

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text(client.phone, m, y)
  y += 8

  // ── Article ──────────────────────────────────────────────
  section('ARTICLE')

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  doc.text(`${phone.brand} ${phone.model}`, m, y)
  y += 5

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text(`${phone.capacity} - ${phone.color}`, m, y)
  y += 4

  if (phone.imei) {
    doc.setFontSize(8)
    doc.text(`IMEI : ${phone.imei}`, m, y)
    y += 7
  } else {
    y += 3
  }

  // ── Paiement ─────────────────────────────────────────────
  section('PAIEMENT')

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  doc.text(sale.type === 'cash' ? 'Vente comptant (Cash)' : 'Vente a credit', m, y)
  y += 6

  const amountRow = (
    label: string,
    value: string,
    color: [number, number, number] = [30, 41, 59],
  ) => {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(71, 85, 105)
    doc.text(label, m, y)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...color)
    doc.text(value, W - m, y, { align: 'right' })
    y += 5
  }

  amountRow('Prix total convenu :', formatCurrency(sale.totalAmount))
  amountRow(
    'Montant recu :',
    formatCurrency(sale.paidAmount),
    sale.remainingAmount === 0 ? [21, 128, 61] : [30, 41, 59],
  )

  if (sale.remainingAmount > 0) {
    amountRow('Reste a payer :', formatCurrency(sale.remainingAmount), [217, 119, 6])
    if (sale.dueDate) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(71, 85, 105)
      doc.text('Date limite :', m, y)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 41, 59)
      doc.text(formatDate(sale.dueDate), W - m, y, { align: 'right' })
      y += 5
    }
  } else {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(21, 128, 61)
    doc.text('Paiement complet', m, y)
    y += 5
  }

  // ── Versements ───────────────────────────────────────────
  if (sale.payments.length > 0) {
    y += 2
    section('DETAIL DES VERSEMENTS')

    for (const p of sale.payments) {
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(71, 85, 105)
      doc.text(`${formatDate(p.date)}  -  ${formatPaymentMethod(p.method)}`, m, y)
      doc.setTextColor(30, 41, 59)
      doc.text(formatCurrency(p.amount), W - m, y, { align: 'right' })
      y += 4
    }
  }

  y += 6
  rule()
  y += 7

  // ── Vendeur + signatures ─────────────────────────────────
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text(`Enregistre par : ${seller.name}`, m, y)
  y += 12

  const sigLen = 52
  doc.setDrawColor(148, 163, 184)
  doc.setLineWidth(0.3)
  doc.line(m, y, m + sigLen, y)
  doc.line(W - m - sigLen, y, W - m, y)
  y += 4
  doc.setFontSize(7)
  doc.setTextColor(148, 163, 184)
  doc.text('Signature client', m, y)
  doc.text('Signature vendeur', W - m - sigLen, y)
  y += 12

  // ── Pied de page ─────────────────────────────────────────
  rule()
  y += 5
  doc.setFontSize(7)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(148, 163, 184)
  doc.text('Merci pour votre confiance !', W / 2, y, { align: 'center' })
  y += 4
  doc.text('Ce recu fait foi de la transaction.', W / 2, y, { align: 'center' })

  doc.save(`istore_recu_${ref}_${sale.date.slice(0, 10)}.pdf`)
}
