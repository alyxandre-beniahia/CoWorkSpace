import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { SpacesPlanKonva } from '@/components/SpacesPlanKonva'
import type { SpaceType, SpaceStatus } from '@/types/space'
import { SPACE_TYPE_LABELS } from '@/types/space'
import { toast } from 'sonner'

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
}

const defaultForm: Omit<AdminSpace, 'id' | 'status'> & { status?: SpaceStatus } = {
  name: '',
  code: '',
  type: 'MEETING_ROOM',
  capacity: 4,
  description: '',
  positionX: null,
  positionY: null,
}

export function AdminEspacesPage() {
  const { token } = useAuth()
  const [spaces, setSpaces] = useState<AdminSpace[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(defaultForm)

  async function load() {
    if (!token) return
    setLoading(true)
    try {
      const data = await api<AdminSpace[]>('/admin/espaces', { token })
      setSpaces(data)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Impossible de charger les espaces')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [token])

  function startCreate() {
    setEditingId(null)
    setForm(defaultForm)
  }

  function startEdit(space: AdminSpace) {
    setEditingId(space.id)
    setForm({
      name: space.name,
      code: space.code ?? '',
      type: space.type,
      capacity: space.capacity,
      description: space.description ?? '',
      positionX: space.positionX,
      positionY: space.positionY,
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    const payload = {
      name: form.name.trim(),
      code: form.code?.trim() || null,
      type: form.type,
      capacity: Number(form.capacity) || 1,
      description: form.description?.trim() || null,
      positionX: form.positionX,
      positionY: form.positionY,
    }
    try {
      if (editingId) {
        await api(`/admin/espaces/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
          token,
        })
        toast.success('Espace mis à jour')
      } else {
        await api('/admin/espaces', {
          method: 'POST',
          body: JSON.stringify(payload),
          token,
        })
        toast.success('Espace créé')
      }
      await load()
      if (!editingId) setForm(defaultForm)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Impossible d'enregistrer l'espace")
    }
  }

  async function handleDelete(id: string) {
    if (!token) return
    if (!window.confirm('Supprimer cet espace ?')) return
    try {
      await api(`/admin/espaces/${id}`, { method: 'DELETE', token })
      toast.success('Espace supprimé')
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Impossible de supprimer l'espace")
    }
  }

  async function handlePositionChange(spaceId: string, x: number, y: number) {
    if (!token) return
    try {
      await api(`/admin/espaces/${spaceId}`, {
        method: 'PATCH',
        body: JSON.stringify({ positionX: x, positionY: y }),
        token,
      })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Impossible de mettre à jour la position")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gestion des espaces</h1>
        <p className="text-muted-foreground text-sm">
          Créez, modifiez et disposez les salles et l&apos;open space sur le plan.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.5fr)]">
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Modifier un espace' : 'Nouvel espace'}</CardTitle>
            <CardDescription>Nom, type, capacité et description.</CardDescription>
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
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={form.code ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  className="min-h-[44px] md:min-h-0"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm((f) => ({ ...f, type: v as SpaceType }))}
                >
                  <SelectTrigger className="min-h-[44px] md:min-h-0">
                    <SelectValue />
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
                  value={form.capacity}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, capacity: Number(e.target.value) || f.capacity }))
                  }
                  className="min-h-[44px] md:min-h-0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={form.description ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="min-h-[44px] md:min-h-0"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="min-h-[44px] md:min-h-0">
                  {editingId ? 'Mettre à jour' : 'Créer'}
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-[44px] md:min-h-0"
                    onClick={startCreate}
                  >
                    Annuler
                  </Button>
                )}
              </div>
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
                      {s.name} {s.code ? `(${s.code})` : ''} · {s.capacity}p
                    </span>
                    <div className="flex gap-1">
                      <Button size="xs" variant="outline" onClick={() => startEdit(s)}>
                        Modifier
                      </Button>
                      <Button size="xs" variant="ghost" onClick={() => handleDelete(s.id)}>
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

        <Card>
          <CardHeader>
            <CardTitle>Disposition sur le plan</CardTitle>
            <CardDescription>
              Faites glisser les salles pour ajuster leur position sur le plan. Les modifications
              sont enregistrées automatiquement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SpacesPlanKonva
              editable
              onSelectSpace={() => {}}
              onPositionChange={handlePositionChange}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

