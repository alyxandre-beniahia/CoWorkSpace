import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { api } from '@/lib/api'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'

vi.mock('@/lib/api', () => ({ api: vi.fn() }))

const mockApi = vi.mocked(api)

function TestConsumer() {
  const auth = useAuth()
  return (
    <div>
      <span data-testid="loading">{String(auth.loading)}</span>
      <span data-testid="user">{auth.user ? auth.user.email : 'none'}</span>
      <span data-testid="user-firstname">{auth.user ? auth.user.firstname : ''}</span>
      <button type="button" onClick={() => auth.logout()}>
        Déconnexion
      </button>
      <button
        type="button"
        onClick={() => auth.login('admin@test.com', 'password123')}
      >
        Login
      </button>
      <button
        type="button"
        onClick={() => auth.user && auth.updateUser({ ...auth.user, firstname: 'Updated' })}
      >
        Update firstname
      </button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('expose loading puis user null quand pas de token', async () => {
    mockApi.mockRejectedValue(new Error('no token'))
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })
    expect(screen.getByTestId('user').textContent).toBe('none')
  })

  it('appelle /auth/me au montage si token en localStorage', async () => {
    localStorage.setItem('coworkspace_token', 'fake-token')
    mockApi.mockResolvedValue({
      id: '1',
      email: 'user@test.com',
      firstname: 'User',
      lastname: 'Test',
      role: { slug: 'member' },
    })
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )
    await waitFor(() => {
      expect(mockApi).toHaveBeenCalledWith('/auth/me', { token: 'fake-token' })
    })
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('user@test.com')
    })
  })

  it('login appelle /auth/login puis /auth/me et met à jour user', async () => {
    mockApi.mockImplementation((path: string) => {
      if (path === '/auth/login') return Promise.resolve({ access_token: 'new-token' })
      if (path === '/auth/me') return Promise.resolve({
        id: '2',
        email: 'admin@test.com',
        firstname: 'Admin',
        lastname: 'Test',
        role: { slug: 'admin' },
      })
      return Promise.reject(new Error('unknown'))
    })
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })
    await userEvent.click(screen.getByText('Login'))
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('admin@test.com')
    })
    expect(localStorage.getItem('coworkspace_token')).toBe('new-token')
  })

  it('logout efface token et user', async () => {
    mockApi.mockResolvedValue({
      id: '1',
      email: 'u@test.com',
      firstname: 'U',
      lastname: 'T',
      role: { slug: 'member' },
    })
    localStorage.setItem('coworkspace_token', 't')
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('u@test.com')
    })
    await userEvent.click(screen.getByText('Déconnexion'))
    expect(screen.getByTestId('user').textContent).toBe('none')
    expect(localStorage.getItem('coworkspace_token')).toBeNull()
  })

  it('updateUser met à jour le user en mémoire sans refaire GET /auth/me', async () => {
    const initialUser = {
      id: '1',
      email: 'u@test.com',
      firstname: 'Initial',
      lastname: 'T',
      role: { slug: 'member' as const },
    }
    mockApi.mockResolvedValue(initialUser)
    localStorage.setItem('coworkspace_token', 't')
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )
    await waitFor(() => {
      expect(screen.getByTestId('user-firstname').textContent).toBe('Initial')
    })
    const meCallsBefore = mockApi.mock.calls.filter((c) => c[0] === '/auth/me').length
    await userEvent.click(screen.getByText('Update firstname'))
    expect(screen.getByTestId('user-firstname').textContent).toBe('Updated')
    const meCallsAfter = mockApi.mock.calls.filter((c) => c[0] === '/auth/me').length
    expect(meCallsAfter).toBe(meCallsBefore)
  })
})
