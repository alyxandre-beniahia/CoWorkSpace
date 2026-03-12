import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { api } from '@/lib/api'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'

vi.mock('@/lib/api', () => ({ api: vi.fn() }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router-dom')>()
  return { ...mod, useNavigate: () => mockNavigate }
})

const mockApi = vi.mocked(api)

function renderWithToken(tokenQuery: string) {
  return render(
    <MemoryRouter initialEntries={[`/reset-password${tokenQuery}`]}>
      <ResetPasswordPage />
    </MemoryRouter>,
  )
}

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('affiche le formulaire nouveau mot de passe et confirmation', () => {
    renderWithToken('?token=reset-token-123')
    expect(screen.getByText('Réinitialiser le mot de passe')).toBeInTheDocument()
    expect(screen.getByLabelText('Nouveau mot de passe')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirmation')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeInTheDocument()
  })

  it('soumission valide appelle POST /auth/reset-password et redirige vers /login', async () => {
    mockApi.mockResolvedValue({ message: 'Mot de passe mis à jour.' })
    renderWithToken('?token=reset-token-123')
    await userEvent.type(screen.getByLabelText('Nouveau mot de passe'), 'newpass123')
    await userEvent.type(screen.getByLabelText('Confirmation'), 'newpass123')
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    await waitFor(() => {
      expect(mockApi).toHaveBeenCalledWith('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token: 'reset-token-123', password: 'newpass123' }),
      })
    })
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true })
    })
  })
})
