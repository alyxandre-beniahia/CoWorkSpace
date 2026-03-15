import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { toast } from 'sonner'

type AdminEquipement = {
  id: string
  name: string
  quantity: number
  assigned?: number
  available?: number
}

const defaultForm = { name: '', quantity: 1 }

export function AdminEquipementsPage() {
  const { token } = useAuth()
  const [equipements, setEquipements] = useState<AdminEquipement[]>([])
  const [loading, setLoading] = useState(false)
  const [editingEquipement, setEditingEquipement] = useState<AdminEquipement | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  async function load() {
    if (!token) return
    setLoading(true)
    try {
      const data = await api<AdminEquipement[]>('/admin/equipements', { token })
      setEquipements(data)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Impossible de charger les équipements')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [token])

  function openEditModal(equipement: AdminEquipement) {
    setEditingEquipement(equipement)
    setForm({ name: equipement.name, quantity: equipement.quantity })
  }

  function closeEditModal() {
    setEditingEquipement(null)
    setForm(defaultForm)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    const quantity = Math.max(1, Math.floor(Number(form.quantity) || 1))
    const payload = { name: form.name.trim(), quantity }
    if (!payload.name) {
      toast.error('Le nom est requis')
      return
    }
    try {
      if (editingEquipement) {
        await api(`/admin/equipements/${editingEquipement.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
          token,
        })
        toast.success('Équipement mis à jour')
        closeEditModal()
      } else {
        await api('/admin/equipements', {
          method: 'POST',
          body: JSON.stringify(payload),
          token,
        })
        toast.success('Équipement créé')
        setForm(defaultForm)
      }
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Impossible d'enregistrer l'équipement")
    }
  }

  function openConfirmDelete(id: string) {
    if (!token) return
    setPendingDeleteId(id)
    setConfirmDeleteOpen(true)
  }

  async function performDeleteEquipement() {
    if (!token || !pendingDeleteId) return
    try {
      await api(`/admin/equipements/${pendingDeleteId}`, { method: 'DELETE', token })
      toast.success('Équipement supprimé')
      if (editingEquipement?.id === pendingDeleteId) closeEditModal()
      setConfirmDeleteOpen(false)
      setPendingDeleteId(null)
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Impossible de supprimer l'équipement")
    }
  }

  if (!token) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Gestion des équipements</h1>
        <p className="text-muted-foreground text-sm">
          Créez et modifiez les équipements (vidéoprojecteur, tableau, visio…)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nouvel équipement</CardTitle>
          <CardDescription>Nom et quantité totale en stock.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="min-h-[44px] md:min-h-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantité (stock total)</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: Math.max(1, Number(e.target.value) || 1) }))}
                className="min-h-[44px] md:min-h-0"
              />
            </div>
            <Button type="submit" className="min-h-[44px] md:min-h-0">
              Créer
            </Button>
          </form>

          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Liste des équipements</h2>
              <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
                Rafraîchir
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 pr-4 font-medium">Nom</th>
                    <th className="pb-2 pr-4 font-medium">Quantité totale</th>
                    <th className="pb-2 pr-4 font-medium">Assignés</th>
                    <th className="pb-2 pr-4 font-medium">Disponibles</th>
                    <th className="pb-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {equipements.map((e) => (
                    <tr key={e.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{e.name}</td>
                      <td className="py-3 pr-4">{e.quantity}</td>
                      <td className="py-3 pr-4">{e.assigned ?? 0}</td>
                      <td className="py-3 pr-4">{e.available ?? e.quantity}</td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="xs" variant="outline" onClick={() => openEditModal(e)}>
                            Modifier
                          </Button>
                          <Button size="xs" variant="ghost" onClick={() => openConfirmDelete(e.id)}>
                            Supprimer
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {equipements.length === 0 && !loading && (
                <p className="py-6 text-center text-muted-foreground text-sm">
                  Aucun équipement pour le moment.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editingEquipement} onOpenChange={(open) => !open && closeEditModal()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier l&apos;équipement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="modal-name">Nom</Label>
              <Input
                id="modal-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modal-quantity">Quantité (stock total)</Label>
              <Input
                id="modal-quantity"
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) =>
                  setForm((f) => ({ ...f, quantity: Math.max(1, Number(e.target.value) || 1) }))
                }
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeEditModal}>
                Annuler
              </Button>
              <Button type="submit">Enregistrer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={(open) => {
          setConfirmDeleteOpen(open)
          if (!open) setPendingDeleteId(null)
        }}
        title="Supprimer cet équipement ?"
        description="Cette action est irréversible. Les associations avec les espaces seront supprimées."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="destructive"
        onConfirm={performDeleteEquipement}
      />
    </div>
  )
}
