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

const defaultEvents: EventInput[] = [];

export type CalendarSlot = {
  start: Date;
  end: Date;
};

type ReservationCalendarProps = {
  events?: EventInput[];
  height?: string | number;
  /** Active la sélection de créneaux libres. */
  selectable?: boolean;
  /** Callback lorsque l’utilisateur sélectionne un créneau dans le calendrier. */
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
};

export function ReservationCalendar({
  events = defaultEvents,
  height = 400,
  selectable = false,
  onSelectSlot,
  editableEvents = false,
  onEventClick,
  onEventChange,
}: ReservationCalendarProps) {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="timeGridWeek"
      locale="fr"
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek",
      }}
      events={events}
      height={height}
      /* On affiche toute la journée pour éviter de masquer des réservations
         à cause de décalages de fuseau horaire, mais on scrolle vers 08h. */
      slotMinTime="00:00:00"
      slotMaxTime="24:00:00"
      scrollTime="08:00:00"
      allDaySlot={false}
      selectable={selectable}
      selectMirror
      // On pourrait affiner pour empêcher la sélection qui chevauche un évènement,
      // mais dans un premier temps on laisse FullCalendar gérer le chevauchement.
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
        const extended: any = event.extendedProps ?? {};
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
        const extended: any = arg.event.extendedProps ?? {};
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
        const extended: any = arg.event.extendedProps ?? {};
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
