/**
 * Type-shape tests for WebAuthn types.
 */
import { describe, it, expect } from 'vitest'
import type {
  WebAuthnCredential,
  WebAuthnAuthenticationCompleteResponse,
} from '@/api/types'

describe('WebAuthnCredential', () => {
  it('accepts a fully populated credential', () => {
    const c: WebAuthnCredential = {
      id: 1,
      label: 'YubiKey 5C',
      transports: ['usb', 'nfc'],
      aaguid: '00000000-0000-0000-0000-000000000000',
      created: '2026-04-08T10:00:00Z',
      last_used_at: '2026-04-08T11:00:00Z',
      sign_count: 42,
      backup_eligible: false,
      backup_state: false,
    }
    expect(c.label).toBe('YubiKey 5C')
    expect(c.transports).toContain('usb')
  })

  it('accepts a credential that has never been used', () => {
    const c: WebAuthnCredential = {
      id: 2,
      label: 'Touch ID',
      transports: ['internal'],
      aaguid: '',
      created: '2026-04-08T10:00:00Z',
      last_used_at: null,
      sign_count: 0,
      backup_eligible: true,
      backup_state: true,
    }
    expect(c.last_used_at).toBeNull()
    expect(c.sign_count).toBe(0)
  })
})

describe('WebAuthnAuthenticationCompleteResponse', () => {
  it('accepts a passwordless first-factor login response', () => {
    const r: WebAuthnAuthenticationCompleteResponse = {
      logged_in: true,
      username: 'alice',
    }
    expect(r.logged_in).toBe(true)
  })

  it('accepts an MFA-satisfied response', () => {
    const r: WebAuthnAuthenticationCompleteResponse = {
      mfa_satisfied: true,
      username: 'bob',
    }
    expect(r.mfa_satisfied).toBe(true)
  })

  it('accepts an empty response', () => {
    const r: WebAuthnAuthenticationCompleteResponse = {}
    expect(r.logged_in).toBeUndefined()
  })
})
