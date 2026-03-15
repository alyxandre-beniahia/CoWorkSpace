import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'

type ActivityItem = {
  id: string
  createdAt: string
  action: string
  userName: string
  spaceName: string | null
  reservationStart: string | null
  reservationEnd: string | null
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'créé',
  UPDATE: 'modifié',
  CANCEL: 'annulé',
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatReservationSlot(start: string | null, end: string | null): string {
  if (!start || !end) return ''
  const s = new Date(start)
  const e = new Date(end)
  return `${s.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })} – ${e.toLocaleString('fr-FR', { timeStyle: 'short' })}`
}

export function AdminActivityFeed() {
  const { token } = useAuth()
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    const fetchActivity = () => {
      api<ActivityItem[]>('/admin/dashboard/activity', { token })
        .then(setItems)
        .catch(() => setItems([]))
        .finally(() => setLoading(false))
    }
    fetchActivity()
    const interval = setInterval(fetchActivity, 30000)
    return () => clearInterval(interval)
  }, [token])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activité récente</CardTitle>
        <CardDescription>
          Créations, modifications et annulations de réservations (rafraîchi toutes les 30 s)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-sm">Chargement…</p>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucune activité récente</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => {
              const actionLabel = ACTION_LABELS[item.action] ?? item.action
              const spacePart = item.spaceName ? ` la réservation de ${item.spaceName}` : ' une réservation'
              const slotPart = item.reservationStart && item.reservationEnd
                ? ` pour ${formatReservationSlot(item.reservationStart, item.reservationEnd)}`
                : ''
              return (
                <li key={item.id} className="text-sm border-b border-border pb-2 last:border-0 last:pb-0">
                  <span className="text-muted-foreground font-medium">
                    {formatDateTime(item.createdAt)}
                  </span>{' '}
                  <span className="font-medium">{item.userName}</span> a {actionLabel}
                  {spacePart}
                  {slotPart}
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
