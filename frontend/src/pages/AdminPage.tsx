import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminActivityFeed } from '@/components/AdminActivityFeed'
import { AdminReservationCalendar } from '@/components/AdminReservationCalendar'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { toast } from 'sonner'

type TopSpaceReserved = {
  spaceId: string
  spaceName: string
  count: number
}

type DashboardStats = {
  reservationsToday: number
  reservationsWeek: number
  occupancyRateWeek: number
  activeUsersCount: number
  topSpacesReserved: TopSpaceReserved[]
  cancelledReservationsWeek: number
}

export function AdminPage() {
  const { token } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    api<DashboardStats>('/admin/dashboard', { token })
      .then(setStats)
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : 'Impossible de charger les statistiques')
      })
      .finally(() => setLoading(false))
  }, [token])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground text-sm">
          Vue d&apos;ensemble des réservations et de l&apos;occupation
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Utilisateurs actifs</CardTitle>
            <CardDescription>Nombre de membres actifs</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-sm">Chargement…</p>
            ) : (
              <p className="text-3xl font-bold">{stats?.activeUsersCount ?? 0}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Réservations du jour</CardTitle>
            <CardDescription>Nombre de réservations pour aujourd&apos;hui</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-sm">Chargement…</p>
            ) : (
              <p className="text-3xl font-bold">{stats?.reservationsToday ?? 0}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Réservations de la semaine</CardTitle>
            <CardDescription>Nombre de réservations sur la semaine en cours</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-sm">Chargement…</p>
            ) : (
              <p className="text-3xl font-bold">{stats?.reservationsWeek ?? 0}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Taux d&apos;occupation de la semaine</CardTitle>
            <CardDescription>Pourcentage d&apos;utilisation des espaces sur la semaine en cours</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-sm">Chargement…</p>
            ) : (
              <p className="text-3xl font-bold">{stats?.occupancyRateWeek ?? 0} %</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Réservations annulées cette semaine</CardTitle>
            <CardDescription>Nombre d&apos;annulations sur la semaine en cours</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-sm">Chargement…</p>
            ) : (
              <p className="text-3xl font-bold">{stats?.cancelledReservationsWeek ?? 0}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 3 salles les plus réservées</CardTitle>
            <CardDescription>Salles avec le plus de réservations cette semaine</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-sm">Chargement…</p>
            ) : (stats?.topSpacesReserved?.length ?? 0) > 0 ? (
              <ol className="list-decimal list-inside space-y-1 text-sm">
                {stats?.topSpacesReserved.map((s) => (
                  <li key={s.spaceId}>
                    {s.spaceName} ({s.count} réservation{s.count > 1 ? 's' : ''})
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-muted-foreground text-sm">Aucune réservation cette semaine</p>
            )}
          </CardContent>
        </Card>
      </div>

      <AdminActivityFeed />

      <AdminReservationCalendar />
    </div>
  )
}
