import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  startRegistration,
  startAuthentication,
} from '@simplewebauthn/browser'
import { api } from '@/api/client'
import type {
  PaginatedResponse,
  WebAuthnCredential,
  WebAuthnAuthenticationCompleteResponse,
} from '@/api/types'

// ---------------------------------------------------------------------------
// Credentials list / rename / delete
// ---------------------------------------------------------------------------

export function useWebAuthnCredentials() {
  return useQuery<PaginatedResponse<WebAuthnCredential>>({
    queryKey: ['webauthn_credentials'],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<WebAuthnCredential>>(
        '/webauthn/credentials/',
      )
      return data
    },
  })
}

export function useRenameWebAuthnCredential() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, label }: { id: number; label: string }) => {
      const { data } = await api.patch(`/webauthn/credentials/${id}/`, { label })
      return data
    },
    onSuccess: () => {
      toast.success('Renamed')
      qc.invalidateQueries({ queryKey: ['webauthn_credentials'] })
    },
    onError: () => toast.error('Rename failed'),
  })
}

export function useDeleteWebAuthnCredential() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/webauthn/credentials/${id}/`)
    },
    onSuccess: () => {
      toast.success('Credential removed')
      qc.invalidateQueries({ queryKey: ['webauthn_credentials'] })
    },
    onError: () => toast.error('Delete failed'),
  })
}

// ---------------------------------------------------------------------------
// Registration: begin -> browser create -> complete
// ---------------------------------------------------------------------------

export function useRegisterWebAuthn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (label: string) => {
      const { data: options } = await api.post('/webauthn/register/begin/')
      // browser API call - will trigger Touch ID / security key prompt
      const credential = await startRegistration({ optionsJSON: options as Parameters<typeof startRegistration>[0]['optionsJSON'] })
      const { data } = await api.post('/webauthn/register/complete/', {
        label,
        credential,
      })
      return data
    },
    onSuccess: () => {
      toast.success('Security key registered')
      qc.invalidateQueries({ queryKey: ['webauthn_credentials'] })
    },
    onError: (err: unknown) => {
      const e = err as { message?: string; response?: { data?: { detail?: string } } }
      toast.error(e.response?.data?.detail || e.message || 'Registration failed')
    },
  })
}

// ---------------------------------------------------------------------------
// Authentication / assertion: begin -> browser get -> complete
// ---------------------------------------------------------------------------

export function useAuthenticateWebAuthn() {
  return useMutation({
    mutationFn: async (
      params: { username?: string } = {},
    ): Promise<WebAuthnAuthenticationCompleteResponse> => {
      const { data: options } = await api.post('/webauthn/authenticate/begin/', {
        username: params.username || '',
      })
      const credential = await startAuthentication({ optionsJSON: options as Parameters<typeof startAuthentication>[0]['optionsJSON'] })
      const { data } = await api.post<WebAuthnAuthenticationCompleteResponse>(
        '/webauthn/authenticate/complete/',
        { credential },
      )
      return data
    },
    onError: (err: unknown) => {
      const e = err as { message?: string; response?: { data?: { detail?: string } } }
      toast.error(e.response?.data?.detail || e.message || 'Authentication failed')
    },
  })
}
