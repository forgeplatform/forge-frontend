/**
 * Type-shape tests for Tenant, TenantQuotaEvent, Branding and payloads.
 */
import { describe, it, expect } from 'vitest'
import type {
  Tenant,
  TenantQuota,
  TenantUsage,
  TenantBranding,
  TenantQuotaEvent,
  Branding,
  TenantProvisionPayload,
} from '@/api/types'

describe('Tenant', () => {
  it('accepts a fully populated tenant', () => {
    const t: Tenant = {
      id: 1,
      name: 'Acme',
      is_tenant_root: false,
      contact_email: 'ops@acme.test',
      isolation_strict: true,
      quota: {
        max_concurrent_jobs: 10,
        max_daily_launches: 100,
        max_hosts: 500,
        max_storage_mb: 10240,
        api_rate_limit: 100,
      },
      usage: {
        concurrent_jobs_count: 2,
        launches_today_count: 14,
        hosts_count: 80,
        storage_mb_used: 512,
        last_recalculated_at: '2026-04-09T10:00:00Z',
      },
      branding: {
        logo_url: 'https://acme.test/logo.svg',
        primary_color: '#112233',
        secondary_color: '#445566',
        custom_domain: 'acme.forail.test',
      },
      created: '2026-04-01T00:00:00Z',
      modified: '2026-04-09T00:00:00Z',
    }
    expect(t.quota.max_concurrent_jobs).toBe(10)
    expect(t.branding.custom_domain).toBe('acme.forail.test')
  })
})

describe('TenantQuota', () => {
  it('allows nullable fields for unlimited quotas', () => {
    const q: TenantQuota = {
      max_concurrent_jobs: null,
      max_daily_launches: null,
      max_hosts: null,
      max_storage_mb: null,
      api_rate_limit: null,
    }
    expect(q.max_concurrent_jobs).toBeNull()
  })
})

describe('TenantUsage', () => {
  it('requires all counters and optional last_recalculated_at', () => {
    const u: TenantUsage = {
      concurrent_jobs_count: 0,
      launches_today_count: 0,
      hosts_count: 0,
      storage_mb_used: 0,
      last_recalculated_at: null,
    }
    expect(u.last_recalculated_at).toBeNull()
  })
})

describe('TenantBranding', () => {
  it('all fields are strings', () => {
    const b: TenantBranding = {
      logo_url: '',
      primary_color: '',
      secondary_color: '',
      custom_domain: '',
    }
    expect(typeof b.logo_url).toBe('string')
    expect(typeof b.primary_color).toBe('string')
    expect(typeof b.secondary_color).toBe('string')
    expect(typeof b.custom_domain).toBe('string')
  })
})

describe('TenantQuotaEvent', () => {
  it('accepts a blocked event', () => {
    const e: TenantQuotaEvent = {
      id: 1,
      organization: 2,
      organization_name: 'Acme',
      quota_kind: 'concurrent_jobs',
      decision: 'blocked',
      current_value: 10,
      limit_value: 10,
      triggered_by: 7,
      unified_job_template: 42,
      message: 'Quota exceeded',
      created: '2026-04-09T12:00:00Z',
    }
    expect(e.decision).toBe('blocked')
    expect(e.quota_kind).toBe('concurrent_jobs')
  })

  it('accepts an allowed event with null limit', () => {
    const e: TenantQuotaEvent = {
      id: 2,
      organization: null,
      organization_name: '',
      quota_kind: 'storage_mb',
      decision: 'allowed',
      current_value: 5,
      limit_value: null,
      triggered_by: null,
      unified_job_template: null,
      message: '',
      created: '2026-04-09T12:00:00Z',
    }
    expect(e.limit_value).toBeNull()
  })
})

describe('Branding', () => {
  it('accepts a public branding response', () => {
    const b: Branding = {
      tenant_id: 1,
      name: 'Acme',
      logo_url: 'https://acme.test/logo.svg',
      primary_color: '#112233',
      secondary_color: '#445566',
      contact_email: 'ops@acme.test',
    }
    expect(b.tenant_id).toBe(1)
  })
})

describe('TenantProvisionPayload', () => {
  it('allows omitting optional quota and branding', () => {
    const p: TenantProvisionPayload = {
      name: 'NewCo',
      admin_username: 'admin',
      admin_email: 'admin@newco.test',
      admin_password: 'secret!!',
    }
    expect(p.name).toBe('NewCo')
    expect(p.quota).toBeUndefined()
  })
})
