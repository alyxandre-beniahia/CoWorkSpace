import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import type { EventInput } from '@fullcalendar/core'

const defaultEvents: EventInput[] = []

type ReservationCalendarProps = {
  events?: EventInput[]
  height?: string | number
}

export function ReservationCalendar({ events = defaultEvents, height = 400 }: ReservationCalendarProps) {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin]}
      initialView="timeGridWeek"
      locale="fr"
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek',
      }}
      events={events}
      height={height}
      slotMinTime="08:00:00"
      slotMaxTime="20:00:00"
    />
  )
}
