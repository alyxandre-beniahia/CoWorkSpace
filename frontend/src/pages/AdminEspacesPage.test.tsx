import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { AdminEspacesPage } from './AdminEspacesPage'
import { AuthProvider } from '@/contexts/AuthContext'
import * as apiModule from '@/lib/api'

vi.mock('@/lib/api', () => ({
  api: vi.fn().mockResolvedValue([]),
  apiBlob: vi.fn().mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' })),
}))

function renderWithAuth(ui: React.ReactElement) {
  return render(<AuthProvider>{ui}</AuthProvider>)
}

describe('AdminEspacesPage - bloc historique', () => {
  it('rend la page sans crasher', () => {
    renderWithAuth(<AdminEspacesPage />)
    expect(screen.getByText('Gestion des espaces')).toBeInTheDocument()
  })
})

