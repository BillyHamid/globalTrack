import { useState } from "react"
import { FileDown, FileSpreadsheet, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { exportCSV, exportPDF } from "@/lib/export"
import type { ExportColumn } from "@/lib/export"

interface Props<T> {
  data: T[]
  columns: ExportColumn<T>[]
  filename: string
  title: string
  disabled?: boolean
}

export function ExportButtons<T>({ data, columns, filename, title, disabled }: Props<T>) {
  const [loadingPdf, setLoadingPdf] = useState(false)

  async function handlePDF() {
    if (!data.length) return
    setLoadingPdf(true)
    try {
      await exportPDF(data, columns, filename, title)
    } finally {
      setLoadingPdf(false)
    }
  }

  function handleCSV() {
    if (!data.length) return
    exportCSV(data, columns, filename)
  }

  const isEmpty = !data.length || disabled

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleCSV}
        disabled={isEmpty}
        title={`Exporter ${data.length} résultat(s) en CSV`}
      >
        <FileSpreadsheet className="mr-1.5 h-4 w-4 text-emerald-600" />
        CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => void handlePDF()}
        disabled={isEmpty || loadingPdf}
        title={`Exporter ${data.length} résultat(s) en PDF`}
      >
        {loadingPdf ? (
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
        ) : (
          <FileDown className="mr-1.5 h-4 w-4 text-rose-600" />
        )}
        PDF
      </Button>
    </div>
  )
}
