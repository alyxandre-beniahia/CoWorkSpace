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
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { ReservationDetail, UpdateReservationBody } from "@/types/reservation";
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
    setSubmitting(true);
    try {
      const body: UpdateReservationBody = {
        startDatetime: start.toISOString(),
        endDatetime: end.toISOString(),
        title: editTitle || null,
        isPrivate: editIsPrivate,
      };
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

  async function handleCancelReservation() {
    if (!token || !detail) return;
    if (
      !window.confirm(
        "Annuler cette réservation ? L'utilisateur en sera notifié.",
      )
    )
      return;
    setSubmitting(true);
    try {
      await api(`/reservations/${detail.id}/annuler`, {
        method: "PATCH",
        token,
      });
      toast.success("Réservation annulée.");
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
                    {detail.userName} ({detail.userEmail})
                  </dd>
                </div>

                {(detail.title || detail.isPrivate) && (
                  <>
                    {detail.title && (
                      <div>
                        <dt className="text-muted-foreground">Titre</dt>
                        <dd>{detail.title}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-muted-foreground">Privée</dt>
                      <dd>{detail.isPrivate ? "Oui" : "Non"}</dd>
                    </div>
                  </>
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
                  onClick={handleCancelReservation}
                  disabled={submitting}
                >
                  {submitting ? "Annulation…" : "Annuler la réservation"}
                </Button>
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
