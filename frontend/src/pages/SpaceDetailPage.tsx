import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link to="/espaces">
          <Button variant="ghost" size="sm">← Espaces</Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="text-2xl">{space.name}</CardTitle>
              <CardDescription>
                {[space.code, SPACE_TYPE_LABELS[space.type as SpaceType]].filter(Boolean).join(' · ')}
              </CardDescription>
            </div>
            <Badge className={statusClass} variant="secondary">
              {statusLabel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p><strong>Capacité :</strong> {space.capacity} place(s)</p>
          {space.description && (
            <p className="text-muted-foreground">{space.description}</p>
          )}
          {space.equipements.length > 0 && (
            <div>
              <strong>Équipements :</strong>
              <ul className="list-disc list-inside mt-1 text-muted-foreground">
                {space.equipements.map((e) => (
                  <li key={e.name}>{e.name}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
