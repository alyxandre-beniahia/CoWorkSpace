import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HomePage } from '@/pages/HomePage'
import { api } from '@/lib/api'

vi.mock('@/lib/api', () => ({ api: vi.fn() }))
vi.mock('react-konva', () => ({
  Stage: ({ children }: { children: React.ReactNode }) => <div data-testid="stage-mock">{children}</div>,
  Layer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Rect: () => <div data-testid="rect-mock" />,
  Text: () => null,
}))
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { role: { slug: 'member' } }, token: 'test-token', loading: false }),
}))

const mockApi = vi.mocked(api)

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('affiche le plan des espaces', async () => {
    mockApi
      .mockResolvedValueOnce([
        {
          id: 's1',
          name: 'Salle A',
          code: 'A01',
          type: 'MEETING_ROOM',
          capacity: 8,
          status: 'AVAILABLE',
          equipements: ['Vidéoprojecteur'],
        },
      ])
      .mockResolvedValueOnce([]) // reservations du jour

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText(/Plan des espaces/)).toBeInTheDocument()
    })

    expect(mockApi).toHaveBeenCalled()
  })
})

