import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ReservationDetail } from '@/types/reservation'
import { toast } from 'sonner'

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<ReservationDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    api<ReservationDetail>(`/reservations/${id}`)
      .then(setDetail)
      .catch(() => {
        toast.error('Réservation non trouvée ou accès refusé.')
        setDetail(null)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">Chargement…</p>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">Réservation non trouvée.</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Retour
          </Button>
          <Link to="/">
            <Button variant="outline">Accueil</Button>
          </Link>
        </div>
      </div>
    )
  }

  const maskPrivate = detail.isPrivate && !detail.isOwner && user?.role?.slug !== 'admin'
  const titleDisplay = maskPrivate ? '—' : (detail.title ?? '—')
  const userDisplay = maskPrivate ? 'Privé' : (detail.userName?.trim() || '—')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          ← Retour
        </Button>
        <Link to="/espaces">
          <Button variant="ghost" size="sm">
            Espaces
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">
            {titleDisplay === '—' ? 'Détail de la réservation' : titleDisplay}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-[auto_1fr]">
            <dt className="text-muted-foreground font-medium">Espace</dt>
            <dd className="font-medium">
              {detail.spaceName ? (
                <Link
                  to={`/espaces/${detail.spaceId}`}
                  className="text-primary underline underline-offset-2 hover:no-underline"
                >
                  {detail.spaceName}
                </Link>
              ) : (
                '—'
              )}
            </dd>

            {detail.seatCode && (
              <>
                <dt className="text-muted-foreground font-medium">Poste</dt>
                <dd className="font-medium">{detail.seatCode}</dd>
              </>
            )}

            <dt className="text-muted-foreground font-medium">Réservé par</dt>
            <dd className="font-medium">{userDisplay}</dd>

            <dt className="text-muted-foreground font-medium">Titre</dt>
            <dd>{titleDisplay}</dd>

            <dt className="text-muted-foreground font-medium">Réservation privée</dt>
            <dd>{detail.isPrivate ? 'Oui' : 'Non'}</dd>

            <dt className="text-muted-foreground font-medium">Début</dt>
            <dd>{formatDateTime(detail.startDatetime)}</dd>

            <dt className="text-muted-foreground font-medium">Fin</dt>
            <dd>{formatDateTime(detail.endDatetime)}</dd>

            {(detail.recurrenceRule || detail.recurrenceGroupId) && (
              <>
                <dt className="text-muted-foreground font-medium">Récurrence</dt>
                <dd>
                  Oui
                  {detail.recurrenceEndAt &&
                    ` jusqu'au ${new Date(detail.recurrenceEndAt).toLocaleDateString('fr-FR')}`}
                </dd>
              </>
            )}
          </dl>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link to={`/espaces/${detail.spaceId}`}>
              <Button variant="outline" size="sm">
                Voir l&apos;espace
              </Button>
            </Link>
            {user?.role?.slug === 'admin' && (
              <Link to="/admin" state={{ openReservationId: detail.id }}>
                <Button variant="outline" size="sm">
                  Ouvrir dans l&apos;admin
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
