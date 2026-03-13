import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SpaceReservationsModal } from '@/components/SpaceReservationsModal'
import type { SpaceDetail } from '@/types/space'
import { api } from '@/lib/api'

vi.mock('@/lib/api', () => ({ api: vi.fn() }))
vi.mock('@fullcalendar/react', () => ({
  __esModule: true,
  default: () => <div data-testid="fullcalendar-mock" />,
}))
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ token: 'test-token', user: { id: 'u1' }, loading: false }),
}))

const mockApi = vi.mocked(api)

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

describe('SpaceReservationsModal (UX réservation)', () => {
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
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SpaceReservationsModal } from '@/components/SpaceReservationsModal'
import type { SpaceDetail } from '@/types/space'
import { api } from '@/lib/api'

vi.mock('@/lib/api', () => ({ api: vi.fn() }))
vi.mock('@fullcalendar/react', () => ({
  __esModule: true,
  default: () => <div data-testid="fullcalendar-mock" />,
}))
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ token: 'test-token', user: null, loading: false }),
}))

const mockApi = vi.mocked(api)

const space: SpaceDetail = {
  id: 's1',
  name: 'Salle A',
  code: 'A01',
  type: 'MEETING_ROOM',
  capacity: 8,
  status: 'AVAILABLE',
  description: null,
  positionX: null,
  positionY: null,
  equipements: [{ name: 'Vidéoprojecteur' }],
}

describe('SpaceReservationsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('affiche les informations de base de la salle et appelle /reservations', async () => {
    mockApi.mockResolvedValueOnce([
      {
        id: 'r1',
        spaceId: 's1',
        userId: 'u1',
        startDatetime: new Date().toISOString(),
        endDatetime: new Date().toISOString(),
        isPrivate: false,
        title: 'Réunion',
        effectiveTitle: 'Réunion',
        isOwner: true,
      },
    ])

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
})

