import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useAuth } from '@/contexts/AuthContext'
import { api, apiBlob } from '@/lib/api'
import { AdminSpacesPlan } from '@/components/AdminSpacesPlan'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { SpaceType, SpaceStatus } from '@/types/space'
import { SPACE_TYPE_LABELS, SPACE_STATUS_LABELS } from '@/types/space'
import { toast } from 'sonner'

type AdminEquipementListItem = {
  id: string
  name: string
  quantity: number
  assigned?: number
  available?: number
}

type AdminSpaceEquipement = { id: string; name: string; quantity: number }

type AdminSpace = {
  id: string
  name: string
  code: string | null
  type: SpaceType
  capacity: number
  status: SpaceStatus
  description: string | null
  positionX: number | null
  positionY: number | null
  equipements: AdminSpaceEquipement[]
}

const defaultForm: Omit<AdminSpace, 'id' | 'equipements'> & { status?: SpaceStatus } = {
  name: '',
  code: '',
  type: 'MEETING_ROOM',
  capacity: 4,
  status: 'AVAILABLE',
  description: '',
  positionX: null,
  positionY: null,
}

export function AdminEspacesPage() {
  const { user } = useAuth()
  const [spaces, setSpaces] = useState<AdminSpace[]>([])
  const [equipements, setEquipements] = useState<AdminEquipementListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [editingSpace, setEditingSpace] = useState<AdminSpace | null>(null)
  const [createForm, setCreateForm] = useState(defaultForm)
  const [editForm, setEditForm] = useState(defaultForm)
  const [pendingEquipements, setPendingEquipements] = useState<{ equipementId: string; name: string; quantity: number }[]>([])
  const [createAttachEquipementId, setCreateAttachEquipementId] = useState<string>('')
  const [createAttachQuantity, setCreateAttachQuantity] = useState(1)
  const [confirmDeleteSpaceOpen, setConfirmDeleteSpaceOpen] = useState(false)
  const [pendingDeleteSpaceId, setPendingDeleteSpaceId] = useState<string | null>(null)
  const [historyFrom, setHistoryFrom] = useState<string>('')
  const [historyTo, setHistoryTo] = useState<string>('')
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyItems, setHistoryItems] = useState<
    {
      id: string
      spaceName: string
      seatCode: string | null
      startDatetime: string
      endDatetime: string
      title: string | null
      isPrivate: boolean
      isOwner: boolean
    }[]
  >([])

  async function load() {
    if (!user) return
    setLoading(true)
    try {
      const [spacesData, equipementsData] = await Promise.all([
        api<AdminSpace[]>('/admin/espaces'),
        api<AdminEquipementListItem[]>('/admin/equipements'),
      ])
      setSpaces(spacesData)
      setEquipements(equipementsData)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Impossible de charger les espaces')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [user])

  function openEditModal(space: AdminSpace) {
    setEditingSpace(space)
    setEditForm({
      name: space.name,
      code: space.code ?? '',
      type: space.type,
      capacity: space.capacity,
      status: space.status,
      description: space.description ?? '',
      positionX: space.positionX,
      positionY: space.positionY,
    })
  }

  function closeEditModal() {
    setEditingSpace(null)
    setEditForm(defaultForm)
    setAttachEquipementId('')
    setAttachQuantity(1)
  }

  function addPendingEquipement(equipementId: string, quantity: number) {
    const eq = equipements.find((e) => e.id === equipementId)
    if (!eq) return
    const existing = pendingEquipements.find((p) => p.equipementId === equipementId)
    if (existing) {
      setPendingEquipements((prev) =>
        prev.map((p) =>
          p.equipementId === equipementId ? { ...p, quantity: p.quantity + quantity } : p
        )
      )
    } else {
      setPendingEquipements((prev) => [...prev, { equipementId, name: eq.name, quantity }])
    }
    setCreateAttachEquipementId('')
    setCreateAttachQuantity(1)
  }

  function removePendingEquipement(equipementId: string, quantity?: number) {
    const existing = pendingEquipements.find((p) => p.equipementId === equipementId)
    if (!existing) return
    if (quantity == null || quantity >= existing.quantity) {
      setPendingEquipements((prev) => prev.filter((p) => p.equipementId !== equipementId))
    } else {
      setPendingEquipements((prev) =>
        prev.map((p) =>
          p.equipementId === equipementId ? { ...p, quantity: p.quantity - quantity } : p
        )
      )
    }
  }

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    const payload = {
      name: createForm.name.trim(),
      code: createForm.code?.trim() || null,
      type: createForm.type,
      capacity: Number(createForm.capacity) || 1,
      status: createForm.status ?? 'AVAILABLE',
      description: createForm.description?.trim() || null,
      positionX: null,
      positionY: null,
    }
    try {
      const created = await api<AdminSpace>('/admin/espaces', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      for (const p of pendingEquipements) {
        await api(`/admin/espaces/${created.id}/equipements`, {
          method: 'POST',
          body: JSON.stringify({ equipementId: p.equipementId, quantity: p.quantity }),
        })
      }
      toast.success('Espace créé')
      setCreateForm(defaultForm)
      setPendingEquipements([])
      setCreateAttachEquipementId('')
      setCreateAttachQuantity(1)
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Impossible d'enregistrer l'espace")
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !editingSpace) return
    const payload = {
      name: editForm.name.trim(),
      code: editForm.code?.trim() || null,
      type: editForm.type,
      capacity: Number(editForm.capacity) || 1,
      status: editForm.status,
      description: editForm.description?.trim() || null,
      positionX: editForm.positionX,
      positionY: editForm.positionY,
    }
    try {
      await api(`/admin/espaces/${editingSpace.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      toast.success('Espace mis à jour')
      closeEditModal()
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Impossible d'enregistrer l'espace")
    }
  }

  function openConfirmDeleteSpace(id: string) {
    if (!user) return
    setPendingDeleteSpaceId(id)
    setConfirmDeleteSpaceOpen(true)
  }

  async function performDeleteSpace() {
    if (!user || !pendingDeleteSpaceId) return
    try {
      await api(`/admin/espaces/${pendingDeleteSpaceId}`, { method: 'DELETE' })
      toast.success('Espace supprimé')
      if (editingSpace?.id === pendingDeleteSpaceId) closeEditModal()
      setConfirmDeleteSpaceOpen(false)
      setPendingDeleteSpaceId(null)
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Impossible de supprimer l'espace")
    }
  }

  async function handlePositionChange(spaceId: string, x: number, y: number) {
    if (!user) return
    try {
      await api(`/admin/espaces/${spaceId}`, {
        method: 'PATCH',
        body: JSON.stringify({ positionX: x, positionY: y }),
      })
      toast.success('Position enregistrée')
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Impossible de mettre à jour la position")
    }
  }

  const [attachEquipementId, setAttachEquipementId] = useState<string>('')
  const [attachQuantity, setAttachQuantity] = useState(1)

  async function handleAttachEquipement(equipementId: string, quantity: number) {
    if (!user || !editingSpace) return
    try {
      await api(`/admin/espaces/${editingSpace.id}/equipements`, {
        method: 'POST',
        body: JSON.stringify({ equipementId, quantity }),
      })
      toast.success('Équipement associé')
      setAttachEquipementId('')
      setAttachQuantity(1)
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Impossible d'associer l'équipement")
    }
  }

  async function handleDetachEquipement(equipementId: string, quantity?: number) {
    if (!user || !editingSpace) return
    try {
      const url =
        quantity != null
          ? `/admin/espaces/${editingSpace.id}/equipements/${equipementId}?quantity=${quantity}`
          : `/admin/espaces/${editingSpace.id}/equipements/${equipementId}`
      await api(url, { method: 'DELETE' })
      toast.success(quantity != null ? '1 unité retirée' : 'Équipement retiré')
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Impossible de retirer l'équipement")
    }
  }

  const currentEditingSpace = editingSpace ? spaces.find((s) => s.id === editingSpace.id) ?? editingSpace : null
  const equipementsWithAvailability = equipements.filter(
    (e) => (e.available ?? e.quantity) > 0
  )
  const pendingByEquipement = (id: string) =>
    pendingEquipements.filter((p) => p.equipementId === id).reduce((sum, p) => sum + p.quantity, 0)
  const equipementsAvailableForCreate = equipements.filter((e) => {
    const total = e.available ?? e.quantity
    const pending = pendingByEquipement(e.id)
    return total - pending > 0
  })
  const createSelectedEquipement = createAttachEquipementId
    ? equipements.find((e) => e.id === createAttachEquipementId)
    : null
  const createMaxAttachQuantity = createSelectedEquipement
    ? Math.max(
        0,
        (createSelectedEquipement.available ?? createSelectedEquipement.quantity) -
          pendingByEquipement(createSelectedEquipement.id)
      )
    : 1
  const selectedEquipement = attachEquipementId
    ? equipements.find((e) => e.id === attachEquipementId)
    : null
  const maxAttachQuantity = selectedEquipement
    ? selectedEquipement.available ?? selectedEquipement.quantity
    : 1

  async function loadHistory(spaceId: string, from: string, to: string) {
    if (!user) return
    if (!from || !to) {
      toast.error('Merci de sélectionner une période')
      return
    }
    setHistoryLoading(true)
    try {
      const params = new URLSearchParams({ from, to })
      const data = await api<
        {
          id: string
          spaceName: string
          seatCode: string | null
          startDatetime: string
          endDatetime: string
          title: string | null
          isPrivate: boolean
          isOwner: boolean
        }[]
      >(`/admin/spaces/${spaceId}/reservations?${params.toString()}`)
      setHistoryItems(data)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Impossible de charger les réservations')
    } finally {
      setHistoryLoading(false)
    }
  }

  async function exportHistory(spaceId: string, from: string, to: string) {
    if (!user) return
    if (!from || !to) {
      toast.error('Merci de sélectionner une période')
      return
    }
    try {
      const params = new URLSearchParams({ from, to })
      const blob = await apiBlob(`/admin/spaces/${spaceId}/reservations/export?${params.toString()}`)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'reservations-salle.pdf'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Impossible d'exporter le PDF")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Gestion des espaces</h1>
        <p className="text-muted-foreground text-sm">
          Créez, modifiez et disposez les salles et l&apos;open space sur le plan.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Nouvel espace</CardTitle>
            <CardDescription>Nom, type, capacité et description.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom</Label>
                <Input
                  id="name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  className="min-h-[44px] md:min-h-0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={createForm.code ?? ''}
                  onChange={(e) => setCreateForm((f) => ({ ...f, code: e.target.value }))}
                  className="min-h-[44px] md:min-h-0"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={createForm.type}
                  onValueChange={(v) => setCreateForm((f) => ({ ...f, type: v as SpaceType }))}
                  items={SPACE_TYPE_LABELS}
                >
                  <SelectTrigger className="min-h-[44px] md:min-h-0">
                    <SelectValue placeholder="Choisir le type" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SPACE_TYPE_LABELS) as SpaceType[]).map((t) => (
                      <SelectItem key={t} value={t}>
                        {SPACE_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacité</Label>
                <Input
                  id="capacity"
                  type="number"
                  min={1}
                  value={createForm.capacity}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      capacity: Number(e.target.value) || f.capacity,
                    }))
                  }
                  className="min-h-[44px] md:min-h-0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={createForm.description ?? ''}
                  onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                  className="min-h-[44px] md:min-h-0"
                />
              </div>
              <div className="space-y-2">
                <Label>Équipements à associer</Label>
                <div className="flex flex-wrap gap-2">
                  {pendingEquipements.map((p) => (
                    <span
                      key={p.equipementId}
                      className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm"
                    >
                      {p.name} × {p.quantity}
                      <button
                        type="button"
                        onClick={() => removePendingEquipement(p.equipementId, 1)}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label={`Retirer 1 ${p.name}`}
                        title="Retirer 1"
                      >
                        −1
                      </button>
                      <button
                        type="button"
                        onClick={() => removePendingEquipement(p.equipementId)}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label={`Retirer tout ${p.name}`}
                        title="Retirer tout"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                {equipementsAvailableForCreate.length > 0 && (
                  <div className="flex flex-wrap gap-2 items-end">
                    <Select
                      value={createAttachEquipementId}
                      onValueChange={(v) => {
                        setCreateAttachEquipementId(v ?? '')
                        const eq = equipements.find((e) => e.id === v)
                        const avail =
                          eq ? (eq.available ?? eq.quantity) - pendingByEquipement(eq.id) : 1
                        setCreateAttachQuantity(Math.min(createAttachQuantity, Math.max(1, avail)))
                      }}
                      items={Object.fromEntries(
                        equipementsAvailableForCreate.map((e) => [
                          e.id,
                          `${e.name} (${(e.available ?? e.quantity) - pendingByEquipement(e.id)} dispo.)`,
                        ])
                      )}
                    >
                      <SelectTrigger className="min-h-[44px] md:min-h-0 w-full max-w-[200px]">
                        <SelectValue placeholder="Ajouter un équipement" />
                      </SelectTrigger>
                      <SelectContent>
                        {equipementsAvailableForCreate.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.name} ({(e.available ?? e.quantity) - pendingByEquipement(e.id)} dispo.)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={1}
                        max={createMaxAttachQuantity}
                        value={createAttachQuantity}
                        onChange={(e) =>
                          setCreateAttachQuantity(
                            Math.max(
                              1,
                              Math.min(Number(e.target.value) || 1, createMaxAttachQuantity)
                            )
                          )
                        }
                        className="w-16 min-h-[44px] md:min-h-0"
                        disabled={!createAttachEquipementId}
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() =>
                          createAttachEquipementId &&
                          addPendingEquipement(
                            createAttachEquipementId,
                            Math.min(createAttachQuantity, createMaxAttachQuantity)
                          )
                        }
                        disabled={!createAttachEquipementId}
                        className="min-h-[44px] md:min-h-0"
                      >
                        Ajouter
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <Button type="submit" className="min-h-[44px] md:min-h-0">
                Créer
              </Button>
            </form>

            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Liste des espaces</h2>
                <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
                  Rafraîchir
                </Button>
              </div>
              <ul className="space-y-1 text-sm max-h-56 overflow-auto">
                {spaces.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-2 rounded-md border px-2 py-1"
                  >
                    <span className="truncate">
                      {s.name} {s.code ? `(${s.code})` : ''} · {s.capacity} {s.capacity <= 1 ? 'place' : 'places'}
                    </span>
                    <div className="flex gap-1">
                      <Button size="xs" variant="outline" onClick={() => openEditModal(s)}>
                        Modifier
                      </Button>
                      <Button size="xs" variant="ghost" onClick={() => openConfirmDeleteSpace(s.id)}>
                        Supprimer
                      </Button>
                    </div>
                  </li>
                ))}
                {spaces.length === 0 && !loading && (
                  <li className="text-muted-foreground text-xs">Aucun espace pour le moment.</li>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Dialog open={!!editingSpace} onOpenChange={(open) => !open && closeEditModal()}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Modifier l&apos;espace</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nom</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-code">Code</Label>
                <Input
                  id="edit-code"
                  value={editForm.code ?? ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, code: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={editForm.type}
                  onValueChange={(v) => setEditForm((f) => ({ ...f, type: v as SpaceType }))}
                  items={SPACE_TYPE_LABELS}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir le type" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SPACE_TYPE_LABELS) as SpaceType[]).map((t) => (
                      <SelectItem key={t} value={t}>
                        {SPACE_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-capacity">Capacité</Label>
                <Input
                  id="edit-capacity"
                  type="number"
                  min={1}
                  value={editForm.capacity}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      capacity: Number(e.target.value) || f.capacity,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={editForm.description ?? ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select
                  value={editForm.status ?? 'AVAILABLE'}
                  onValueChange={(v) => setEditForm((f) => ({ ...f, status: v as SpaceStatus }))}
                  items={SPACE_STATUS_LABELS}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir le statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SPACE_STATUS_LABELS) as SpaceStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {SPACE_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {currentEditingSpace && (
                <div className="space-y-2">
                  <Label>Équipements</Label>
                  <div className="flex flex-wrap gap-2">
                    {currentEditingSpace.equipements.map((eq) => (
                      <span
                        key={eq.id}
                        className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm"
                      >
                        {eq.name} × {eq.quantity}
                        <button
                          type="button"
                          onClick={() => handleDetachEquipement(eq.id, 1)}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label={`Retirer 1 ${eq.name}`}
                          title="Retirer 1"
                        >
                          −1
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDetachEquipement(eq.id)}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label={`Retirer tout ${eq.name}`}
                          title="Retirer tout"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  {equipementsWithAvailability.length > 0 && (
                    <div className="flex flex-wrap gap-2 items-end">
                      <Select
                        value={attachEquipementId}
                        onValueChange={(v) => {
                          setAttachEquipementId(v ?? '')
                          const eq = equipements.find((e) => e.id === v)
                          const avail = eq?.available ?? eq?.quantity ?? 1
                          setAttachQuantity(Math.min(attachQuantity, Math.max(1, avail)))
                        }}
                        items={Object.fromEntries(
                          equipementsWithAvailability.map((e) => [
                            e.id,
                            `${e.name} (${e.available ?? e.quantity} dispo.)`,
                          ])
                        )}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Ajouter un équipement" />
                        </SelectTrigger>
                        <SelectContent>
                          {equipementsWithAvailability.map((e) => (
                            <SelectItem key={e.id} value={e.id}>
                              {e.name} ({e.available ?? e.quantity} dispo.)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min={1}
                          max={maxAttachQuantity}
                          value={attachQuantity}
                          onChange={(e) =>
                            setAttachQuantity(
                              Math.max(1, Math.min(Number(e.target.value) || 1, maxAttachQuantity))
                            )
                          }
                          className="w-16"
                          disabled={!attachEquipementId}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() =>
                            attachEquipementId &&
                            handleAttachEquipement(
                              attachEquipementId,
                              Math.min(attachQuantity, maxAttachQuantity)
                            )
                          }
                          disabled={!attachEquipementId}
                        >
                          Ajouter
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeEditModal}>
                  Annuler
                </Button>
                <Button type="submit">Enregistrer</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>Disposition sur le plan</CardTitle>
            <CardDescription>
              Cliquez sur « Placer sur le plan » pour les espaces en attente, puis sur le plan pour
              choisir la position. Déplacez les espaces déjà placés pour les repositionner.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <AdminSpacesPlan spaces={spaces} onPositionChange={handlePositionChange} />

            {editingSpace && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold">Historique des réservations</h2>
                <form
                  className="flex flex-col gap-3 sm:flex-row sm:items-end"
                  onSubmit={(e) => {
                    e.preventDefault()
                    void loadHistory(editingSpace.id, historyFrom, historyTo)
                  }}
                >
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="history-from">Du</Label>
                    <Input
                      id="history-from"
                      type="date"
                      value={historyFrom}
                      onChange={(e) => setHistoryFrom(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="history-to">Au</Label>
                    <Input
                      id="history-to"
                      type="date"
                      value={historyTo}
                      onChange={(e) => setHistoryTo(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      className="min-h-[44px] md:min-h-0"
                      disabled={historyLoading}
                    >
                      Voir
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="min-h-[44px] md:min-h-0"
                      onClick={() =>
                        editingSpace && void exportHistory(editingSpace.id, historyFrom, historyTo)
                      }
                      disabled={historyLoading || !historyFrom || !historyTo}
                    >
                      Exporter en PDF
                    </Button>
                  </div>
                </form>

                <div className="border rounded-md overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Créneau</TableHead>
                        <TableHead>Poste</TableHead>
                        <TableHead>Titre</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyItems.map((r) => {
                        const start = new Date(r.startDatetime)
                        const end = new Date(r.endDatetime)
                        const dateStr = start.toLocaleDateString('fr-FR')
                        const timeStr = `${start.toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })} – ${end.toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}`
                        const title =
                          r.isPrivate && !r.isOwner
                            ? '(privé)'
                            : r.title ?? (r.isPrivate ? '(privé)' : '')
                        return (
                          <TableRow key={r.id}>
                            <TableCell>{dateStr}</TableCell>
                            <TableCell>{timeStr}</TableCell>
                            <TableCell>{r.seatCode ?? ''}</TableCell>
                            <TableCell>{title}</TableCell>
                          </TableRow>
                        )
                      })}
                      {!historyItems.length && (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center text-sm text-muted-foreground"
                          >
                            Aucune réservation pour cette période.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmDeleteSpaceOpen}
        onOpenChange={(open) => {
          setConfirmDeleteSpaceOpen(open)
          if (!open) setPendingDeleteSpaceId(null)
        }}
        title="Supprimer cet espace ?"
        description="Cette action est irréversible. L'espace et ses associations seront supprimés."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="destructive"
        onConfirm={performDeleteSpace}
      />
    </div>
  )
}

