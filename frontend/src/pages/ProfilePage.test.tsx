import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { ProfilePage } from '@/pages/ProfilePage'

vi.mock('@/lib/api', () => ({ api: vi.fn() }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockApi = vi.mocked(api)
const mockUpdateUser = vi.fn()

const mockUser = {
  id: '1',
  email: 'user@test.com',
  firstname: 'Jean',
  lastname: 'Dupont',
  phone: '0600000000',
  role: { slug: 'member' as const },
}

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const mockUseAuth = vi.mocked(useAuth)

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: mockUser,
      token: 'fake-token',
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      setToken: vi.fn(),
      updateUser: mockUpdateUser,
    } as ReturnType<typeof useAuth>)
  })

  it('affiche le formulaire pré-rempli (firstname, lastname, phone)', () => {
    render(<ProfilePage />)
    expect(screen.getByDisplayValue('Jean')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Dupont')).toBeInTheDocument()
    expect(screen.getByDisplayValue('0600000000')).toBeInTheDocument()
    expect(screen.getByLabelText('Prénom')).toBeInTheDocument()
    expect(screen.getByLabelText('Nom')).toBeInTheDocument()
    expect(screen.getByLabelText('Téléphone')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeInTheDocument()
  })

  it('à la soumission appelle PATCH /auth/me et updateUser avec la réponse', async () => {
    const updatedUser = { ...mockUser, firstname: 'Updated', lastname: 'Name' }
    mockApi.mockResolvedValue(updatedUser)
    render(<ProfilePage />)
    await userEvent.clear(screen.getByLabelText('Prénom'))
    await userEvent.type(screen.getByLabelText('Prénom'), 'Updated')
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    await waitFor(() => {
      expect(mockApi).toHaveBeenCalledWith('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({
          firstname: 'Updated',
          lastname: 'Dupont',
          phone: '0600000000',
        }),
        token: 'fake-token',
      })
    })
    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith(updatedUser)
    })
  })
})
