import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { MesReservationsPage } from './MesReservationsPage'
import { AuthProvider } from '@/contexts/AuthContext'
import * as apiModule from '@/lib/api'

vi.mock('@/lib/api', () => ({
  api: vi.fn(),
  apiBlob: vi.fn().mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' })),
}))

function renderWithAuth(ui: React.ReactElement) {
  return render(<AuthProvider>{ui}</AuthProvider>)
}

describe('MesReservationsPage', () => {
  it('affiche un message quand il ny a pas de réservation', async () => {
    const apiMock = apiModule.api as unknown as ReturnType<typeof vi.fn>
    apiMock.mockResolvedValueOnce([])

    renderWithAuth(<MesReservationsPage />)

    await waitFor(() =>
      expect(
        screen.getByText('Aucune réservation pour cette période.'),
      ).toBeInTheDocument(),
    )
  })

  it('désactive le bouton export quand il ny a pas de réservation', async () => {
    const apiMock = apiModule.api as unknown as ReturnType<typeof vi.fn>
    apiMock.mockResolvedValueOnce([])

    renderWithAuth(<MesReservationsPage />)

    const button = await screen.findByText('Exporter en PDF')

    await waitFor(() => {
      expect(button).toBeDisabled()
    })
  })
})

