import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { AdminMembresPage } from '@/pages/AdminMembresPage'

vi.mock('@/lib/api', () => ({ api: vi.fn() }))
vi.mock('@/contexts/AuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockApi = vi.mocked(api)
const mockUseAuth = vi.mocked(useAuth)

describe('AdminMembresPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({
      token: 'fake-token',
      user: { id: 'admin-1', email: 'admin@test.com', firstname: 'Admin', lastname: 'User', role: { slug: 'admin' as const } },
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      setToken: vi.fn(),
      updateUser: vi.fn(),
    } as ReturnType<typeof useAuth>)
  })

  it('au chargement appelle api avec filter=pending et filter=members et token', async () => {
    mockApi.mockResolvedValue([])
    render(<AdminMembresPage />)
    await waitFor(() => {
      expect(mockApi).toHaveBeenCalledWith('/admin/membres?filter=pending', { token: 'fake-token' })
      expect(mockApi).toHaveBeenCalledWith('/admin/membres?filter=members', { token: 'fake-token' })
    })
  })

  it('affiche les titres Inscriptions en attente et Membres', async () => {
    mockApi.mockResolvedValue([])
    render(<AdminMembresPage />)
    await waitFor(() => {
      expect(screen.getByText('Inscriptions en attente')).toBeInTheDocument()
      expect(screen.getByText('Membres')).toBeInTheDocument()
    })
  })

  it('affiche Aucune inscription en attente quand la liste pending est vide', async () => {
    mockApi.mockImplementation((url: string) => {
      if (url.includes('filter=pending')) return Promise.resolve([])
      if (url.includes('filter=members')) return Promise.resolve([])
      return Promise.reject(new Error('unknown'))
    })
    render(<AdminMembresPage />)
    await waitFor(() => {
      expect(screen.getByText('Aucune inscription en attente.')).toBeInTheDocument()
    })
  })

  it('affiche Aucun membre quand la liste members est vide', async () => {
    mockApi.mockResolvedValue([])
    render(<AdminMembresPage />)
    await waitFor(() => {
      expect(screen.getByText('Aucun membre.')).toBeInTheDocument()
    })
  })

  it('affiche noms et emails quand il y a des données mockées', async () => {
    const pendingList = [
      { id: 'p1', email: 'pending@test.com', firstname: 'Pending', lastname: 'User', isActive: false, emailVerifiedAt: new Date().toISOString(), approvedAt: null, role: { slug: 'member' } },
    ]
    const membersList = [
      { id: 'm1', email: 'member@test.com', firstname: 'Marie', lastname: 'Dupont', isActive: true, emailVerifiedAt: new Date().toISOString(), approvedAt: new Date().toISOString(), role: { slug: 'member' } },
    ]
    mockApi.mockImplementation((url: string) => {
      if (url.includes('filter=pending')) return Promise.resolve(pendingList)
      if (url.includes('filter=members')) return Promise.resolve(membersList)
      return Promise.reject(new Error('unknown'))
    })
    render(<AdminMembresPage />)
    await waitFor(() => {
      expect(screen.getByText('Pending User')).toBeInTheDocument()
      expect(screen.getByText('pending@test.com')).toBeInTheDocument()
      expect(screen.getByText('Marie Dupont')).toBeInTheDocument()
      expect(screen.getByText('member@test.com')).toBeInTheDocument()
    })
  })

  it('clic Valider appelle PATCH /admin/membres/:id/valider avec token et toast.success', async () => {
    const pendingList = [
      { id: 'p1', email: 'p@test.com', firstname: 'P', lastname: 'U', isActive: false, emailVerifiedAt: new Date().toISOString(), approvedAt: null, role: { slug: 'member' } },
    ]
    mockApi.mockImplementation((url: string, opts?: { method?: string }) => {
      if (url.includes('filter=pending')) return Promise.resolve(pendingList)
      if (url.includes('filter=members')) return Promise.resolve([])
      if (url === '/admin/membres/p1/valider' && opts?.method === 'PATCH') return Promise.resolve({ message: 'ok' })
      return Promise.reject(new Error('unknown'))
    })
    render(<AdminMembresPage />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Valider' })).toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: 'Valider' }))
    await waitFor(() => {
      expect(mockApi).toHaveBeenCalledWith('/admin/membres/p1/valider', { token: 'fake-token', method: 'PATCH' })
      expect(toast.success).toHaveBeenCalledWith('Inscription validée')
    })
  })

  it('clic Refuser appelle PATCH /admin/membres/:id/refuser', async () => {
    const pendingList = [
      { id: 'p2', email: 'p2@test.com', firstname: 'P2', lastname: 'U2', isActive: false, emailVerifiedAt: new Date().toISOString(), approvedAt: null, role: { slug: 'member' } },
    ]
    mockApi.mockImplementation((url: string, opts?: { method?: string }) => {
      if (url.includes('filter=pending')) return Promise.resolve(pendingList)
      if (url.includes('filter=members')) return Promise.resolve([])
      if (url === '/admin/membres/p2/refuser' && opts?.method === 'PATCH') return Promise.resolve({ message: 'ok' })
      return Promise.reject(new Error('unknown'))
    })
    render(<AdminMembresPage />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Refuser' })).toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: 'Refuser' }))
    await waitFor(() => {
      expect(mockApi).toHaveBeenCalledWith('/admin/membres/p2/refuser', { token: 'fake-token', method: 'PATCH' })
      expect(toast.success).toHaveBeenCalledWith('Inscription refusée')
    })
  })

  it('clic Désactiver appelle PATCH /admin/membres/:id/actif?actif=false', async () => {
    const membersList = [
      { id: 'm2', email: 'm2@test.com', firstname: 'M2', lastname: 'U2', isActive: true, emailVerifiedAt: new Date().toISOString(), approvedAt: new Date().toISOString(), role: { slug: 'member' } },
    ]
    mockApi.mockImplementation((url: string, opts?: { method?: string }) => {
      if (url.includes('filter=pending')) return Promise.resolve([])
      if (url.includes('filter=members')) return Promise.resolve(membersList)
      if (url === '/admin/membres/m2/actif?actif=false' && opts?.method === 'PATCH') return Promise.resolve({ isActive: false })
      return Promise.reject(new Error('unknown'))
    })
    render(<AdminMembresPage />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Désactiver' })).toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: 'Désactiver' }))
    await waitFor(() => {
      expect(mockApi).toHaveBeenCalledWith('/admin/membres/m2/actif?actif=false', { token: 'fake-token', method: 'PATCH' })
      expect(toast.success).toHaveBeenCalledWith('Membre désactivé')
    })
  })

  it('clic Activer appelle PATCH /admin/membres/:id/actif?actif=true', async () => {
    const membersList = [
      { id: 'm3', email: 'm3@test.com', firstname: 'M3', lastname: 'U3', isActive: false, emailVerifiedAt: new Date().toISOString(), approvedAt: new Date().toISOString(), role: { slug: 'member' } },
    ]
    mockApi.mockImplementation((url: string, opts?: { method?: string }) => {
      if (url.includes('filter=pending')) return Promise.resolve([])
      if (url.includes('filter=members')) return Promise.resolve(membersList)
      if (url === '/admin/membres/m3/actif?actif=true' && opts?.method === 'PATCH') return Promise.resolve({ isActive: true })
      return Promise.reject(new Error('unknown'))
    })
    render(<AdminMembresPage />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Activer' })).toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: 'Activer' }))
    await waitFor(() => {
      expect(mockApi).toHaveBeenCalledWith('/admin/membres/m3/actif?actif=true', { token: 'fake-token', method: 'PATCH' })
      expect(toast.success).toHaveBeenCalledWith('Membre activé')
    })
  })
})
