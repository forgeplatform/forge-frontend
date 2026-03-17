import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './auth'
import type { User } from '@/api/types'

const mockUser: User = {
  id: 1,
  username: 'admin',
  first_name: 'Admin',
  last_name: 'User',
  email: 'admin@example.com',
  is_superuser: true,
  is_system_auditor: false,
  created: '2026-01-01T00:00:00Z',
  modified: '2026-01-01T00:00:00Z',
  last_login: '2026-03-07T00:00:00Z',
  password: '',
}

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false })
  })

  it('starts with no user and not authenticated', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('setUser sets user and authenticates', () => {
    useAuthStore.getState().setUser(mockUser)
    const state = useAuthStore.getState()
    expect(state.user).toEqual(mockUser)
    expect(state.isAuthenticated).toBe(true)
  })

  it('clearUser removes user and deauthenticates', () => {
    useAuthStore.getState().setUser(mockUser)
    useAuthStore.getState().clearUser()
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })
})
