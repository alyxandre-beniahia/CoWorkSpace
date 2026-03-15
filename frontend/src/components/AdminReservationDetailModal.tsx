"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
import type { ReservationDetail, UpdateReservationBody } from "@/types/reservation";
import { buildRecurrenceRule, type RecurrenceFreq } from "@/lib/recurrence";
import { toast } from "sonner";

type AdminReservationDetailModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservationId: string | null;
  onUpdated?: () => void;
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AdminReservationDetailModal({
  open,
  onOpenChange,
  reservationId,
  onUpdated,
}: AdminReservationDetailModalProps) {
  const { token } = useAuth();
  const [detail, setDetail] = useState<ReservationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editIsPrivate, setEditIsPrivate] = useState(false);
  const [editIsRecurring, setEditIsRecurring] = useState(false);
  const [editRecurrenceFreq, setEditRecurrenceFreq] = useState<RecurrenceFreq>("daily");
  const [editRecurrenceWeekdays, setEditRecurrenceWeekdays] = useState<number[]>([]);
  const [editRecurrenceEndAt, setEditRecurrenceEndAt] = useState<string>("");
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  useEffect(() => {
    if (!open || !reservationId || !token) {
      setDetail(null);
      setEditing(false);
      return;
    }
    setLoading(true);
    api<ReservationDetail>(`/reservations/${reservationId}`, { token })
      .then((data) => {
        setDetail(data);
        setEditStart(toDatetimeLocal(data.startDatetime));
        setEditEnd(toDatetimeLocal(data.endDatetime));
        setEditTitle(data.title ?? "");
        setEditIsPrivate(data.isPrivate);
        const hasRecurrence = Boolean(data.recurrenceRule || data.recurrenceGroupId);
        setEditIsRecurring(hasRecurrence);
        if (data.recurrenceRule?.includes("WEEKLY")) {
          setEditRecurrenceFreq("weekly");
          const byday = data.recurrenceRule.match(/BYDAY=([A-Z,]+)/)?.[1];
          if (byday) {
            const days = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
            setEditRecurrenceWeekdays(
              byday.split(",").map((d) => days.indexOf(d)).filter((i) => i >= 0),
            );
          }
        } else {
          setEditRecurrenceFreq("daily");
        }
        setEditRecurrenceEndAt(
          data.recurrenceEndAt
            ? new Date(data.recurrenceEndAt).toISOString().slice(0, 10)
            : "",
        );
      })
      .catch(() => {
        toast.error("Impossible de charger la réservation.");
        setDetail(null);
      })
      .finally(() => setLoading(false));
  }, [open, reservationId, token]);

  async function handleUpdate() {
    if (!token || !detail) return;
    const start = new Date(editStart);
    const end = new Date(editEnd);
    if (end <= start) {
      toast.error("La fin doit être après le début.");
      return;
    }
    if (editIsRecurring && !editRecurrenceEndAt) {
      toast.error("Indiquez jusqu'à quelle date répéter la réservation.");
      return;
    }
    setSubmitting(true);
    try {
      const body: UpdateReservationBody = {
        startDatetime: start.toISOString(),
        endDatetime: end.toISOString(),
        title: editTitle || null,
        isPrivate: editIsPrivate,
      };
      if (editIsRecurring && editRecurrenceEndAt) {
        const rule = buildRecurrenceRule(
          editRecurrenceFreq,
          editRecurrenceFreq === "weekly" ? editRecurrenceWeekdays : [],
        );
        if (rule) {
          body.recurrenceRule = rule;
          body.recurrenceEndAt = new Date(editRecurrenceEndAt + "T23:59:59").toISOString();
        }
      } else {
        body.recurrenceRule = null;
        body.recurrenceEndAt = null;
      }
      await api(`/reservations/${detail.id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify(body),
      });
      toast.success("Réservation mise à jour.");
      setEditing(false);
      const updated = await api<ReservationDetail>(`/reservations/${detail.id}`, {
        token,
      });
      setDetail(updated);
      onUpdated?.();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Impossible de modifier la réservation",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function openConfirmCancel() {
    if (!token || !detail) return;
    setConfirmCancelOpen(true);
  }

  async function performCancelReservation() {
    if (!token || !detail) return;
    setSubmitting(true);
    try {
      await api(`/reservations/${detail.id}/annuler`, {
        method: "PATCH",
        token,
      });
      toast.success("Réservation annulée.");
      setConfirmCancelOpen(false);
      onOpenChange(false);
      onUpdated?.();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Impossible d'annuler la réservation",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Détail de la réservation</DialogTitle>
        </DialogHeader>
        {loading && (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        )}
        {!loading && detail && (
          <div className="space-y-4">
            {!editing ? (
              <dl className="grid gap-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Espace</dt>
                  <dd className="font-medium">{detail.spaceName}</dd>
                </div>
                {detail.seatCode && (
                  <div>
                    <dt className="text-muted-foreground">Poste</dt>
                    <dd className="font-medium">{detail.seatCode}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-muted-foreground">Réservé par</dt>
                  <dd className="font-medium">
                    {detail.userName?.trim() ||
                      (detail.isPrivate && !detail.isOwner ? "Privé" : "—")}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Titre</dt>
                  <dd>{detail.title ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Privée</dt>
                  <dd>{detail.isPrivate ? "Oui" : "Non"}</dd>
                </div>
                {(detail.recurrenceGroupId || detail.recurrenceRule) && (
                  <div>
                    <dt className="text-muted-foreground">Récurrence</dt>
                    <dd>
                      Oui
                      {detail.recurrenceEndAt &&
                        ` jusqu'au ${new Date(detail.recurrenceEndAt).toLocaleDateString("fr-FR")}`}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-muted-foreground">Début</dt>
                  <dd>{formatDateTime(detail.startDatetime)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Fin</dt>
                  <dd>{formatDateTime(detail.endDatetime)}</dd>
                </div>
              </dl>
            ) : (
              <div className="space-y-3">
                <div className="grid gap-2">
                  <Label htmlFor="edit-start">Début</Label>
                  <input
                    id="edit-start"
                    type="datetime-local"
                    value={editStart}
                    onChange={(e) => setEditStart(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-end">Fin</Label>
                  <input
                    id="edit-end"
                    type="datetime-local"
                    value={editEnd}
                    onChange={(e) => setEditEnd(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-title">Titre</Label>
                  <input
                    id="edit-title"
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Optionnel"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editIsPrivate}
                    onChange={(e) => setEditIsPrivate(e.target.checked)}
                    className="size-4 rounded border-input"
                  />
                  Réservation privée
                </label>
                <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={editIsRecurring}
                      onChange={(e) => setEditIsRecurring(e.target.checked)}
                      className="size-4 rounded border-input"
                    />
                    Répéter
                  </label>
                  {editIsRecurring && (
                    <>
                      <div className="grid gap-2">
                        <Label className="text-xs">Fréquence</Label>
                        <Select
                          value={editRecurrenceFreq}
                          onValueChange={(v) =>
                            setEditRecurrenceFreq(v as RecurrenceFreq)
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
                      {editRecurrenceFreq === "weekly" && (
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
                                  className="size-3.5 rounded border-input"
                                />
                                {label}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="grid gap-2">
                        <Label htmlFor="edit-recurrence-end" className="text-xs">
                          Répéter jusqu&apos;au
                        </Label>
                        <input
                          id="edit-recurrence-end"
                          type="date"
                          value={editRecurrenceEndAt}
                          onChange={(e) => setEditRecurrenceEndAt(e.target.value)}
                          min={editStart.slice(0, 10)}
                          className="flex h-8 rounded-md border border-input bg-background px-2 text-sm"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        {!loading && detail && (
          <DialogFooter showCloseButton={false} className="flex flex-wrap gap-2">
            {editing ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(false)}
                  disabled={submitting}
                >
                  Abandonner
                </Button>
                <Button onClick={handleUpdate} disabled={submitting}>
                  {submitting ? "Enregistrement…" : "Enregistrer"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(true)}
                >
                  Modifier
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={openConfirmCancel}
                  disabled={submitting}
                >
                  Annuler la réservation
                </Button>
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>

    <ConfirmDialog
      open={confirmCancelOpen}
      onOpenChange={setConfirmCancelOpen}
      title="Annuler cette réservation ?"
      description="L'utilisateur en sera notifié. Cette action est irréversible."
      confirmLabel="Annuler la réservation"
      cancelLabel="Retour"
      variant="destructive"
      onConfirm={performCancelReservation}
      loading={submitting}
    />
  </>
  );
}
