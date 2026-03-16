import { useEffect, useMemo, useState } from "react";
import type { EventInput } from "@fullcalendar/core";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  ReservationCalendar,
  type CalendarSlot,
} from "@/components/ReservationCalendar";
import { api } from "@/lib/api";
import type { SpaceDetail } from "@/types/space";
import type {
  ReservationCalendarItem,
  ReservationDetail,
  CreateReservationBody,
  UpdateReservationBody,
  SeatItem,
} from "@/types/reservation";
import { getWeekRange, getWeekRangeApiParams } from "@/lib/date";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  buildRecurrenceRule,
  parseRecurrenceRule,
  toDatetimeLocal,
  type RecurrenceFreq,
} from "@/lib/recurrence";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export type { ReservationCalendarItem };

/** Map une réservation en événement calendrier (accueil : bleu = moi, rouge = autre). Titre affiché ; si résa d'un autre et privée → "Privée". */
function reservationToEvent(
  item: ReservationCalendarItem,
  currentUserRole?: string,
): EventInput {
  const isOwner = item.isOwner;
  const canEdit = isOwner || currentUserRole === "admin";

  const backgroundColor = isOwner ? "#2563eb" : "#dc2626";
  const borderColor = backgroundColor;
  const textColor = "#fff";

  // Titre pour toutes les réservations (y compris privées des autres, si l’API le renvoie)
  let title: string;
  if (!isOwner && item.isPrivate) {
    title = item.seatCode ? `Privée – ${item.seatCode}` : "Privée";
  } else if (item.seatCode) {
    title = `${item.title ?? "Réservation"} – ${item.seatCode}`;
  } else {
    title = item.title ?? item.effectiveTitle ?? "Réservation";
  }

  return {
    id: item.id,
    title,
    start: item.startDatetime,
    end: item.endDatetime,
    display: "block",
    backgroundColor,
    borderColor,
    textColor,
    extendedProps: {
      reservationId: item.id,
      isOwner,
      canEdit,
    },
  };
}

type HourSlot = {
  start: Date;
  end: Date;
  isBusy: boolean;
};

type SelectedReservation = {
  id: string;
  start: Date;
  end: Date;
};

type SpaceReservationsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  space: SpaceDetail | null;
};

export function SpaceReservationsModal({
  open,
  onOpenChange,
  space,
}: SpaceReservationsModalProps) {
  const { token, user } = useAuth();
  const isMobile = useMediaQuery(768);
  const calendarHeight: number | string = isMobile ? "77vh" : 450;
  const [events, setEvents] = useState<EventInput[]>([]);
  const [reservations, setReservations] = useState<ReservationCalendarItem[]>(
    [],
  );
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    () => getWeekRange(new Date()).start,
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<CalendarSlot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedReservation, setSelectedReservation] =
    useState<SelectedReservation | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFreq, setRecurrenceFreq] =
    useState<RecurrenceFreq>("daily");
  const [recurrenceWeekdays, setRecurrenceWeekdays] = useState<number[]>([]);
  const [recurrenceEndAt, setRecurrenceEndAt] = useState<Date | null>(null);
  const [seats, setSeats] = useState<SeatItem[]>([]);
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [reservationTitle, setReservationTitle] = useState("");
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailReservationId, setDetailReservationId] = useState<string | null>(null);
  const [detailReservation, setDetailReservation] = useState<ReservationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailEditing, setDetailEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editIsPrivate, setEditIsPrivate] = useState(false);
  const [editRecurring, setEditRecurring] = useState(false);
  const [editRecurrenceFreq, setEditRecurrenceFreq] = useState<RecurrenceFreq>("daily");
  const [editRecurrenceWeekdays, setEditRecurrenceWeekdays] = useState<number[]>([]);
  const [editRecurrenceEndAt, setEditRecurrenceEndAt] = useState<Date | null>(null);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);
  const [createReservationModalOpen, setCreateReservationModalOpen] = useState(false);
  const [manualCreateDate, setManualCreateDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [manualCreateStart, setManualCreateStart] = useState("09:00");
  const [manualCreateEnd, setManualCreateEnd] = useState("10:00");
  const [manualCreateTitle, setManualCreateTitle] = useState("");
  const [manualCreateIsPrivate, setManualCreateIsPrivate] = useState(false);
  const [manualCreateRecurring, setManualCreateRecurring] = useState(false);
  const [manualCreateRecurrenceFreq, setManualCreateRecurrenceFreq] =
    useState<RecurrenceFreq>("daily");
  const [manualCreateRecurrenceWeekdays, setManualCreateRecurrenceWeekdays] = useState<number[]>([]);
  const [manualCreateRecurrenceEndAt, setManualCreateRecurrenceEndAt] = useState<Date | null>(null);

  const isOpenSpace = space?.type === "OPEN_SPACE";

  useEffect(() => {
    if (!open || !space || !token) {
      setEvents([]);
      setReservations([]);
      setSelectedSlot(null);
      setSelectedReservation(null);
      setSeats([]);
      setSelectedSeatId(null);
      setIsRecurring(false);
      setRecurrenceFreq("daily");
      setRecurrenceWeekdays([]);
      setRecurrenceEndAt(null);
      return;
    }
    if (space.type === "OPEN_SPACE") {
      api<SeatItem[]>(`/spaces/${space.id}/seats`, { token })
        .then(setSeats)
        .catch(() => setSeats([]));
    } else {
      setSeats([]);
      setSelectedSeatId(null);
    }
    const { start, end } = getWeekRangeApiParams(currentWeekStart);
    const params = new URLSearchParams({
      spaceId: space.id,
      start,
      end,
      forPlan: "true",
    });
    api<ReservationCalendarItem[]>(`/reservations?${params.toString()}`, {
      token,
    })
      .then((items) => {
        setReservations(items);
        const mapped: EventInput[] = items.map((item) =>
          reservationToEvent(item, user?.role?.slug),
        );
        setEvents(mapped);
      })
      .catch(() => {
        setEvents([]);
      });
  }, [open, space, token, currentWeekStart]);

  useEffect(() => {
    if (!open) {
      setSelectedSlot(null);
      setSelectedDate(new Date());
      setSelectedReservation(null);
      setIsPrivate(false);
      setReservationTitle("");
      setDetailModalOpen(false);
      setDetailReservationId(null);
      setDetailReservation(null);
      setCreateReservationModalOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (!detailModalOpen || !detailReservationId || !token) {
      setDetailReservation(null);
      return;
    }
    setDetailLoading(true);
    setDetailReservation(null);
    api<ReservationDetail>(`/reservations/${detailReservationId}`, { token })
      .then(setDetailReservation)
      .catch(() => setDetailReservation(null))
      .finally(() => setDetailLoading(false));
  }, [detailModalOpen, detailReservationId, token]);

  const daySlots: HourSlot[] = useMemo(() => {
    const baseDate = selectedDate;
    const slots: HourSlot[] = [];
    const relevantReservations =
      isOpenSpace && selectedSeatId
        ? (reservations ?? []).filter((r) => r.seatId === selectedSeatId)
        : reservations ?? [];
    for (let hour = 8; hour < 20; hour++) {
      const start = new Date(baseDate);
      start.setHours(hour, 0, 0, 0);
      const end = new Date(baseDate);
      end.setHours(hour + 1, 0, 0, 0);
      const isBusy = relevantReservations.some((r) => {
        const evStart = new Date(r.startDatetime);
        const evEnd = new Date(r.endDatetime);
        return evStart < end && evEnd > start;
      });
      slots.push({ start, end, isBusy });
    }
    return slots;
  }, [reservations, selectedDate, isOpenSpace, selectedSeatId]);

  const { badgeLabel, badgeVariant } = useMemo(() => {
    if (daySlots.length === 0) {
      return {
        badgeLabel: "Disponible ce jour",
        badgeVariant: "default" as const,
      };
    }
    const busyCount = daySlots.filter((s) => s.isBusy).length;
    if (busyCount === 0) {
      return {
        badgeLabel: "Disponible ce jour",
        badgeVariant: "default" as const,
      };
    }
    if (busyCount === daySlots.length) {
      return {
        badgeLabel: "Occupée ce jour",
        badgeVariant: "destructive" as const,
      };
    }
    return {
      badgeLabel: "Partiellement occupée ce jour",
      badgeVariant: "secondary" as const,
    };
  }, [daySlots]);

  async function handleCreateReservation() {
    if (!space || !selectedSlot) return;
    if (!token) {
      toast.error("Vous devez être connecté pour faire une réservation.");
      return;
    }
    if (isOpenSpace && !selectedSeatId) {
      toast.error("Veuillez sélectionner un poste pour cet open space.");
      return;
    }
    setSubmitting(true);
    try {
      const body: CreateReservationBody = {
        spaceId: space.id,
        startDatetime: selectedSlot.start.toISOString(),
        endDatetime: selectedSlot.end.toISOString(),
        title: reservationTitle.trim() || null,
        isPrivate,
      };
      if (selectedSeatId) body.seatId = selectedSeatId;
      const wantRecurrence =
        isRecurring &&
        recurrenceEndAt &&
        recurrenceEndAt >= selectedSlot.start;
      if (wantRecurrence) {
        const rule = buildRecurrenceRule(
          recurrenceFreq,
          recurrenceFreq === "weekly" ? recurrenceWeekdays : []
        );
        if (rule) {
          body.recurrenceRule = rule;
          body.recurrenceEndAt = recurrenceEndAt.toISOString();
          try {
            const tz = Intl?.DateTimeFormat?.()?.resolvedOptions?.()?.timeZone;
            if (tz) body.timeZone = tz;
          } catch {
            // ignorer si timezone indisponible
          }
        }
      }
      const result = await api<{ created?: number; first?: unknown }>(
        "/reservations",
        {
          method: "POST",
          token,
          body: JSON.stringify(body),
        }
      );
      if (result && typeof result === "object" && "created" in result && typeof result.created === "number") {
        toast.success(`Série de ${result.created} créneaux réservée`);
      } else {
        toast.success("Créneau réservé");
      }
      // Rafraîchir les réservations pour mettre à jour le calendrier
      const { start, end } = getWeekRangeApiParams(currentWeekStart);
      const params = new URLSearchParams({
        spaceId: space.id,
        start,
        end,
        forPlan: "true",
      });
      const items = await api<ReservationCalendarItem[]>(
        `/reservations?${params.toString()}`,
        { token },
      );
      setReservations(items);
      const mapped: EventInput[] = items.map((item) =>
        reservationToEvent(item, user?.role?.slug),
      );
      setEvents(mapped);
      setSelectedSlot(null);
    } catch (e) {
      const isUnauthorized =
        e instanceof Error &&
        (e.message.includes("401") || e.message.toLowerCase().includes("unauthorized"));
      toast.error(
        isUnauthorized
          ? "Vous devez être connecté pour faire une réservation."
          : e instanceof Error
            ? e.message
            : "Impossible de créer la réservation",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateReservationManual() {
    if (!space || !token) {
      toast.error("Vous devez être connecté pour faire une réservation.");
      return;
    }
    if (isOpenSpace && !selectedSeatId) {
      toast.error("Veuillez sélectionner un poste pour cet open space.");
      return;
    }
    const start = new Date(`${manualCreateDate}T${manualCreateStart}`);
    const end = new Date(`${manualCreateDate}T${manualCreateEnd}`);
    if (end <= start) {
      toast.error("L'heure de fin doit être après l'heure de début.");
      return;
    }
    setSubmitting(true);
    try {
      const body: CreateReservationBody = {
        spaceId: space.id,
        startDatetime: start.toISOString(),
        endDatetime: end.toISOString(),
        title: manualCreateTitle.trim() || null,
        isPrivate: manualCreateIsPrivate,
      };
      if (selectedSeatId) body.seatId = selectedSeatId;
      const wantRecurrence =
        manualCreateRecurring &&
        manualCreateRecurrenceEndAt &&
        manualCreateRecurrenceEndAt >= start;
      if (wantRecurrence) {
        const rule = buildRecurrenceRule(
          manualCreateRecurrenceFreq,
          manualCreateRecurrenceFreq === "weekly" ? manualCreateRecurrenceWeekdays : [],
        );
        if (rule) {
          body.recurrenceRule = rule;
          body.recurrenceEndAt = manualCreateRecurrenceEndAt.toISOString();
          try {
            const tz = Intl?.DateTimeFormat?.()?.resolvedOptions?.()?.timeZone;
            if (tz) body.timeZone = tz;
          } catch {
            // ignorer
          }
        }
      }
      const result = await api<{ created?: number }>("/reservations", {
        method: "POST",
        token,
        body: JSON.stringify(body),
      });
      if (result && typeof result === "object" && "created" in result && typeof result.created === "number") {
        toast.success(`Série de ${result.created} créneaux réservée`);
      } else {
        toast.success("Créneau réservé");
      }
      const { start: s, end: e } = getWeekRangeApiParams(currentWeekStart);
      const params = new URLSearchParams({
        spaceId: space.id,
        start: s,
        end: e,
        forPlan: "true",
      });
      const items = await api<ReservationCalendarItem[]>(
        `/reservations?${params.toString()}`,
        { token },
      );
      setReservations(items);
      setEvents(items.map((item) => reservationToEvent(item, user?.role?.slug)));
      setCreateReservationModalOpen(false);
      setManualCreateTitle("");
      setManualCreateRecurring(false);
      setManualCreateRecurrenceEndAt(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Impossible de créer la réservation",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateReservation() {
    if (!space || !token || !selectedReservation) return;
    setSubmitting(true);
    try {
      const updateBody: UpdateReservationBody = {
        startDatetime: selectedReservation.start.toISOString(),
        endDatetime: selectedReservation.end.toISOString(),
      };
      await api(`/reservations/${selectedReservation.id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify(updateBody),
      });
      toast.success("Réservation mise à jour");
      const { start, end } = getWeekRangeApiParams(currentWeekStart);
      const params = new URLSearchParams({
        spaceId: space.id,
        start,
        end,
        forPlan: "true",
      });
      const items = await api<ReservationCalendarItem[]>(
        `/reservations?${params.toString()}`,
        { token },
      );
      setReservations(items);
      const mapped: EventInput[] = items.map((item) =>
        reservationToEvent(item, user?.role?.slug),
      );
      setEvents(mapped);
      setSelectedReservation(null);
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : "Impossible de modifier la réservation",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function openConfirmCancel(reservationId?: string) {
    const idToCancel = reservationId ?? detailReservationId ?? selectedReservation?.id;
    if (!space || !token || !idToCancel) return;
    setPendingCancelId(idToCancel);
    setConfirmCancelOpen(true);
  }

  async function performCancelReservation() {
    if (!space || !token || !pendingCancelId) return;
    setSubmitting(true);
    try {
      await api(`/reservations/${pendingCancelId}/annuler`, {
        method: "PATCH",
        token,
      });
      toast.success("Réservation annulée");
      const { start, end } = getWeekRangeApiParams(currentWeekStart);
      const params = new URLSearchParams({
        spaceId: space.id,
        start,
        end,
        forPlan: "true",
      });
      const items = await api<ReservationCalendarItem[]>(
        `/reservations?${params.toString()}`,
        { token },
      );
      setReservations(items);
      const mapped: EventInput[] = items.map((item) =>
        reservationToEvent(item, user?.role?.slug),
      );
      setEvents(mapped);
      setSelectedReservation(null);
      setDetailModalOpen(false);
      setDetailReservationId(null);
      setDetailReservation(null);
      setPendingCancelId(null);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Impossible d'annuler la réservation",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function startEditFromDetail() {
    if (!detailReservation) return;
    setEditTitle(detailReservation.title ?? "");
    setEditStart(toDatetimeLocal(detailReservation.startDatetime));
    setEditEnd(toDatetimeLocal(detailReservation.endDatetime));
    setEditIsPrivate(detailReservation.isPrivate ?? false);
    const parsed = parseRecurrenceRule(detailReservation.recurrenceRule);
    setEditRecurring(parsed.freq !== "none");
    setEditRecurrenceFreq(parsed.freq === "none" ? "daily" : parsed.freq);
    setEditRecurrenceWeekdays(parsed.weekdays);
    setEditRecurrenceEndAt(
      detailReservation.recurrenceEndAt ? new Date(detailReservation.recurrenceEndAt) : null,
    );
    setDetailEditing(true);
  }

  async function handleSaveDetailEdit() {
    if (!token || !detailReservationId || !detailReservation || !space) return;
    const start = new Date(editStart);
    const end = new Date(editEnd);
    if (end <= start) {
      toast.error("La date de fin doit être après la date de début.");
      return;
    }
    const rule =
      editRecurring && editRecurrenceEndAt && editRecurrenceEndAt >= start
        ? buildRecurrenceRule(
            editRecurrenceFreq,
            editRecurrenceFreq === "weekly" ? editRecurrenceWeekdays : [],
          )
        : null;
    setSubmitting(true);
    try {
      const body: UpdateReservationBody = {
        title: editTitle.trim() || null,
        startDatetime: start.toISOString(),
        endDatetime: end.toISOString(),
        isPrivate: editIsPrivate,
        recurrenceRule: rule,
        recurrenceEndAt: rule && editRecurrenceEndAt ? editRecurrenceEndAt.toISOString() : null,
      };
      await api(`/reservations/${detailReservationId}`, {
        method: "PATCH",
        token,
        body: JSON.stringify(body),
      });
      toast.success("Réservation mise à jour");
      setDetailEditing(false);
      const updated = await api<ReservationDetail>(`/reservations/${detailReservationId}`, {
        token,
      });
      setDetailReservation(updated);
      const { start: s, end: e } = getWeekRangeApiParams(currentWeekStart);
      const params = new URLSearchParams({
        spaceId: space.id,
        start: s,
        end: e,
        forPlan: "true",
      });
      const items = await api<ReservationCalendarItem[]>(`/reservations?${params.toString()}`, {
        token,
      });
      setReservations(items);
      setEvents(items.map((item) => reservationToEvent(item, user?.role?.slug)));
      if (selectedReservation?.id === detailReservationId) {
        setSelectedReservation({ id: detailReservationId, start, end });
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Impossible de modifier la réservation",
      );
    } finally {
      setSubmitting(false);
    }
  }


  if (!space) return null;

  const isAdmin = user?.role?.slug === "admin";
  const canEditDetail = detailReservation?.isOwner || isAdmin;
  const maskPrivateDetail =
    detailReservation?.isPrivate && !detailReservation?.isOwner && !isAdmin;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[90vw] max-w-5xl flex-col overflow-hidden sm:max-w-5xl">
        <DialogHeader className="shrink-0 pr-10">
          <DialogTitle className="flex flex-col gap-1.5 text-left">
            <div className="flex flex-col gap-0.5">
              <span>{space.name}</span>
              {space.code && (
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  {space.code}
                </span>
              )}
            </div>
            <Badge variant={badgeVariant} className="w-fit">
              {badgeLabel}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.9fr)]">
            <div className="space-y-3 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">
                  Détails de la salle
                </p>
                <p>Capacité : {space.capacity} place(s)</p>
                {space.description && (
                  <p className="mt-1">{space.description}</p>
                )}
              </div>
              {isOpenSpace && (
                <div className="flex flex-col gap-2 rounded-lg border bg-card p-3 text-sm">
                  <Label htmlFor="seat-select" className="font-medium text-foreground">
                    Poste
                  </Label>
                  {seats.length > 0 ? (
                    <Select
                      value={selectedSeatId ?? ""}
                      onValueChange={(v) => setSelectedSeatId(v || null)}
                    >
                      <SelectTrigger
                        id="seat-select"
                        className="min-h-[44px] md:min-h-0 w-full max-w-[200px]"
                      >
                        <SelectValue placeholder="Choisir un poste" />
                      </SelectTrigger>
                      <SelectContent>
                        {seats.map((seat) => (
                          <SelectItem key={seat.id} value={seat.id}>
                            {seat.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-muted-foreground text-xs">
                      Aucun poste configuré pour cet espace.
                    </p>
                  )}
                </div>
              )}
              {space.equipements.length > 0 && (
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Équipements</p>
                  <div className="flex flex-wrap gap-1">
                    {space.equipements.map((e, i) => (
                      <Badge key={`${e.name}-${i}`} variant="secondary">
                        {(e.quantity ?? 1) > 1 ? `${e.name} x${e.quantity}` : e.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <p className="font-medium text-foreground">Jour de référence</p>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => {
                    if (!d) return;
                    setSelectedDate(d);
                    const { start } = getWeekRange(d);
                    setCurrentWeekStart(start);
                  }}
                  className="border rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Tabs defaultValue="week" className="space-y-3">
                <TabsList>
                  <TabsTrigger value="day">Jour</TabsTrigger>
                  <TabsTrigger value="week">Semaine</TabsTrigger>
                </TabsList>
                <TabsContent value="week">
                  <div className="space-y-1 mb-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">
                        Calendrier des disponibilités (semaine)
                      </span>
                      <span className="text-muted-foreground">
                        Cliquez-glissez pour sélectionner un créneau libre
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <span
                          className="inline-flex h-3 w-3 rounded-sm"
                          style={{ backgroundColor: "#2563eb" }}
                        />
                        <span>Vos réservations</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span
                          className="inline-flex h-3 w-3 rounded-sm"
                          style={{ backgroundColor: "#dc2626" }}
                        />
                        <span>Réservé par un autre membre</span>
                      </div>
                    </div>
                  </div>
                  <ReservationCalendar
                    events={events}
                    height={calendarHeight}
                    selectable
                    editableEvents
                    displayEventTime={false}
                    compactTitles
                    onDatesSet={(start) => setCurrentWeekStart(getWeekRange(start).start)}
                    onSelectSlot={(slot) => {
                      if (isOpenSpace && !selectedSeatId) {
                        toast.error("Sélectionnez d'abord un poste.");
                        return;
                      }
                      const relevantReservations =
                        isOpenSpace && selectedSeatId
                          ? reservations.filter((r) => r.seatId === selectedSeatId)
                          : reservations;
                      const overlapsBusy = relevantReservations.some((r) => {
                        const start = new Date(r.startDatetime);
                        const end = new Date(r.endDatetime);
                        return start < slot.end && end > slot.start;
                      });
                      if (overlapsBusy) {
                        toast.error("Ce créneau est déjà réservé pour ce poste.");
                        return;
                      }
                      setSelectedSlot(slot);
                      setSelectedReservation(null);
                    }}
                    onEventClick={({ id, start, end }) => {
                      setSelectedReservation({ id, start, end });
                      setDetailReservationId(id);
                      setDetailModalOpen(true);
                      setSelectedSlot(null);
                    }}
                    onEventChange={({ id, start, end }) => {
                      setSelectedReservation({ id, start, end });
                      setSelectedSlot(null);
                    }}
                  />
                </TabsContent>
                <TabsContent value="day">
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">Vue jour (récapitulatif)</p>
                    <p className="text-muted-foreground">
                      La vue jour détaillée pourra lister ici les créneaux
                      occupés et libres pour la date sélectionnée.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setCreateReservationModalOpen(true)}
              >
                Créer une réservation
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-lg border bg-card p-3 text-sm">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">
                    Créneau sélectionné
                  </span>
                  {selectedSlot ? (
                    <span className="text-muted-foreground">
                      {selectedSlot.start.toLocaleString("fr-FR", {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      →{" "}
                      {selectedSlot.end.toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Sélectionnez un créneau libre dans le calendrier pour le
                      réserver.
                    </span>
                  )}
                </div>
                <Button
                  className="min-w-[180px]"
                  disabled={
                    !selectedSlot ||
                    submitting ||
                    (isOpenSpace && !selectedSeatId)
                  }
                  onClick={handleCreateReservation}
                >
                  {submitting ? "Réservation…" : "Réserver ce créneau"}
                </Button>
              </div>
              {selectedSlot && (
                <div className="grid gap-2">
                  <Label htmlFor="home-reservation-title" className="text-foreground">
                    Titre (optionnel)
                  </Label>
                  <Input
                    id="home-reservation-title"
                    type="text"
                    placeholder="Ex. Réunion équipe, focus…"
                    value={reservationTitle}
                    onChange={(e) => setReservationTitle(e.target.value)}
                    maxLength={200}
                    className="max-w-lg"
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="reservation-recurrence"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="size-4 rounded border-input"
                  aria-label="Répéter"
                />
                <Label
                  htmlFor="reservation-recurrence"
                  className="cursor-pointer text-muted-foreground font-normal"
                >
                  Répéter
                </Label>
              </div>
              {isRecurring && selectedSlot && (
                <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-3">
                  <div className="grid gap-2">
                    <Label htmlFor="recurrence-freq" className="text-foreground">
                      Fréquence
                    </Label>
                    <Select
                      value={recurrenceFreq}
                      onValueChange={(v) =>
                        setRecurrenceFreq(v as RecurrenceFreq)
                      }
                    >
                      <SelectTrigger
                        id="recurrence-freq"
                        className="min-h-[44px] md:min-h-0 w-full max-w-[200px]"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Quotidien</SelectItem>
                        <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {recurrenceFreq === "weekly" && (
                    <div className="grid gap-2">
                      <Label className="text-foreground">Jour(s)</Label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { i: 0, label: "Dim" },
                          { i: 1, label: "Lun" },
                          { i: 2, label: "Mar" },
                          { i: 3, label: "Mer" },
                          { i: 4, label: "Jeu" },
                          { i: 5, label: "Ven" },
                          { i: 6, label: "Sam" },
                        ].map(({ i, label }) => (
                          <label
                            key={i}
                            className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground"
                          >
                            <input
                              type="checkbox"
                              checked={recurrenceWeekdays.includes(i)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setRecurrenceWeekdays((prev) =>
                                    [...prev, i].sort((a, b) => a - b)
                                  );
                                } else {
                                  setRecurrenceWeekdays((prev) =>
                                    prev.filter((d) => d !== i)
                                  );
                                }
                              }}
                              className="size-4 rounded border-input"
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="grid gap-2">
                    <Label htmlFor="recurrence-end" className="text-foreground">
                      Répéter jusqu&apos;au
                    </Label>
                    <input
                      id="recurrence-end"
                      type="date"
                      min={selectedSlot.start.toISOString().slice(0, 10)}
                      value={
                        recurrenceEndAt
                          ? recurrenceEndAt.toISOString().slice(0, 10)
                          : ""
                      }
                      onChange={(e) => {
                        const v = e.target.value;
                        setRecurrenceEndAt(v ? new Date(v + "T23:59:59") : null);
                      }}
                      className="flex h-9 max-w-[200px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                    />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="reservation-private"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="size-4 rounded border-input"
                />
                <Label
                  htmlFor="reservation-private"
                  className="cursor-pointer text-muted-foreground font-normal"
                >
                  Réservation privée
                </Label>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-lg border bg-card p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col">
                <span className="font-medium text-foreground">
                  Réservation sélectionnée
                </span>
                {selectedReservation ? (
                  <span className="text-muted-foreground">
                    {selectedReservation.start.toLocaleString("fr-FR", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    →{" "}
                    {selectedReservation.end.toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    Cliquez sur une réservation ou déplacez-la dans le
                    calendrier pour la modifier ou l&apos;annuler.
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="min-w-0 shrink sm:min-w-[160px]"
                  disabled={!selectedReservation || submitting}
                  onClick={() => openConfirmCancel()}
                >
                  Annuler la réservation
                </Button>
                <Button
                  className="min-w-0 shrink sm:min-w-[160px]"
                  disabled={!selectedReservation || submitting}
                  onClick={handleUpdateReservation}
                >
                  {submitting
                    ? "Enregistrement…"
                    : "Enregistrer les modifications"}
                </Button>
              </div>
            </div>
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog
      open={createReservationModalOpen}
      onOpenChange={setCreateReservationModalOpen}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Créer une réservation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="manual-date" className="text-foreground">
              Date
            </Label>
            <input
              id="manual-date"
              type="date"
              value={manualCreateDate}
              onChange={(e) => setManualCreateDate(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="manual-start" className="text-foreground">
                Heure de début
              </Label>
              <input
                id="manual-start"
                type="time"
                value={manualCreateStart}
                onChange={(e) => setManualCreateStart(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-end" className="text-foreground">
                Heure de fin
              </Label>
              <input
                id="manual-end"
                type="time"
                value={manualCreateEnd}
                onChange={(e) => setManualCreateEnd(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="manual-title" className="text-foreground">
              Titre (optionnel)
            </Label>
            <Input
              id="manual-title"
              type="text"
              placeholder="Ex. Réunion équipe, focus…"
              value={manualCreateTitle}
              onChange={(e) => setManualCreateTitle(e.target.value)}
              maxLength={200}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="manual-private"
              checked={manualCreateIsPrivate}
              onChange={(e) => setManualCreateIsPrivate(e.target.checked)}
              className="size-4 rounded border-input"
              aria-label="Réservation privée"
            />
            <Label
              htmlFor="manual-private"
              className="cursor-pointer font-normal text-muted-foreground"
            >
              Réservation privée
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="manual-recurrence"
              checked={manualCreateRecurring}
              onChange={(e) => setManualCreateRecurring(e.target.checked)}
              className="size-4 rounded border-input"
              aria-label="Répéter"
            />
            <Label
              htmlFor="manual-recurrence"
              className="cursor-pointer font-normal text-muted-foreground"
            >
              Répéter
            </Label>
          </div>
          {manualCreateRecurring && (
            <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-3">
              <div className="grid gap-2">
                <Label htmlFor="manual-recurrence-freq" className="text-foreground">
                  Fréquence
                </Label>
                <Select
                  value={manualCreateRecurrenceFreq}
                  onValueChange={(v) =>
                    setManualCreateRecurrenceFreq(v as RecurrenceFreq)
                  }
                >
                  <SelectTrigger
                    id="manual-recurrence-freq"
                    className="min-h-[44px] md:min-h-0 w-full max-w-[200px]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Quotidien</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {manualCreateRecurrenceFreq === "weekly" && (
                <div className="grid gap-2">
                  <Label className="text-foreground">Jour(s)</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { i: 0, label: "Dim" },
                      { i: 1, label: "Lun" },
                      { i: 2, label: "Mar" },
                      { i: 3, label: "Mer" },
                      { i: 4, label: "Jeu" },
                      { i: 5, label: "Ven" },
                      { i: 6, label: "Sam" },
                    ].map(({ i, label }) => (
                      <label
                        key={i}
                        className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground"
                      >
                        <input
                          type="checkbox"
                          checked={manualCreateRecurrenceWeekdays.includes(i)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setManualCreateRecurrenceWeekdays((prev) =>
                                [...prev, i].sort((a, b) => a - b),
                              );
                            } else {
                              setManualCreateRecurrenceWeekdays((prev) =>
                                prev.filter((d) => d !== i),
                              );
                            }
                          }}
                          className="size-4 rounded border-input"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="manual-recurrence-end" className="text-foreground">
                  Répéter jusqu&apos;au
                </Label>
                <input
                  id="manual-recurrence-end"
                  type="date"
                  min={manualCreateDate}
                  value={
                    manualCreateRecurrenceEndAt
                      ? manualCreateRecurrenceEndAt.toISOString().slice(0, 10)
                      : ""
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    setManualCreateRecurrenceEndAt(
                      v ? new Date(v + "T23:59:59") : null,
                    );
                  }}
                  className="flex h-9 max-w-[200px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                />
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              type="button"
              disabled={submitting}
              onClick={handleCreateReservationManual}
            >
              {submitting ? "Réservation…" : "Réserver"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateReservationModalOpen(false)}
            >
              Annuler
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog
      open={detailModalOpen}
      onOpenChange={(open) => {
        setDetailModalOpen(open);
        if (!open) {
          setDetailReservationId(null);
          setDetailEditing(false);
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Détail de la réservation</DialogTitle>
        </DialogHeader>
        {detailLoading ? (
          <p className="text-muted-foreground text-sm">Chargement…</p>
        ) : detailReservation ? (
          <div className="space-y-4">
            {detailEditing ? (
              <>
                <div className="grid gap-3 text-sm">
                  <div className="grid gap-2">
                    <Label htmlFor="detail-edit-title">Titre</Label>
                    <Input
                      id="detail-edit-title"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Ex. Réunion équipe"
                      maxLength={200}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="detail-edit-start">Début</Label>
                    <input
                      id="detail-edit-start"
                      type="datetime-local"
                      value={editStart}
                      onChange={(e) => setEditStart(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="detail-edit-end">Fin</Label>
                    <input
                      id="detail-edit-end"
                      type="datetime-local"
                      value={editEnd}
                      onChange={(e) => setEditEnd(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="detail-edit-private"
                      checked={editIsPrivate}
                      onChange={(e) => setEditIsPrivate(e.target.checked)}
                      className="size-4 rounded border-input"
                    />
                    <Label htmlFor="detail-edit-private" className="font-normal">
                      Réservation privée
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="detail-edit-recurrence"
                      checked={editRecurring}
                      onChange={(e) => setEditRecurring(e.target.checked)}
                      className="size-4 rounded border-input"
                    />
                    <Label htmlFor="detail-edit-recurrence" className="font-normal">
                      Répéter
                    </Label>
                  </div>
                  {editRecurring && (
                    <div className="grid gap-2 rounded-lg border border-border bg-muted/30 p-3">
                      <div className="grid gap-2">
                        <Label>Fréquence</Label>
                        <Select
                          value={editRecurrenceFreq}
                          onValueChange={(v) => setEditRecurrenceFreq(v as RecurrenceFreq)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Quotidien</SelectItem>
                            <SelectItem value="weekly">Hebdomadaire</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {editRecurrenceFreq === "weekly" && (
                        <div className="grid gap-2">
                          <Label>Jour(s)</Label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { i: 0, label: "Dim" },
                              { i: 1, label: "Lun" },
                              { i: 2, label: "Mar" },
                              { i: 3, label: "Mer" },
                              { i: 4, label: "Jeu" },
                              { i: 5, label: "Ven" },
                              { i: 6, label: "Sam" },
                            ].map(({ i, label }) => (
                              <label
                                key={i}
                                className="flex cursor-pointer items-center gap-1.5 text-sm"
                              >
                                <input
                                  type="checkbox"
                                  checked={editRecurrenceWeekdays.includes(i)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setEditRecurrenceWeekdays((prev) =>
                                        [...prev, i].sort((a, b) => a - b),
                                      );
                                    } else {
                                      setEditRecurrenceWeekdays((prev) =>
                                        prev.filter((d) => d !== i),
                                      );
                                    }
                                  }}
                                  className="size-4 rounded border-input"
                                />
                                {label}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="grid gap-2">
                        <Label>Répéter jusqu&apos;au</Label>
                        <input
                          type="date"
                          min={editStart.slice(0, 10)}
                          value={
                            editRecurrenceEndAt
                              ? editRecurrenceEndAt.toISOString().slice(0, 10)
                              : ""
                          }
                          onChange={(e) => {
                            const v = e.target.value;
                            setEditRecurrenceEndAt(v ? new Date(v + "T23:59:59") : null);
                          }}
                          className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleSaveDetailEdit}
                    disabled={submitting}
                  >
                    {submitting ? "Enregistrement…" : "Enregistrer"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setDetailEditing(false)}
                    disabled={submitting}
                  >
                    Annuler
                  </Button>
                </div>
              </>
            ) : (
              <>
                <dl className="grid gap-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Titre</dt>
                    <dd className="font-medium">
                      {maskPrivateDetail
                        ? "—"
                        : (detailReservation.title ?? "—")}
                    </dd>
                  </div>
                  {detailReservation.seatCode && (
                    <div>
                      <dt className="text-muted-foreground">Poste</dt>
                      <dd className="font-medium">{detailReservation.seatCode}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-muted-foreground">Réservé par</dt>
                    <dd className="font-medium">
                      {detailReservation.userName?.trim() ||
                        (maskPrivateDetail ? "Privé" : "—")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Début</dt>
                    <dd>
                      {new Date(detailReservation.startDatetime).toLocaleString("fr-FR", {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Fin</dt>
                    <dd>
                      {new Date(detailReservation.endDatetime).toLocaleString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Privée</dt>
                    <dd>{detailReservation.isPrivate ? "Oui" : "Non"}</dd>
                  </div>
                  {(detailReservation.recurrenceRule || detailReservation.recurrenceGroupId) && (
                    <div>
                      <dt className="text-muted-foreground">Récurrence</dt>
                      <dd>
                        Oui
                        {detailReservation.recurrenceEndAt &&
                          ` jusqu'au ${new Date(detailReservation.recurrenceEndAt).toLocaleDateString("fr-FR")}`}
                      </dd>
                    </div>
                  )}
                </dl>
                <div className="flex flex-wrap gap-2">
                  {canEditDetail ? (
                    <>
                      <Button variant="outline" onClick={startEditFromDetail}>
                        Modifier
                      </Button>
                      <Button
                        variant="destructive"
                        disabled={submitting}
                        onClick={() => openConfirmCancel()}
                      >
                        Annuler la réservation
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" onClick={() => setDetailModalOpen(false)}>
                      Fermer
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Réservation introuvable.</p>
        )}
      </DialogContent>
    </Dialog>

    <ConfirmDialog
      open={confirmCancelOpen}
      onOpenChange={(open) => {
        setConfirmCancelOpen(open);
        if (!open) setPendingCancelId(null);
      }}
      title="Annuler cette réservation ?"
      description="Cette action est irréversible. La réservation sera annulée."
      confirmLabel="Annuler la réservation"
      cancelLabel="Retour"
      variant="destructive"
      onConfirm={performCancelReservation}
      loading={submitting}
    />
    </>
  );
}
