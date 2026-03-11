import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Toaster } from '@/components/ui/sonner'
import { ReservationCalendar } from '@/components/ReservationCalendar'

function App() {
  return (
    <div className="min-h-screen p-6">
      <Toaster />
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">CoWork'Space</h1>
        <p className="text-muted-foreground">Réservation d’espaces – environnement de dev</p>
      </header>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Charte graphique</CardTitle>
            <CardDescription>Composants shadcn et couleurs de statut des espaces</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button>Primaire</Button>
            <Button variant="secondary">Secondaire</Button>
            <Button variant="outline">Outline</Button>
            <span className="inline-block size-8 rounded bg-status-available" title="Disponible" />
            <span className="inline-block size-8 rounded bg-status-reserved" title="Réservé" />
            <span className="inline-block size-8 rounded bg-status-occupied" title="Occupé" />
            <span className="inline-block size-8 rounded bg-status-unavailable" title="Indisponible" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Calendrier hebdomadaire</CardTitle>
            <CardDescription>Vue semaine (FullCalendar)</CardDescription>
          </CardHeader>
          <CardContent>
            <ReservationCalendar />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default App
