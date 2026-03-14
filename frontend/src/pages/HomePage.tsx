import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { HomeSpacesPlan } from "@/components/HomeSpacesPlan";
import { SpaceReservationsModal } from "@/components/SpaceReservationsModal";
import type { SpaceDetail } from "@/types/space";
import { useState } from "react";

export function HomePage() {
  const { loading } = useAuth();
  const [selectedSpace, setSelectedSpace] = useState<SpaceDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-muted-foreground">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">CoWork'Space</h1>
        <p className="text-muted-foreground">
          Vue plan des espaces (aujourd&apos;hui) et disponibilités par salle
        </p>
      </div>
      <Card>
        <CardContent>
          <HomeSpacesPlan
            onSelectSpace={(space) => {
              setSelectedSpace(space);
              setModalOpen(true);
            }}
          />
        </CardContent>
      </Card>
      <SpaceReservationsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        space={selectedSpace}
      />
    </div>
  );
}
