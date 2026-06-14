export interface ExportColumn<T> {
  header: string
  /** Valeur affichée dans le PDF et en fallback CSV */
  value: (row: T) => string
  /** Valeur brute pour le CSV (ex: nombre sans formatage pour qu'Excel puisse calculer) */
  csvValue?: (row: T) => string
}

/** Télécharge un fichier CSV avec BOM UTF-8 (compatible Excel) */
export function exportCSV<T>(data: T[], columns: ExportColumn<T>[], filename: string): void {
  const escape = (v: string) =>
    v.includes(',') || v.includes('"') || v.includes('\n')
      ? `"${v.replace(/"/g, '""')}"`
      : v

  const header = columns.map((c) => escape(c.header)).join(',')
  const rows = data.map((row) =>
    columns
      .map((c) => escape(String((c.csvValue ?? c.value)(row))))
      .join(','),
  )

  const blob = new Blob(['﻿' + [header, ...rows].join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  })
  trigger(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`)
}

/** Génère et télécharge un PDF tabulaire — jsPDF chargé en import dynamique */
export async function exportPDF<T>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string,
  title: string,
): Promise<void> {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  // En-tête
  doc.setFontSize(14)
  doc.setTextColor(30, 41, 59)
  doc.text(title, 14, 14)

  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  const now = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
  doc.text(`Exporté le ${now} — ${data.length} résultat${data.length !== 1 ? 's' : ''}`, 14, 20)

  autoTable(doc, {
    head: [columns.map((c) => c.header)],
    body: data.map((row) => columns.map((c) => c.value(row))),
    startY: 26,
    styles: { fontSize: 8, cellPadding: 2.5, overflow: 'linebreak' },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.1,
    margin: { left: 14, right: 14 },
    didDrawPage: (hookData) => {
      const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages()
      doc.setFontSize(8)
      doc.setTextColor(148, 163, 184)
      doc.text(
        `GlobalTrack — Page ${hookData.pageNumber} / ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' },
      )
    },
  })

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
}

function trigger(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
