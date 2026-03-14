import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { FloorPlanSVG, type SpaceForPlan } from '@/components/FloorPlanSVG'
import type { SpaceDetail, SpaceListItem } from '@/types/space'
import type { ReservationCalendarItem } from '@/types/reservation'
import { getDayRange, toIsoString } from '@/lib/date'
import { useAuth } from '@/contexts/AuthContext'

type SpaceWithBusy = SpaceListItem & {
  isBusyToday?: boolean
}

type HomeSpacesPlanProps = {
  onSelectSpace: (space: SpaceDetail) => void
}

export function HomeSpacesPlan({ onSelectSpace }: HomeSpacesPlanProps) {
  const { token } = useAuth()
  const [spaces, setSpaces] = useState<SpaceWithBusy[]>([])

  useEffect(() => {
    api<SpaceListItem[]>('/spaces')
      .then((items) => {
        const extended: SpaceWithBusy[] = items.map((s) => ({
          ...s,
          isBusyToday: false,
        }))
        setSpaces(extended)
      })
      .catch(() => {
        setSpaces([])
      })
  }, [])

  useEffect(() => {
    if (!token || spaces.length === 0) return
    const today = new Date()
    const { start, end } = getDayRange(today)
    const params = new URLSearchParams({
      start: toIsoString(start),
      end: toIsoString(end),
    })
    api<ReservationCalendarItem[]>(`/reservations?${params.toString()}`, {
      token,
    })
      .then((items) => {
        const busyBySpace = new Set(items.map((r) => r.spaceId))
        setSpaces((prev) =>
          prev.map((s) => ({
            ...s,
            isBusyToday: busyBySpace.has(s.id),
          }))
        )
      })
      .catch(() => {})
  }, [token, spaces.length])

  const spacesForPlan: SpaceForPlan[] = spaces.map((s) => ({
    id: s.id,
    name: s.name,
    code: s.code,
    type: s.type,
    capacity: s.capacity,
    status: s.isBusyToday ? 'OCCUPIED' : s.status,
    positionX: s.positionX,
    positionY: s.positionY,
  }))

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
          Vue plan des espaces pour aujourd&apos;hui — cliquez pour réserver
        </p>
      </div>
      <FloorPlanSVG
        spaces={spacesForPlan}
        mode="public"
        onSelectSpace={handleSelectSpace}
      />
    </div>
  )
}
