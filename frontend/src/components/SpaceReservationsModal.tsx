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
  CreateReservationBody,
  UpdateReservationBody,
} from "@/types/reservation";
import { getWeekRange, toIsoString } from "@/lib/date";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type { ReservationCalendarItem };

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

  useEffect(() => {
    if (!open || !space || !token) {
      setEvents([]);
      setReservations([]);
      setSelectedSlot(null);
      setSelectedReservation(null);
      return;
    }
    const { start, end } = getWeekRange(currentWeekStart);
    const params = new URLSearchParams({
      spaceId: space.id,
      start: toIsoString(start),
      end: toIsoString(end),
    });
    api<ReservationCalendarItem[]>(`/reservations?${params.toString()}`, {
      token,
    })
      .then((items) => {
        setReservations(items);
        const mapped: EventInput[] = items
          .map((item) => {
            const isOwner = item.isOwner;
            const canEdit = isOwner || user?.role.slug === "admin";

            // Pour un autre membre non-admin : évènement de fond rouge semi-transparent
            if (!canEdit && !isOwner) {
              return {
                id: `bg-${item.id}`,
                start: item.startDatetime,
                end: item.endDatetime,
                display: "background",
                // Rouge plein pour bien signaler un créneau bloqué
                backgroundColor: "rgba(220, 38, 38, 1)",
              };
            }

            const backgroundColor = isOwner
              ? "hsl(var(--primary))"
              : "hsl(var(--destructive))";
            const borderColor = backgroundColor;
            const textColor = isOwner
              ? "hsl(var(--primary-foreground))"
              : "hsl(var(--destructive-foreground))";

            return {
              id: item.id,
              title: item.effectiveTitle ?? "Réservation",
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
          })
          .filter((e) => e != null) as EventInput[];
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
    }
  }, [open]);

  const daySlots: HourSlot[] = useMemo(() => {
    const baseDate = selectedDate;
    const slots: HourSlot[] = [];
    // créneaux d'1h de 08h à 20h (exclu)
    for (let hour = 8; hour < 20; hour++) {
      const start = new Date(baseDate);
      start.setHours(hour, 0, 0, 0);
      const end = new Date(baseDate);
      end.setHours(hour + 1, 0, 0, 0);
      const isBusy = reservations.some((r) => {
        const evStart = new Date(r.startDatetime);
        const evEnd = new Date(r.endDatetime);
        return evStart < end && evEnd > start;
      });
      slots.push({ start, end, isBusy });
    }
    return slots;
  }, [reservations, selectedDate]);

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
    if (!space || !token || !selectedSlot) return;
    setSubmitting(true);
    try {
      const body: CreateReservationBody = {
        spaceId: space.id,
        startDatetime: selectedSlot.start.toISOString(),
        endDatetime: selectedSlot.end.toISOString(),
        title: null,
        isPrivate,
      };
      await api("/reservations", {
        method: "POST",
        token,
        body: JSON.stringify(body),
      });
      toast.success("Créneau réservé");
      // Rafraîchir les réservations pour mettre à jour le calendrier
      const { start, end } = getWeekRange(currentWeekStart);
      const params = new URLSearchParams({
        spaceId: space.id,
        start: toIsoString(start),
        end: toIsoString(end),
      });
      const items = await api<ReservationCalendarItem[]>(
        `/reservations?${params.toString()}`,
        {
          token,
        },
      );
      setReservations(items);
      const mapped: EventInput[] = items
        .map((item) => {
          const isOwner = item.isOwner;
          const canEdit = isOwner || user?.role.slug === "admin";

          if (!canEdit && !isOwner) {
            return {
              id: `bg-${item.id}`,
              start: item.startDatetime,
              end: item.endDatetime,
              display: "background",
              backgroundColor: "rgba(220, 38, 38, 1)",
            };
          }

          const backgroundColor = isOwner
            ? "hsl(var(--primary))"
            : "hsl(var(--destructive))";
          const borderColor = backgroundColor;
          const textColor = isOwner
            ? "hsl(var(--primary-foreground))"
            : "hsl(var(--destructive-foreground))";

          return {
            id: item.id,
            title: item.effectiveTitle ?? "Réservation",
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
        })
        .filter((e) => e != null) as EventInput[];
      setEvents(mapped);
      setSelectedSlot(null);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Impossible de créer la réservation",
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
      const { start, end } = getWeekRange(currentWeekStart);
      const params = new URLSearchParams({
        spaceId: space.id,
        start: toIsoString(start),
        end: toIsoString(end),
      });
      const items = await api<ReservationCalendarItem[]>(
        `/reservations?${params.toString()}`,
        {
          token,
        },
      );
      setReservations(items);
      const mapped: EventInput[] = items
        .map((item) => {
          const isOwner = item.isOwner;
          const canEdit = isOwner || user?.role.slug === "admin";

          if (!canEdit && !isOwner) {
            return {
              id: `bg-${item.id}`,
              start: item.startDatetime,
              end: item.endDatetime,
              display: "background",
              backgroundColor: "rgba(220, 38, 38, 1)",
            };
          }

          const backgroundColor = isOwner
            ? "hsl(var(--primary))"
            : "hsl(var(--destructive))";
          const borderColor = backgroundColor;
          const textColor = isOwner
            ? "hsl(var(--primary-foreground))"
            : "hsl(var(--destructive-foreground))";

          return {
            id: item.id,
            title: item.effectiveTitle ?? "Réservation",
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
        })
        .filter((e) => e != null) as EventInput[];
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

  async function handleCancelReservation() {
    if (!space || !token || !selectedReservation) return;
    if (!window.confirm("Annuler cette réservation ?")) return;
    setSubmitting(true);
    try {
      await api(`/reservations/${selectedReservation.id}/annuler`, {
        method: "PATCH",
        token,
      });
      toast.success("Réservation annulée");
      const { start, end } = getWeekRange(currentWeekStart);
      const params = new URLSearchParams({
        spaceId: space.id,
        start: toIsoString(start),
        end: toIsoString(end),
      });
      const items = await api<ReservationCalendarItem[]>(
        `/reservations?${params.toString()}`,
        {
          token,
        },
      );
      setReservations(items);
      const mapped: EventInput[] = items
        .map((item) => {
          const isOwner = item.isOwner;
          const canEdit = isOwner || user?.role.slug === "admin";

          if (!canEdit && !isOwner) {
            return {
              id: `bg-${item.id}`,
              start: item.startDatetime,
              end: item.endDatetime,
              display: "background",
              backgroundColor: "rgba(220, 38, 38, 1)",
            };
          }

          const backgroundColor = isOwner
            ? "hsl(var(--primary))"
            : "hsl(var(--destructive))";
          const borderColor = backgroundColor;
          const textColor = isOwner
            ? "hsl(var(--primary-foreground))"
            : "hsl(var(--destructive-foreground))";

          return {
            id: item.id,
            title: item.effectiveTitle ?? "Réservation",
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
        })
        .filter((e) => e != null) as EventInput[];
      setEvents(mapped);
      setSelectedReservation(null);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Impossible d'annuler la réservation",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!space) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-5xl sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex flex-col gap-1 text-left">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <span>{space.name}</span>
                {space.code && (
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">
                    {space.code}
                  </span>
                )}
              </div>
              <Badge variant={badgeVariant}>{badgeLabel}</Badge>
            </div>
          </DialogTitle>
        </DialogHeader>
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
              {space.equipements.length > 0 && (
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Équipements</p>
                  <div className="flex flex-wrap gap-1">
                    {space.equipements.map((e) => (
                      <Badge key={e.name} variant="secondary">
                        {e.name}
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
                        <span className="inline-flex h-3 w-3 rounded-sm bg-primary" />
                        <span>Vos réservations</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="inline-flex h-3 w-3 rounded-sm bg-destructive" />
                        <span>Réservé par un autre membre</span>
                      </div>
                    </div>
                  </div>
                  <ReservationCalendar
                    events={events}
                    height={450}
                    selectable
                    editableEvents
                    onSelectSlot={(slot) => {
                      // Empêche de sélectionner un créneau qui chevauche une réservation existante
                      const overlapsBusy = reservations.some((r) => {
                        const start = new Date(r.startDatetime);
                        const end = new Date(r.endDatetime);
                        return start < slot.end && end > slot.start;
                      });
                      if (overlapsBusy) {
                        toast.error("Ce créneau est déjà réservé");
                        return;
                      }
                      setSelectedSlot(slot);
                      setSelectedReservation(null);
                    }}
                    onEventClick={({ id, start, end, canEdit }) => {
                      if (!canEdit) {
                        toast.error(
                          "Vous ne pouvez pas modifier cette réservation",
                        );
                        return;
                      }
                      setSelectedReservation({ id, start, end });
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
                  disabled={!selectedSlot || submitting}
                  onClick={handleCreateReservation}
                >
                  {submitting ? "Réservation…" : "Réserver ce créneau"}
                </Button>
              </div>
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
                  Réservation privée (visible uniquement par moi)
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
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="min-w-[160px]"
                  disabled={!selectedReservation || submitting}
                  onClick={handleCancelReservation}
                >
                  Annuler la réservation
                </Button>
                <Button
                  className="min-w-[160px]"
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
      </DialogContent>
    </Dialog>
  );
}
