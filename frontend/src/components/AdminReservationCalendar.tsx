import { useEffect, useState } from 'react'
import type { EventInput } from '@fullcalendar/core'
import { ReservationCalendar, type CalendarSlot } from '@/components/ReservationCalendar'
import { AdminReservationDetailModal } from '@/components/AdminReservationDetailModal'
import { AdminCreateReservationModal } from '@/components/AdminCreateReservationModal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/lib/api'
import { getWeekRange, toIsoString } from '@/lib/date'
import { useAuth } from '@/contexts/AuthContext'
import type { SpaceListItem } from '@/types/space'

type ReservationListItem = {
  id: string
  spaceId: string
  spaceName: string
  seatId: string | null
  seatCode: string | null
  userId: string
  startDatetime: string
  endDatetime: string
  title: string | null
  isPrivate: boolean
  isOwner: boolean
}

/** Palette de couleurs distinctes pour différencier les salles dans le calendrier. */
const SPACE_COLORS = [
  'hsl(221, 83%, 53%)',   // bleu
  'hsl(142, 71%, 45%)',   // vert
  'hsl(280, 67%, 47%)',   // violet
  'hsl(25, 95%, 53%)',    // orange
  'hsl(340, 82%, 52%)',   // rose
  'hsl(47, 96%, 53%)',    // jaune
  'hsl(173, 80%, 40%)',   // teal
  'hsl(262, 83%, 58%)',   // indigo
  'hsl(0, 72%, 51%)',     // rouge
  'hsl(199, 89%, 48%)',   // cyan
]

/** Normalise un nom pour la comparaison (minuscules, sans accents). */
function normalizeSpaceName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

/** Couleurs fixes par nom d'espace (noms du seed : Open space principal, Salle Réunion A/B/C). */
const SPACE_NAME_COLORS: Record<string, string> = {
  'open space principal': 'hsl(280, 67%, 47%)',   // violet
  'salle reunion a': 'hsl(221, 83%, 53%)',         // bleu
  'salle reunion b': 'hsl(25, 95%, 53%)',         // orange
  'salle reunion c': 'hsl(47, 96%, 53%)',        // jaune
}

function colorForSpaceId(spaceId: string, spaceName?: string | null): string {
  if (spaceName != null) {
    const key = normalizeSpaceName(spaceName)
    const fixed = SPACE_NAME_COLORS[key]
    if (fixed) return fixed
  }
  let hash = 0
  for (let i = 0; i < spaceId.length; i++) hash = (hash << 5) - hash + spaceId.charCodeAt(i)
  const index = (hash >>> 0) % SPACE_COLORS.length
  return SPACE_COLORS[index]
}

export function AdminReservationCalendar() {
  const { token, user } = useAuth()
  const isAdmin = user?.role?.slug === 'admin'
  const [events, setEvents] = useState<EventInput[]>([])
  const [spaces, setSpaces] = useState<SpaceListItem[]>([])
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null)
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekRange(new Date()).start)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<CalendarSlot | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    api<SpaceListItem[]>('/spaces')
      .then(setSpaces)
      .catch(() => setSpaces([]))
  }, [])

  useEffect(() => {
    if (!token) return
    const { start, end } = getWeekRange(weekStart)
    const rangeStart = new Date(start)
    rangeStart.setDate(rangeStart.getDate() - 14)
    const rangeEnd = new Date(end)
    rangeEnd.setDate(rangeEnd.getDate() + 14)
    const params = new URLSearchParams({
      from: toIsoString(rangeStart),
      to: toIsoString(rangeEnd),
    })
    if (selectedSpaceId) params.set('spaceId', selectedSpaceId)

    api<ReservationListItem[]>(`/reservations?${params.toString()}`, { token })
      .then((items) => {
        const mapped: EventInput[] = items.map((item) => {
          const effectiveTitle =
            item.isPrivate && !item.isOwner && !isAdmin
              ? 'Occupé'
              : (item.title ?? 'Réservation')
          const color = colorForSpaceId(item.spaceId, item.spaceName)

          return {
            id: item.id,
            title: effectiveTitle,
            start: item.startDatetime,
            end: item.endDatetime,
            display: 'block',
            backgroundColor: color,
            borderColor: color,
            textColor: '#fff',
            extendedProps: {
              reservationId: item.id,
              isOwner: item.isOwner,
              canEdit: true,
              spaceName: item.spaceName,
            },
          }
        })
        setEvents(mapped)
      })
      .catch(() => setEvents([]))
  }, [token, weekStart, selectedSpaceId, refreshKey])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Planning des réservations</CardTitle>
        <CardDescription className="space-y-1">
          <span className="block">Vue d&apos;ensemble des réservations. Filtrez par espace. Glissez sur un créneau libre pour créer une réservation.</span>
          <span className="block">Pour des réservations plus précises, aller sur la page d&apos;accueil.</span>
        </CardDescription>
        <div className="pt-2">
          <Select
            value={selectedSpaceId ?? 'all'}
            onValueChange={(v) => setSelectedSpaceId(v === 'all' ? null : v)}
          >
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Tous les espaces">
                {selectedSpaceId === null || selectedSpaceId === 'all'
                  ? 'Tous les espaces'
                  : spaces.find((s) => s.id === selectedSpaceId)?.name ?? selectedSpaceId}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les espaces</SelectItem>
              {spaces.filter((s) => s.type !== 'OTHER').map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Légende :</span>
          {spaces.filter((s) => s.type !== 'OTHER').map((s) => (
            <span key={s.id} className="flex items-center gap-1.5">
              <span
                className="size-3 shrink-0 rounded-sm border border-white shadow-sm"
                style={{ backgroundColor: colorForSpaceId(s.id, s.name) }}
                aria-hidden
              />
              <span>{s.name}</span>
            </span>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ReservationCalendar
          events={events}
          height={630}
          slotEventOverlap={false}
          selectable
          selectOverlap
          editableEvents={false}
          displayEventTime={false}
          compactTitles
          onDatesSet={(start) => setWeekStart(getWeekRange(start).start)}
          onSelectSlot={(slot) => {
            setSelectedSlot(slot)
            setCreateModalOpen(true)
          }}
          onEventClick={({ id }) => {
            setSelectedReservationId(id)
            setDetailModalOpen(true)
          }}
        />
        <AdminReservationDetailModal
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          reservationId={selectedReservationId}
          onUpdated={() => setRefreshKey((k) => k + 1)}
        />
        <AdminCreateReservationModal
          open={createModalOpen}
          onOpenChange={(open) => {
            setCreateModalOpen(open)
            if (!open) setSelectedSlot(null)
          }}
          slot={selectedSlot}
          onCreated={() => setRefreshKey((k) => k + 1)}
        />
      </CardContent>
    </Card>
  )
}
