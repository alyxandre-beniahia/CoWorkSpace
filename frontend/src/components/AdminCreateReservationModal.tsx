"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { CreateReservationBody, SeatItem } from "@/types/reservation";
import type { SpaceListItem } from "@/types/space";
import { toast } from "sonner";
import type { CalendarSlot } from "@/components/ReservationCalendar";
import {
  buildRecurrenceRule,
  type RecurrenceFreq,
} from "@/lib/recurrence";

type MemberItem = {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  isActive: boolean;
  role: { slug: string };
};

type AdminCreateReservationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot: CalendarSlot | null;
  onCreated?: () => void;
};

function formatSlot(slot: CalendarSlot) {
  return `${slot.start.toLocaleString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })} → ${slot.end.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function AdminCreateReservationModal({
  open,
  onOpenChange,
  slot,
  onCreated,
}: AdminCreateReservationModalProps) {
  const { token, user } = useAuth();
  const [spaces, setSpaces] = useState<SpaceListItem[]>([]);
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [seats, setSeats] = useState<SeatItem[]>([]);
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [seatId, setSeatId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFreq, setRecurrenceFreq] = useState<RecurrenceFreq>("daily");
  const [recurrenceWeekdays, setRecurrenceWeekdays] = useState<number[]>([]);
  const [recurrenceEndAt, setRecurrenceEndAt] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedSpace = spaces.find((s) => s.id === spaceId);
  const selectedMember = members.find((m) => m.id === userId);
  const isOpenSpace = selectedSpace?.type === "OPEN_SPACE";

  useEffect(() => {
    if (!open || !token) return;
    api<SpaceListItem[]>("/spaces")
      .then((list) => setSpaces(list.filter((s) => s.type !== "OTHER")))
      .catch(() => setSpaces([]));
    api<MemberItem[]>("/admin/membres?filter=members", { token })
      .then((list) => setMembers(Array.isArray(list) ? list : []))
      .catch(() => setMembers([]));
  }, [open, token]);

  useEffect(() => {
    if (!open) {
      setSpaceId(null);
      setUserId(user?.id ?? null);
      setSeatId(null);
      setSeats([]);
      setTitle("");
      setIsPrivate(false);
      setIsRecurring(false);
      setRecurrenceFreq("daily");
      setRecurrenceWeekdays([]);
      setRecurrenceEndAt(null);
    }
  }, [open, user?.id]);

  useEffect(() => {
    if (!open || !spaceId || selectedSpace?.type !== "OPEN_SPACE") {
      setSeats([]);
      setSeatId(null);
      return;
    }
    api<SeatItem[]>(`/spaces/${spaceId}/seats`, { token })
      .then(setSeats)
      .catch(() => setSeats([]));
  }, [open, spaceId, selectedSpace?.type, token]);

  useEffect(() => {
    if (user?.id && open && members.length && !userId) {
      setUserId(user.id);
    }
  }, [open, user?.id, members.length, userId]);

  async function handleSubmit() {
    if (!slot || !token) return;
    if (!spaceId) {
      toast.error("Veuillez choisir un espace.");
      return;
    }
    if (!userId) {
      toast.error("Veuillez choisir le bénéficiaire de la réservation.");
      return;
    }
    if (isOpenSpace && !seatId) {
      toast.error("Veuillez choisir un poste pour cet open space.");
      return;
    }
    setSubmitting(true);
    try {
      const body: CreateReservationBody = {
        spaceId,
        startDatetime: slot.start.toISOString(),
        endDatetime: slot.end.toISOString(),
        title: title.trim() || null,
        isPrivate,
        userId: userId,
      };
      if (seatId) body.seatId = seatId;
      const wantRecurrence =
        isRecurring &&
        recurrenceEndAt &&
        recurrenceEndAt >= slot.start;
      if (wantRecurrence) {
        const rule = buildRecurrenceRule(
          recurrenceFreq,
          recurrenceFreq === "weekly" ? recurrenceWeekdays : [],
        );
        if (rule) {
          body.recurrenceRule = rule;
          body.recurrenceEndAt = recurrenceEndAt.toISOString();
          try {
            const tz = Intl?.DateTimeFormat?.()?.resolvedOptions?.()?.timeZone;
            if (tz) body.timeZone = tz;
          } catch {
            // ignore
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
        toast.success("Réservation créée.");
      }
      onOpenChange(false);
      onCreated?.();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Impossible de créer la réservation",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle réservation</DialogTitle>
        </DialogHeader>
        {slot && (
          <>
            <p className="text-sm text-muted-foreground">
              Créneau sélectionné : <strong>{formatSlot(slot)}</strong>
            </p>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="create-space">Espace</Label>
                <Select
                  value={spaceId ?? ""}
                  onValueChange={(v) => {
                    setSpaceId(v || null);
                    setSeatId(null);
                  }}
                >
                  <SelectTrigger id="create-space">
                    <SelectValue placeholder="Choisir un espace">
                      {selectedSpace ? selectedSpace.name : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {spaces.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-user">Réservé pour</Label>
                <Select
                  value={userId ?? ""}
                  onValueChange={(v) => setUserId(v || null)}
                >
                  <SelectTrigger id="create-user" className="min-w-[200px]">
                    <span className="flex flex-1 truncate text-left">
                      {selectedMember
                        ? `${selectedMember.firstname} ${selectedMember.lastname} (${selectedMember.email})`
                        : "Choisir un membre"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {members.filter((m) => m.isActive).map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.firstname} {m.lastname} ({m.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {isOpenSpace && (
                <div className="grid gap-2">
                  <Label htmlFor="create-seat">Poste</Label>
                  <Select
                    value={seatId ?? ""}
                    onValueChange={(v) => setSeatId(v || null)}
                  >
                    <SelectTrigger id="create-seat">
                      <SelectValue placeholder="Choisir un poste">
                        {seats.find((s) => s.id === seatId)?.code ?? null}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {seats.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="create-title">Titre (optionnel)</Label>
                <input
                  id="create-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex. Réunion équipe"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="size-4 rounded border-input"
                />
                Réservation privée
              </label>
              <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="size-4 rounded border-input"
                  />
                  Répéter
                </label>
                {isRecurring && (
                  <>
                    <div className="grid gap-2">
                      <Label className="text-xs">Fréquence</Label>
                      <Select
                        value={recurrenceFreq}
                        onValueChange={(v) =>
                          setRecurrenceFreq(v as RecurrenceFreq)
                        }
                      >
                        <SelectTrigger className="h-8">
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
                        <Label className="text-xs">Jour(s)</Label>
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
                              className="flex cursor-pointer items-center gap-1.5 text-xs"
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
                      <Label htmlFor="recurrence-end" className="text-xs">
                        Répéter jusqu&apos;au
                      </Label>
                      <input
                        id="recurrence-end"
                        type="date"
                        min={slot.start.toISOString().slice(0, 10)}
                        value={
                          recurrenceEndAt
                            ? recurrenceEndAt.toISOString().slice(0, 10)
                            : ""
                        }
                        onChange={(e) => {
                          const v = e.target.value;
                          setRecurrenceEndAt(
                            v ? new Date(v + "T23:59:59") : null
                          );
                        }}
                        className="flex h-9 max-w-[200px] rounded-md border border-input bg-background px-3 py-1 text-sm"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
            <DialogFooter showCloseButton={false} className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Création…" : "Confirmer la réservation"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
