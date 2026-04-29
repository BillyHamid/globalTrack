import { useRef, useState } from "react"
import { ImageIcon, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { imageFileToCompressedDataUrl } from "@/lib/image-data-url"

interface DepositProofFieldProps {
  id?: string
  value: string | null
  onChange: (dataUrl: string | null) => void
  disabled?: boolean
  /** Texte d’aide sous le label (ex. compléter la preuve après coup) */
  helpText?: string
  /** Si true, le libellé indique qu’une image est attendue pour valider (ex. ajout différé) */
  required?: boolean
}

export function DepositProofField({
  id = "deposit-proof",
  value,
  onChange,
  disabled,
  helpText = "Relevé, capture d’écran ou photo du versement pour justifier le paiement.",
  required = false,
}: DepositProofFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setBusy(true)
    try {
      const url = await imageFileToCompressedDataUrl(file)
      onChange(url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Image invalide")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        Capture du dépôt bancaire{required ? "" : " (optionnel)"}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <p className="text-xs text-muted-foreground">
        {helpText}
      </p>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFile}
        disabled={disabled || busy}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
          <span className="ml-2">{value ? "Remplacer l’image" : "Joindre une capture"}</span>
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)} disabled={disabled}>
            <X className="h-4 w-4 mr-1" />
            Retirer
          </Button>
        )}
      </div>
      {value && (
        <div className="mt-2 rounded-md border overflow-hidden max-w-xs">
          <img src={value} alt="Preuve de dépôt" className="max-h-40 w-full object-contain bg-muted" />
        </div>
      )}
    </div>
  )
}
