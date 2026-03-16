import { useEffect, useState } from 'react'
import { api, apiBlob } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'

type ReservationHistoryItem = {
  id: string
  spaceName: string
  seatCode: string | null
  startDatetime: string
  endDatetime: string
  title: string | null
  isPrivate: boolean
  isOwner: boolean
}

function toDateInputValue(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function MesReservationsPage() {
  const [from, setFrom] = useState<string>(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 3)
    return toDateInputValue(d)
  })
  const [to, setTo] = useState<string>(() => toDateInputValue(new Date()))
  const [items, setItems] = useState<ReservationHistoryItem[]>([])
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      const data = await api<ReservationHistoryItem[]>(`/reservations/history?${params.toString()}`)
      setItems(data)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Impossible de charger les réservations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleExport() {
    try {
      const params = new URLSearchParams()
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      const blob = await apiBlob(`/reservations/history/export?${params.toString()}`)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'mes-reservations.pdf'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Impossible d'exporter le PDF")
    }
  }

  return (
    <Card className="max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle>Mes réservations</CardTitle>
        <CardDescription>
          Consultez l&apos;historique de vos réservations et exportez-les au format PDF.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault()
            void load()
          }}
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="from" className="text-sm font-medium">
              Du
            </label>
            <Input
              id="from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="min-h-[44px] md:min-h-0"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="to" className="text-sm font-medium">
              Au
            </label>
            <Input
              id="to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="min-h-[44px] md:min-h-0"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="min-h-[44px] md:min-h-0" disabled={loading}>
              Filtrer
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px] md:min-h-0"
              onClick={() => void handleExport()}
              disabled={loading || !items.length}
            >
              Exporter en PDF
            </Button>
          </div>
        </form>

        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Créneau</TableHead>
                <TableHead>Espace</TableHead>
                <TableHead>Poste</TableHead>
                <TableHead>Titre</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((r) => {
                const start = new Date(r.startDatetime)
                const end = new Date(r.endDatetime)
                const dateStr = start.toLocaleDateString('fr-FR')
                const timeStr = `${start.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })} – ${end.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}`
                const title =
                  r.isPrivate && !r.isOwner ? '(privé)' : r.title ?? (r.isPrivate ? '(privé)' : '')
                return (
                  <TableRow key={r.id}>
                    <TableCell>{dateStr}</TableCell>
                    <TableCell>{timeStr}</TableCell>
                    <TableCell>{r.spaceName}</TableCell>
                    <TableCell>{r.seatCode ?? ''}</TableCell>
                    <TableCell>{title}</TableCell>
                  </TableRow>
                )
              })}
              {!items.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    Aucune réservation pour cette période.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

