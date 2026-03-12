import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, getApiUrl } from './api'

describe('api', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    vi.stubEnv('VITE_API_URL', 'http://localhost:3002')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  describe('getApiUrl', () => {
    it('retourne VITE_API_URL ou localhost:3002 par défaut', () => {
      expect(getApiUrl()).toBe('http://localhost:3002')
    })
  })

  describe('api', () => {
    it('appelle fetch avec la bonne URL (base + path sans double slash)', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-length': '2' }),
        json: () => Promise.resolve({ id: 1 }),
        text: () => Promise.resolve(''),
      } as Response)

      await api<{ id: number }>('/auth/me')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3002/auth/me',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      )
    })

    it('ajoute Authorization Bearer si token fourni', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-length': '2' }),
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
      } as Response)

      await api('/auth/me', { token: 'my-jwt' })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-jwt',
          }),
        }),
      )
    })

    it('retourne le JSON si ok', async () => {
      const mockFetch = vi.mocked(fetch)
      const data = { id: 'u1', email: 'a@b.com' }
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-length': '20' }),
        json: () => Promise.resolve(data),
        text: () => Promise.resolve(''),
      } as Response)

      const result = await api<typeof data>('/auth/me')
      expect(result).toEqual(data)
    })

    it('lance une Error si !res.ok avec message du body', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers(),
        json: () => Promise.resolve({ message: 'Identifiants incorrects' }),
        text: () => Promise.resolve(JSON.stringify({ message: 'Identifiants incorrects' })),
      } as Response)

      await expect(api('/auth/login', { method: 'POST', body: '{}' })).rejects.toThrow(
        'Identifiants incorrects',
      )
    })

    it('lance une Error avec message body ou status si body non JSON', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        headers: new Headers(),
        text: () => Promise.resolve('Server error'),
        json: () => Promise.reject(new Error('Invalid json')),
      } as Response)

      await expect(api('/error')).rejects.toThrow('Server error')
    })
  })
})
