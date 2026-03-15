import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type {
  DateSelectArg,
  EventClickArg,
  EventDropArg,
  EventInput,
} from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import type { ReservationEventExtendedProps } from "@/types/reservation";

const defaultEvents: EventInput[] = [];

export type CalendarSlot = {
  start: Date;
  end: Date;
};

type ReservationCalendarProps = {
  events?: EventInput[];
  height?: string | number;
  /** Afficher les événements qui se chevauchent côte à côte (false) ou superposés (true, défaut). */
  slotEventOverlap?: boolean;
  /** Active la sélection de créneaux libres. */
  selectable?: boolean;
  /** Callback lorsque l’utilisateur sélectionne un créneau dans le calendrier. */
  onDatesSet?: (start: Date, end: Date) => void;
  onSelectSlot?: (slot: CalendarSlot) => void;
  /** Active l’édition des évènements (drag & drop / resize). */
  editableEvents?: boolean;
  /** Clic sur un évènement de réservation. */
  onEventClick?: (info: {
    id: string;
    start: Date;
    end: Date;
    canEdit: boolean;
  }) => void;
  /** Drag & drop ou resize d’un évènement. */
  onEventChange?: (info: { id: string; start: Date; end: Date }) => void;
  /** Autoriser la sélection sur un créneau déjà occupé (ex. réserver un autre espace). Défaut false. */
  selectOverlap?: boolean;
};

export function ReservationCalendar({
  events = defaultEvents,
  height = 400,
  slotEventOverlap = true,
  selectable = false,
  onDatesSet,
  onSelectSlot,
  editableEvents = false,
  onEventClick,
  onEventChange,
  selectOverlap = false,
}: ReservationCalendarProps) {
  return (
    <FullCalendar
      className="reservation-calendar"
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="timeGridWeek"
      locale="fr"
      firstDay={1}
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek",
      }}
      views={{
        dayGridMonth: { buttonText: "Mois" },
        timeGridWeek: { buttonText: "Semaine" },
      }}
      events={events}
      height={height}
      datesSet={(arg) => {
        if (onDatesSet && arg.start && arg.end) onDatesSet(arg.start, arg.end);
      }}
      /* Réservations autorisées uniquement de 7h à 20h. */
      slotMinTime="07:00:00"
      slotMaxTime="20:00:00"
      scrollTime="07:00:00"
      allDaySlot={false}
      slotEventOverlap={slotEventOverlap}
      eventOrder={slotEventOverlap === false ? 'extendedProps.spaceName,title' : undefined}
      selectable={selectable}
      selectMirror
      selectOverlap={selectOverlap}
      // Si selectOverlap=false, les créneaux déjà occupés ne sont pas sélectionnables (US-RES-01).
      select={(arg: DateSelectArg) => {
        if (!onSelectSlot) return;
        onSelectSlot({ start: arg.start, end: arg.end });
      }}
      editable={editableEvents}
      eventClick={(arg: EventClickArg) => {
        if (!onEventClick) return;
        const { event } = arg;
        const start = event.start;
        const end = event.end;
        if (!start || !end) return;
        const extended = (event.extendedProps ?? {}) as ReservationEventExtendedProps;
        const canEdit = Boolean(extended.canEdit);
        onEventClick({
          id: String(event.id),
          start,
          end,
          canEdit,
        });
      }}
      eventDrop={(arg: EventDropArg) => {
        if (!onEventChange) return;
        const extended = (arg.event.extendedProps ?? {}) as ReservationEventExtendedProps;
        const canEdit = Boolean(extended.canEdit);
        if (!editableEvents || !canEdit) {
          arg.revert();
          return;
        }
        const start = arg.event.start;
        const end = arg.event.end;
        if (!start || !end) {
          arg.revert();
          return;
        }
        onEventChange({
          id: String(arg.event.id),
          start,
          end,
        });
      }}
      eventResize={(arg: EventResizeDoneArg) => {
        if (!onEventChange) return;
        const extended = (arg.event.extendedProps ?? {}) as ReservationEventExtendedProps;
        const canEdit = Boolean(extended.canEdit);
        if (!editableEvents || !canEdit) {
          arg.revert();
          return;
        }
        const start = arg.event.start;
        const end = arg.event.end;
        if (!start || !end) {
          arg.revert();
          return;
        }
        onEventChange({
          id: String(arg.event.id),
          start,
          end,
        });
      }}
    />
  );
}
