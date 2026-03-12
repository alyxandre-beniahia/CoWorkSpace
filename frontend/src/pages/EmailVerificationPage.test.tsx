import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { api } from '@/lib/api'
import { EmailVerificationPage } from '@/pages/EmailVerificationPage'

vi.mock('@/lib/api', () => ({ api: vi.fn() }))

const mockApi = vi.mocked(api)

function renderWithSearch(search: string) {
  return render(
    <MemoryRouter initialEntries={[`/verify-email${search}`]}>
      <EmailVerificationPage />
    </MemoryRouter>,
  )
}

describe('EmailVerificationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('appelle l’API verify-email avec le token en query au montage', async () => {
    mockApi.mockResolvedValue({ message: 'Email vérifié.' })
    renderWithSearch('?token=abc123')
    await waitFor(() => {
      expect(mockApi).toHaveBeenCalledWith('/auth/verify-email?token=abc123')
    })
  })

  it('affiche un message de succès quand l’API résout', async () => {
    mockApi.mockResolvedValue({ message: 'Email vérifié. Vous pouvez vous connecter.' })
    renderWithSearch('?token=abc123')
    await waitFor(() => {
      expect(screen.getByText(/Email vérifié/)).toBeInTheDocument()
    })
  })

  it('affiche un message d’erreur quand l’API rejette', async () => {
    mockApi.mockRejectedValue(new Error('Lien invalide ou expiré'))
    renderWithSearch('?token=abc123')
    await waitFor(() => {
      expect(screen.getByText(/Lien invalide ou expiré/)).toBeInTheDocument()
    })
  })

  it('sans token dans l’URL affiche Lien invalide et n’appelle pas l’API', () => {
    renderWithSearch('')
    expect(screen.getByText('Lien invalide')).toBeInTheDocument()
    expect(mockApi).not.toHaveBeenCalled()
  })
})
