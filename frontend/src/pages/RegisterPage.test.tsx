import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { api } from '@/lib/api'
import { RegisterPage } from '@/pages/RegisterPage'

vi.mock('@/lib/api', () => ({ api: vi.fn() }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router-dom')>()
  return { ...mod, useNavigate: () => mockNavigate }
})

const mockApi = vi.mocked(api)

function renderRegister() {
  return render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>,
  )
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('affiche le formulaire (titre Inscription, champs prénom, nom, email, mot de passe, confirmation, bouton)', () => {
    renderRegister()
    expect(screen.getByText('Inscription')).toBeInTheDocument()
    expect(screen.getByLabelText('Prénom')).toBeInTheDocument()
    expect(screen.getByLabelText('Nom')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirmation du mot de passe')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /s'inscrire/i })).toBeInTheDocument()
  })

  it('soumission valide appelle POST /auth/register et redirige vers /login', async () => {
    mockApi.mockResolvedValue({ message: 'ok' })
    renderRegister()
    await userEvent.type(screen.getByLabelText('Prénom'), 'Jean')
    await userEvent.type(screen.getByLabelText('Nom'), 'Dupont')
    await userEvent.type(screen.getByLabelText('Email'), 'jean@test.com')
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'password123')
    await userEvent.type(screen.getByLabelText('Confirmation du mot de passe'), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /s'inscrire/i }))
    await waitFor(() => {
      expect(mockApi).toHaveBeenCalledWith('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          firstname: 'Jean',
          lastname: 'Dupont',
          email: 'jean@test.com',
          password: 'password123',
        }),
      })
    })
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true })
    })
  })

  it('soumission avec mots de passe différents ne fait pas d’appel API', async () => {
    renderRegister()
    await userEvent.type(screen.getByLabelText('Prénom'), 'Jean')
    await userEvent.type(screen.getByLabelText('Nom'), 'Dupont')
    await userEvent.type(screen.getByLabelText('Email'), 'jean@test.com')
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'password123')
    await userEvent.type(screen.getByLabelText('Confirmation du mot de passe'), 'other')
    await userEvent.click(screen.getByRole('button', { name: /s'inscrire/i }))
    expect(mockApi).not.toHaveBeenCalled()
  })
})
