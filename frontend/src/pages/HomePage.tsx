import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SpacesPlanKonva } from '@/components/SpacesPlanKonva'
import { SpaceReservationsModal } from '@/components/SpaceReservationsModal'
import type { SpaceDetail } from '@/types/space'
import { useState } from 'react'

export function HomePage() {
  const { user, loading } = useAuth()
  const [selectedSpace, setSelectedSpace] = useState<SpaceDetail | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-muted-foreground">Chargement…</p>
      </div>
    )
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
        <CardHeader>
          <CardTitle>Plan des espaces</CardTitle>
          <CardDescription>
            Cliquez sur un espace pour voir ses disponibilités futures en calendrier hebdomadaire.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SpacesPlanKonva
            onSelectSpace={(space) => {
              setSelectedSpace(space)
              setModalOpen(true)
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
  )
}
