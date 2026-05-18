import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { DoorOpen, Loader2, Package, CreditCard } from "lucide-react"
import { toast } from "sonner"
import { isAxiosError } from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { DepositProofField } from "@/components/common/DepositProofField"
import { PhoneSelector } from "@/components/common/PhoneSelector"
import { DraftIndicator } from "@/components/common/DraftIndicator"
import { usePersistedState, clearDraft } from "@/lib/use-persisted-state"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { EmptyState } from "@/components/common/EmptyState"
import { formatDateTime } from "@/lib/utils"
import { useAppStore } from "@/store"
import type { PhoneExit } from "@/types"

function isOverdue(exit: PhoneExit): boolean {
  if (exit.status !== "en_cours") return false
  return new Date(exit.dueAt).getTime() < Date.now()
}

export default function SortiesPage() {
  const { sorties, clients, getAvailablePhones, createSortie, returnSortie, loading } = useAppStore()
  const navigate = useNavigate()

  const [clientId, setClientId] = usePersistedState<string>("sortie-new:clientId", "")
  const [phoneId, setPhoneId] = usePersistedState<string>("sortie-new:phoneId", "")
  const [motif, setMotif] = usePersistedState<string>("sortie-new:motif", "")
  const [clientSearch, setClientSearch] = useState("")
  const [phoneSearch, setPhoneSearch] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [returningId, setReturningId] = useState<string | null>(null)
  const [returnTarget, setReturnTarget] = useState<PhoneExit | null>(null)
  const [returnNotes, setReturnNotes] = useState("")
  const [returnProof, setReturnProof] = useState<string | null>(null)

  const availablePhones = useMemo(() => {
    const phones = getAvailablePhones()
    const q = phoneSearch.trim().toLowerCase()
    if (!q) return phones
    return phones.filter(
      (p) =>
        p.brand.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q) ||
        (p.imei ?? "").includes(q),
    )
  }, [getAvailablePhones, phoneSearch])

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase()
    const sorted = [...clients].sort((a, b) => a.name.localeCompare(b.name, "fr"))
    if (!q) return sorted
    return sorted.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.replace(/\s/g, "").includes(q.replace(/\s/g, "")) ||
        (c.email ?? "").toLowerCase().includes(q),
    )
  }, [clients, clientSearch])

  const activeSorties = useMemo(
    () => sorties.filter((s) => s.status === "en_cours"),
    [sorties],
  )
  const pastSorties = useMemo(
    () => sorties.filter((s) => s.status === "retournee"),
    [sorties],
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clientId || !phoneId || !motif.trim()) {
      toast.error("Choisissez un client, un appareil et le motif")
      return
    }
    setSubmitting(true)
    try {
      await createSortie({
        clientId,
        phoneId,
        motif: motif.trim(),
      })
      toast.success("Sortie enregistrée — échéance 48 h")
      setClientId("")
      setPhoneId("")
      setMotif("")
      setClientSearch("")
      setPhoneSearch("")
      clearDraft("sortie-new:")
    } catch {
      toast.error("Impossible d’enregistrer la sortie (téléphone indisponible ou déjà sorti)")
    } finally {
      setSubmitting(false)
    }
  }

  function openReturnDialog(exit: PhoneExit) {
    setReturnTarget(exit)
    setReturnNotes("")
    setReturnProof(null)
  }

  async function confirmReturn() {
    if (!returnTarget) return
    setReturningId(returnTarget.id)
    try {
      await returnSortie(returnTarget.id, {
        notes: returnNotes.trim() || undefined,
        returnProof: returnProof ?? undefined,
      })
      toast.success("Retour enregistré — le téléphone est à nouveau disponible")
      setReturnTarget(null)
      setReturnNotes("")
      setReturnProof(null)
    } catch (e) {
      if (isAxiosError(e)) {
        const data = e.response?.data as { error?: string; details?: { message: string }[] } | undefined
        const fromDetails = data?.details?.map((d) => d.message).join(" · ")
        toast.error(fromDetails || data?.error || e.message || "Impossible d’enregistrer le retour")
      } else {
        toast.error("Impossible d’enregistrer le retour")
      }
    } finally {
      setReturningId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <DoorOpen className="h-7 w-7" />
          Sorties
        </h1>
        <p className="text-muted-foreground">
          Enregistrez un emprunt de téléphone (essai, dépôt-vente…). Un délai de 48 h est appliqué ; une alerte est créée
          à l’échéance si l’appareil n’est pas revenu.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Nouvelle sortie</CardTitle>
            {(clientId || phoneId || motif) && (
              <DraftIndicator
                watch={`${clientId}|${phoneId}|${motif}`}
                onReset={() => {
                  setClientId("")
                  setPhoneId("")
                  setMotif("")
                  setClientSearch("")
                  setPhoneSearch("")
                  clearDraft("sortie-new:")
                }}
              />
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <Label htmlFor="client-select">Client</Label>
                  <Button variant="link" className="h-auto p-0 text-xs" asChild>
                    <Link to="/clients/add">Ajouter un client</Link>
                  </Button>
                </div>
                {clients.length === 0 ? (
                  <p className="text-sm text-muted-foreground rounded-md border border-dashed p-3">
                    Aucun client en base.{" "}
                    <Link to="/clients/add" className="text-primary underline font-medium">
                      Créer un client
                    </Link>{" "}
                    pour pouvoir enregistrer une sortie.
                  </p>
                ) : (
                  <>
                    <Input
                      id="client-search"
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      placeholder="Filtrer par nom, téléphone ou e-mail…"
                      className="mb-2"
                      autoComplete="off"
                    />
                    <Select value={clientId || undefined} onValueChange={setClientId}>
                      <SelectTrigger id="client-select" className="w-full">
                        <SelectValue placeholder="Choisir un client dans la liste" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[min(60vh,320px)]">
                        {filteredClients.length === 0 ? (
                          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                            Aucun client ne correspond au filtre.
                          </div>
                        ) : (
                          filteredClients.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              <span className="font-medium">{c.name}</span>
                              <span className="text-muted-foreground"> — {c.phone}</span>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </>
                )}
              </div>
              <PhoneSelector
                phones={availablePhones}
                selectedPhoneId={phoneId}
                onSelect={setPhoneId}
                searchQuery={phoneSearch}
                onSearchChange={setPhoneSearch}
              />
              <div className="space-y-2">
                <Label htmlFor="motif">Motif de la sortie</Label>
                <Textarea
                  id="motif"
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  placeholder="Ex. essai client, dépôt chez un revendeur…"
                  rows={3}
                />
              </div>
              <Button
                type="submit"
                disabled={submitting || loading || !availablePhones.length || !clients.length || !clientId}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement…
                  </>
                ) : (
                  "Enregistrer la sortie"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">En cours ({activeSorties.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {activeSorties.length === 0 ? (
              <EmptyState
                icon={Package}
                title="Aucune sortie en cours"
                description="Les emprunts actifs apparaîtront ici avec la date limite des 48 heures."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Personne</TableHead>
                    <TableHead>Appareil</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeSorties.map((exit) => (
                    <TableRow key={exit.id}>
                      <TableCell className="font-medium">{exit.personName}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {exit.phone.brand} {exit.phone.model}
                        </div>
                        <Link
                          to={`/stock/${exit.phoneId}`}
                          className="font-mono text-xs text-muted-foreground hover:underline"
                        >
                          {exit.phone.imei}
                        </Link>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{exit.motif}</p>
                      </TableCell>
                      <TableCell>
                        <span className={isOverdue(exit) ? "text-destructive font-medium" : ""}>
                          {formatDateTime(exit.dueAt)}
                        </span>
                        {isOverdue(exit) && (
                          <span className="ml-2 text-xs text-destructive">(dépassé)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right align-top sm:align-middle">
                        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full sm:w-auto"
                            disabled={returningId === exit.id}
                            onClick={() => openReturnDialog(exit)}
                          >
                            {returningId === exit.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Ramener"
                            )}
                          </Button>
                          <Button
                            size="sm"
                            disabled={returningId === exit.id}
                            onClick={() =>
                              navigate("/sales/new", {
                                state: {
                                  fromSortie: {
                                    sortieId: exit.id,
                                    phoneId: exit.phoneId,
                                    personName: exit.personName,
                                  },
                                },
                              })
                            }
                            className="gradient-success w-full text-white hover:opacity-90 sm:w-auto"
                          >
                            <CreditCard className="h-4 w-4" />
                            Payer
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Historique — retours ({pastSorties.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {pastSorties.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune sortie clôturée pour l’instant.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Personne</TableHead>
                  <TableHead>Appareil</TableHead>
                  <TableHead>Retour</TableHead>
                  <TableHead>Preuve retour</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pastSorties.map((exit) => (
                  <TableRow key={exit.id}>
                    <TableCell>{exit.personName}</TableCell>
                    <TableCell>
                      {exit.phone.brand} {exit.phone.model}
                      <span className="font-mono text-xs text-muted-foreground block">{exit.phone.imei}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {exit.returnedAt ? formatDateTime(exit.returnedAt) : "—"}
                    </TableCell>
                    <TableCell>
                      {exit.returnProof?.trim() ? (
                        <a
                          href={exit.returnProof.trim()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block rounded border overflow-hidden max-w-[72px]"
                        >
                          <img src={exit.returnProof.trim()} alt="" className="h-12 w-auto object-cover" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!returnTarget}
        onOpenChange={(open) => {
          if (!open && !returningId) {
            setReturnTarget(null)
            setReturnNotes("")
            setReturnProof(null)
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmer le retour en magasin</DialogTitle>
            <DialogDescription>
              {returnTarget && (
                <>
                  L’appareil {returnTarget.phone.brand} {returnTarget.phone.model} (emprunté par{" "}
                  {returnTarget.personName}) sera marqué comme disponible au stock. Vous pouvez joindre une photo du
                  téléphone de retour pour justifier la réception.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {returnTarget && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="return-notes">Remarques (optionnel)</Label>
                <Textarea
                  id="return-notes"
                  rows={2}
                  placeholder="État de l’appareil, remarques…"
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                />
              </div>
              <DepositProofField
                id="sortie-return-proof"
                value={returnProof}
                onChange={setReturnProof}
                helpText="Photo ou capture montrant que l’iPhone (ou l’appareil) est bien de retour en magasin — recommandé pour la traçabilité."
              />
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={!!returningId}
              onClick={() => {
                setReturnTarget(null)
                setReturnNotes("")
                setReturnProof(null)
              }}
            >
              Annuler
            </Button>
            <Button type="button" disabled={!!returningId} onClick={() => void confirmReturn()}>
              {returningId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement…
                </>
              ) : (
                "Confirmer le retour"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
