import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  SPACE_TYPE_LABELS,
  SPACE_STATUS_LABELS,
  SPACE_STATUS_CLASS,
  type SpaceListItem,
  type SpaceType,
  type SpaceStatus,
  type EquipementItem,
} from '@/types/space'
import { toast } from 'sonner'

type Filters = {
  type: SpaceType | ''
  equipementId: string
  capacityMin: string
  capacityMax: string
}

const defaultFilters: Filters = {
  type: '',
  equipementId: '',
  capacityMin: '',
  capacityMax: '',
}

function buildQuery(f: Filters): string {
  const params = new URLSearchParams()
  if (f.type) params.set('type', f.type)
  if (f.equipementId) params.set('equipementId', f.equipementId)
  if (f.capacityMin) params.set('capacityMin', f.capacityMin)
  if (f.capacityMax) params.set('capacityMax', f.capacityMax)
  const q = params.toString()
  return q ? `?${q}` : ''
}

export function EspacesPage() {
  const [spaces, setSpaces] = useState<SpaceListItem[]>([])
  const [equipments, setEquipments] = useState<EquipementItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Filters>(defaultFilters)

  useEffect(() => {
    api<EquipementItem[]>('/spaces/equipments')
      .then(setEquipments)
      .catch(() => toast.error('Impossible de charger les équipements'))
  }, [])

  useEffect(() => {
    setLoading(true)
    api<SpaceListItem[]>(`/spaces${buildQuery(filters)}`)
      .then(setSpaces)
      .catch(() => toast.error('Impossible de charger les espaces'))
      .finally(() => setLoading(false))
  }, [filters.type, filters.equipementId, filters.capacityMin, filters.capacityMax])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Espaces</h1>
        <p className="text-muted-foreground">Plan et liste des espaces, statut et équipements</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
          <CardDescription>Type, équipement, capacité</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={filters.type || 'all'}
              onValueChange={(v) => setFilters((f) => ({ ...f, type: (v === 'all' ? '' : v) as SpaceType | '' }))}
            >
              <SelectTrigger className="min-w-[180px] min-h-[44px] md:min-h-0">
                <SelectValue placeholder="Tous">
                  {filters.type ? SPACE_TYPE_LABELS[filters.type] : 'Tous'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {(Object.keys(SPACE_TYPE_LABELS) as SpaceType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {SPACE_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Équipement</Label>
            <Select
              value={filters.equipementId || 'all'}
              onValueChange={(v) => setFilters((f) => ({ ...f, equipementId: (v === 'all' ? '' : v) || '' }))}
            >
              <SelectTrigger className="min-w-[180px] min-h-[44px] md:min-h-0">
                <SelectValue placeholder="Tous">
                  {filters.equipementId
                    ? (equipments.find((e) => e.id === filters.equipementId)?.name ?? '')
                    : 'Tous'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {equipments.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Capacité min</Label>
            <Input
              type="number"
              min={0}
              placeholder="Min"
              value={filters.capacityMin}
              onChange={(e) => setFilters((f) => ({ ...f, capacityMin: e.target.value }))}
              className="w-24 min-h-[44px] md:min-h-0"
            />
          </div>
          <div className="space-y-2">
            <Label>Capacité max</Label>
            <Input
              type="number"
              min={0}
              placeholder="Max"
              value={filters.capacityMax}
              onChange={(e) => setFilters((f) => ({ ...f, capacityMax: e.target.value }))}
              className="w-24 min-h-[44px] md:min-h-0"
            />
          </div>
          <div className="space-y-2">
            <Label className="invisible select-none pointer-events-none">Réinitialiser</Label>
            <Button
              variant="outline"
              onClick={() => setFilters(defaultFilters)}
              className="min-h-[44px] md:min-h-0"
            >
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liste des espaces</CardTitle>
          <CardDescription>
            {loading ? 'Chargement…' : `${spaces.length} espace(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Chargement…</p>
          ) : spaces.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucun espace ne correspond aux filtres.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {spaces.map((space) => (
                <li key={space.id}>
                  <Link to={`/espaces/${space.id}`}>
                    <Card className="transition-colors hover:bg-muted/50">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base">{space.name}</CardTitle>
                          <Badge
                            className={SPACE_STATUS_CLASS[space.status as SpaceStatus]}
                            variant="secondary"
                          >
                            {SPACE_STATUS_LABELS[space.status as SpaceStatus]}
                          </Badge>
                        </div>
                        {(space.code || space.type) && (
                          <CardDescription>
                            {[space.code, SPACE_TYPE_LABELS[space.type as SpaceType]].filter(Boolean).join(' · ')}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="pt-0 text-sm text-muted-foreground">
                        <p>Capacité : {space.capacity} place(s)</p>
                        {space.equipements.length > 0 && (
                          <p className="mt-1">Équipements : {space.equipements.join(', ')}</p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
