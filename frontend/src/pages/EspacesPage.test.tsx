import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { api } from '@/lib/api'
import { EspacesPage } from '@/pages/EspacesPage'

vi.mock('@/lib/api', () => ({ api: vi.fn() }))
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

const mockApi = vi.mocked(api)

function renderEspaces() {
  return render(
    <MemoryRouter>
      <EspacesPage />
    </MemoryRouter>,
  )
}

describe('EspacesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('affiche le titre et la section filtres', async () => {
    mockApi
      .mockResolvedValueOnce([]) // equipments
      .mockResolvedValueOnce([]) // spaces
    renderEspaces()
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Espaces' })).toBeInTheDocument()
    })
    expect(screen.getByText('Filtres')).toBeInTheDocument()
    expect(screen.getByText('Type, équipement, capacité')).toBeInTheDocument()
  })

  it('charge et affiche la liste des espaces', async () => {
    const spaces = [
      {
        id: 's1',
        name: 'Salle A',
        code: 'A01',
        type: 'MEETING_ROOM',
        capacity: 8,
        status: 'AVAILABLE',
        equipements: ['Vidéoprojecteur'],
      },
    ]
    mockApi
      .mockResolvedValueOnce([{ id: 'e1', name: 'Vidéoprojecteur' }])
      .mockResolvedValueOnce(spaces)
    renderEspaces()
    await waitFor(() => {
      expect(screen.getByText('Salle A')).toBeInTheDocument()
    })
    expect(screen.getByText(/disponible/i)).toBeInTheDocument()
    expect(screen.getByText(/8 place/i)).toBeInTheDocument()
  })

  it('affiche un message si aucun espace', async () => {
    mockApi
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
    renderEspaces()
    await waitFor(() => {
      expect(screen.getByText(/aucun espace ne correspond aux filtres/i)).toBeInTheDocument()
    })
  })
})
