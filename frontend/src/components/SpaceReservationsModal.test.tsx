import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { SpaceReservationsModal } from '@/components/SpaceReservationsModal'
import type { SpaceDetail } from '@/types/space'
import { api } from '@/lib/api'
import { toast } from 'sonner'

vi.mock('@/lib/api', () => ({ api: vi.fn() }))
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ token: 'test-token', user: { id: 'u1', role: { slug: 'member' } }, loading: false }),
}))
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const testSlot = { start: new Date('2026-06-01T10:00:00'), end: new Date('2026-06-01T11:00:00') }

vi.mock('@/components/ReservationCalendar', () => ({
  ReservationCalendar: ({
    onSelectSlot,
  }: {
    onSelectSlot?: (slot: { start: Date; end: Date }) => void
  }) => (
    <div>
      <div data-testid="fullcalendar-mock" />
      <button
        type="button"
        onClick={() => onSelectSlot?.(testSlot)}
      >
        Sélectionner un créneau
      </button>
    </div>
  ),
}))

const mockApi = vi.mocked(api)
const mockToastError = vi.mocked(toast.error)
const mockToastSuccess = vi.mocked(toast.success)

const space: SpaceDetail = {
  id: 's1',
  name: 'Salle A',
  code: 'A01',
  type: 'MEETING_ROOM',
  capacity: 8,
  status: 'AVAILABLE',
  description: 'Salle de test',
  positionX: null,
  positionY: null,
  equipements: [{ name: 'Vidéoprojecteur' }],
}

describe('SpaceReservationsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('affiche les infos de la salle et charge les réservations', async () => {
    mockApi.mockResolvedValueOnce([]) // GET /reservations

    render(
      <MemoryRouter>
        <SpaceReservationsModal open={true} onOpenChange={() => {}} space={space} />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Salle A')).toBeInTheDocument()
    })
    expect(screen.getByText(/Capacité : 8 place/)).toBeInTheDocument()
    expect(mockApi).toHaveBeenCalled()
  })

  it('envoie le body sans récurrence quand "Répéter" est décoché', async () => {
    mockApi.mockResolvedValueOnce([]) // GET initial
    mockApi.mockResolvedValueOnce({ id: 'r1', startDatetime: '', endDatetime: '' }) // POST
    mockApi.mockResolvedValueOnce([]) // GET après création

    render(
      <MemoryRouter>
        <SpaceReservationsModal open={true} onOpenChange={() => {}} space={space} />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Salle A')).toBeInTheDocument())

    await userEvent.click(screen.getByText('Sélectionner un créneau'))
    await waitFor(() => expect(screen.getByRole('button', { name: /Réserver ce créneau/ })).not.toBeDisabled())

    await userEvent.click(screen.getByRole('button', { name: /Réserver ce créneau/ }))

    await waitFor(() => expect(mockApi).toHaveBeenCalledTimes(3))
    const postCall = mockApi.mock.calls.find((c) => (c[1] as { method?: string })?.method === 'POST')
    expect(postCall).toBeDefined()
    const body = JSON.parse((postCall![1] as { body: string }).body)
    expect(body).not.toHaveProperty('recurrenceRule')
    expect(body).not.toHaveProperty('recurrenceEndAt')
  })

  it('envoie recurrenceRule et recurrenceEndAt quand "Répéter" est coché avec fréquence et date', async () => {
    mockApi.mockResolvedValueOnce([]) // GET initial
    mockApi.mockResolvedValueOnce({ created: 3, recurrenceGroupId: 'g1', first: {} }) // POST
    mockApi.mockResolvedValueOnce([]) // GET après création

    render(
      <MemoryRouter>
        <SpaceReservationsModal open={true} onOpenChange={() => {}} space={space} />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Salle A')).toBeInTheDocument())

    await userEvent.click(screen.getByText('Sélectionner un créneau'))
    await waitFor(() => expect(screen.getByRole('button', { name: /Réserver ce créneau/ })).not.toBeDisabled())

    await userEvent.click(screen.getByLabelText('Répéter'))
    await waitFor(() => expect(screen.getByLabelText('Fréquence')).toBeInTheDocument())

    const endInput = screen.getByLabelText(/Répéter jusqu'au/)
    await userEvent.clear(endInput)
    await userEvent.type(endInput, '2026-06-15')

    await userEvent.click(screen.getByRole('button', { name: /Réserver ce créneau/ }))

    await waitFor(() => expect(mockApi).toHaveBeenCalledTimes(3))
    const postCall = mockApi.mock.calls.find((c) => (c[1] as { method?: string })?.method === 'POST')
    expect(postCall).toBeDefined()
    const body = JSON.parse((postCall![1] as { body: string }).body)
    expect(body.recurrenceRule).toBeDefined()
    expect(body.recurrenceEndAt).toBeDefined()
    expect(mockToastSuccess).toHaveBeenCalledWith(expect.stringContaining('Série'))
  })

  it('affiche le message d’erreur backend dans le toast en cas d’échec', async () => {
    const backendMessage = "Impossible de créer la série : le 02/06/2026 10:00 l'espace est déjà réservé. Choisissez d'autres dates ou un autre espace."
    mockApi.mockResolvedValueOnce([]) // GET initial
    mockApi.mockRejectedValueOnce(new Error(backendMessage)) // POST

    render(
      <MemoryRouter>
        <SpaceReservationsModal open={true} onOpenChange={() => {}} space={space} />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText('Salle A')).toBeInTheDocument())

    await userEvent.click(screen.getByText('Sélectionner un créneau'))
    await waitFor(() => expect(screen.getByRole('button', { name: /Réserver ce créneau/ })).not.toBeDisabled())

    await userEvent.click(screen.getByRole('button', { name: /Réserver ce créneau/ }))

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith(backendMessage))
  })
})

