import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import { FloorPlanSVG, type SpaceForPlan, type PublicPlanStatus } from '@/components/FloorPlanSVG'
import type { SpaceDetail, SpaceListItem } from '@/types/space'
import type { ReservationCalendarItem } from '@/types/reservation'
import { getDayRange, toIsoString } from '@/lib/date'
import { useAuth } from '@/contexts/AuthContext'

type HomeSpacesPlanProps = {
  onSelectSpace: (space: SpaceDetail) => void
}

export function HomeSpacesPlan({ onSelectSpace }: HomeSpacesPlanProps) {
  const { token } = useAuth()
  const [spaces, setSpaces] = useState<SpaceListItem[]>([])
  const [reservationsToday, setReservationsToday] = useState<ReservationCalendarItem[]>([])

  useEffect(() => {
    api<SpaceListItem[]>('/spaces')
      .then(setSpaces)
      .catch(() => setSpaces([]))
  }, [])

  useEffect(() => {
    if (!token) return
    const today = new Date()
    const { start, end } = getDayRange(today)
    const params = new URLSearchParams({
      start: toIsoString(start),
      end: toIsoString(end),
      forPlan: 'true',
    })
    api<ReservationCalendarItem[]>(`/reservations?${params.toString()}`, { token })
      .then(setReservationsToday)
      .catch(() => setReservationsToday([]))
  }, [token])

  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(interval)
  }, [])

  function getPublicStatus(space: SpaceListItem): PublicPlanStatus {
    if (space.type === 'OTHER') return 'other'

    const forSpace = reservationsToday.filter((r) => r.spaceId === space.id)

    // Logique spécifique pour les openspaces : couleur basée sur le taux d’occupation
    if (space.type === 'OPEN_SPACE') {
      const nowMs = now
      const overlappingNow = forSpace.filter((r) => {
        const start = new Date(r.startDatetime).getTime()
        const end = new Date(r.endDatetime).getTime()
        return start <= nowMs && nowMs < end
      })
      const occupiedSeatIds = new Set(
        overlappingNow
          .map((r) => r.seatId)
          .filter((id): id is string => Boolean(id))
      )
      const occupiedCount = occupiedSeatIds.size
      const capacity = space.capacity ?? 0
      if (capacity <= 0) return 'available'

      const ratio = occupiedCount / capacity

      if (ratio >= 0.8) return 'occupied' // quasi complet
      if (ratio > 0.3) return 'reserved' // partiellement occupé
      return 'available' // peu occupé
    }

    // Autres types : logique binaire simple
    const occupiedNow = forSpace.some((r) => {
      const start = new Date(r.startDatetime).getTime()
      const end = new Date(r.endDatetime).getTime()
      return start <= now && now < end
    })
    if (occupiedNow) return 'occupied'
    if (forSpace.length > 0) return 'reserved'
    return 'available'
  }

  const spacesForPlan: SpaceForPlan[] = useMemo(() => {
    if (spaces.length === 0) return []

    const nowMs = now

    return spaces.map((s) => {
      const forSpace = reservationsToday.filter((r) => r.spaceId === s.id)
      const overlappingNow = forSpace.filter((r) => {
        const start = new Date(r.startDatetime).getTime()
        const end = new Date(r.endDatetime).getTime()
        return start <= nowMs && nowMs < end
      })

      let availableSeatsNow: number | undefined
      if (s.type === 'OPEN_SPACE') {
        const occupiedSeatIds = new Set(
          overlappingNow
            .map((r) => r.seatId)
            .filter((id): id is string => Boolean(id))
        )
        const occupiedCount = occupiedSeatIds.size
        const capacity = s.capacity ?? 0
        const remaining = Math.max(0, capacity - occupiedCount)
        availableSeatsNow = remaining
      }

      return {
        id: s.id,
        name: s.name,
        code: s.code,
        type: s.type,
        capacity: s.capacity,
        status: s.status,
        positionX: s.positionX,
        positionY: s.positionY,
        publicStatus: getPublicStatus(s),
        availableSeatsNow,
      }
    })
  }, [spaces, reservationsToday, now])

  async function handleSelectSpace(space: SpaceForPlan) {
    try {
      const detail = await api<SpaceDetail>(`/spaces/${space.id}`)
      onSelectSpace(detail)
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Plan des espaces</h2>
        <p className="text-muted-foreground text-sm">
          Vue plan des espaces pour aujourd&apos;hui — cliquez pour réserver. Le nombre de
          places libres indiqué correspond au créneau actuel.
        </p>
      </div>
      <div className="mx-auto w-full max-w-[1200px]">
        <FloorPlanSVG
          spaces={spacesForPlan}
          mode="public"
          onSelectSpace={handleSelectSpace}
        />
      </div>
    </div>
  )
}
