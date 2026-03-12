import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { api } from '@/lib/api'
import { LoginPage } from '@/pages/LoginPage'
import { AuthProvider } from '@/contexts/AuthContext'

vi.mock('@/lib/api', () => ({ api: vi.fn() }))
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

const mockApi = vi.mocked(api)

function renderLogin() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('affiche le formulaire de connexion (titre, champs email et mot de passe)', async () => {
    renderLogin()
    await waitFor(() => {
      expect(screen.getByText('Connexion')).toBeInTheDocument()
    })
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Se connecter' })).toBeInTheDocument()
  })

  it('après submit valide, appelle login et redirige', async () => {
    const memberUser = {
      id: '1',
      email: 'member@test.com',
      firstname: 'M',
      lastname: 'T',
      role: { slug: 'member' as const },
    }
    mockApi.mockImplementation((path: string) => {
      if (path === '/auth/login') return Promise.resolve({ access_token: 'token' })
      if (path === '/auth/me') return Promise.resolve(memberUser)
      return Promise.reject(new Error('unknown'))
    })
    renderLogin()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument()
    })
    await userEvent.type(screen.getByLabelText(/email/i), 'member@test.com')
    await userEvent.type(screen.getByLabelText(/mot de passe/i), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /se connecter/i }))
    await waitFor(() => {
      expect(mockApi).toHaveBeenCalledWith('/auth/login', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'member@test.com', password: 'password123' }),
      }))
    })
  })
})
