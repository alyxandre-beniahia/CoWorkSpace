import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  SPACE_TYPE_LABELS,
  SPACE_STATUS_LABELS,
  SPACE_STATUS_CLASS,
  type SpaceDetail,
  type SpaceStatus,
  type SpaceType,
} from '@/types/space'
import { toast } from 'sonner'

export function SpaceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [space, setSpace] = useState<SpaceDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    api<SpaceDetail>(`/spaces/${id}`)
      .then(setSpace)
      .catch(() => toast.error('Espace non trouvé'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">Chargement…</p>
      </div>
    )
  }

  if (!space) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">Espace non trouvé.</p>
        <Link to="/espaces">
          <Button variant="outline">Retour aux espaces</Button>
        </Link>
      </div>
    )
  }

  const statusLabel = SPACE_STATUS_LABELS[space.status as SpaceStatus]
  const statusClass = SPACE_STATUS_CLASS[space.status as SpaceStatus]
  const capacityLabel = space.capacity <= 1 ? 'place' : 'places'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link to="/espaces">
          <Button variant="ghost" size="sm">← Espaces</Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{space.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-[auto_1fr]">
            <dt className="text-muted-foreground font-medium">Code</dt>
            <dd className="font-medium">{space.code ?? '—'}</dd>

            <dt className="text-muted-foreground font-medium">Type</dt>
            <dd className="font-medium">{SPACE_TYPE_LABELS[space.type as SpaceType]}</dd>

            <dt className="text-muted-foreground font-medium">Statut</dt>
            <dd>
              <Badge className={statusClass} variant="secondary">
                {statusLabel}
              </Badge>
            </dd>

            <dt className="text-muted-foreground font-medium">Capacité</dt>
            <dd className="font-medium">{space.capacity} {capacityLabel}</dd>

            <dt className="text-muted-foreground font-medium">Description</dt>
            <dd className="text-muted-foreground">{space.description ?? '—'}</dd>

            <dt className="text-muted-foreground font-medium">Équipements</dt>
            <dd>
              {space.equipements.length > 0 ? (
                <ul className="list-disc list-inside text-muted-foreground">
                  {space.equipements.map((e, i) => (
                    <li key={`${e.name}-${i}`}>
                      {(e.quantity ?? 1) > 1 ? `${e.name} x${e.quantity}` : e.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-muted-foreground">Aucun</span>
              )}
            </dd>

            {(space.positionX != null || space.positionY != null) && (
              <>
                <dt className="text-muted-foreground font-medium">Position (plan)</dt>
                <dd className="font-medium">
                  X : {space.positionX ?? '—'}, Y : {space.positionY ?? '—'}
                </dd>
              </>
            )}
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
