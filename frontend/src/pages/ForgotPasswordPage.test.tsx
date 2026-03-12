import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'

vi.mock('@/lib/api', () => ({ api: vi.fn() }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockApi = vi.mocked(api)

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('affiche titre, description, champ email et bouton Envoyer', () => {
    render(<ForgotPasswordPage />)
    expect(screen.getByText('Mot de passe oublié')).toBeInTheDocument()
    expect(screen.getByText(/Indiquez votre email/)).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Envoyer' })).toBeInTheDocument()
  })

  it('à la soumission appelle POST /auth/forgot-password et affiche un message de succès', async () => {
    mockApi.mockResolvedValue({ message: 'Email envoyé.' })
    render(<ForgotPasswordPage />)
    await userEvent.type(screen.getByLabelText('Email'), 'user@test.com')
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer' }))
    await waitFor(() => {
      expect(mockApi).toHaveBeenCalledWith('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'user@test.com' }),
      })
    })
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled()
    })
  })
})
