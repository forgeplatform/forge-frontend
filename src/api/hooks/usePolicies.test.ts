/**
 * Type-shape tests for Policy and PolicyDecision.
 */
import { describe, it, expect } from 'vitest'
import type { Policy, PolicyDecision, PolicyTestResponse } from '@/api/types'

describe('Policy', () => {
  it('accepts a fully populated policy', () => {
    const p: Policy = {
      id: 1,
      type: 'policy',
      url: '/api/v2/policies/1/',
      name: 'no-prod-after-hours',
      description: 'Block prod inventory between 18:00 and 08:00',
      organization: 1,
      rego_module: 'package forge.launch\ndefault deny := false',
      package_path: 'forge.launch',
      enforcement: 'enforce',
      enabled: true,
      applies_to: ['job_template', 'workflow_job_template'],
      trigger_count: 3,
      last_triggered_at: '2026-04-08T19:01:00Z',
      last_evaluated_at: '2026-04-08T19:05:00Z',
      last_sync_status: 'ok',
      created: '2026-04-08T10:00:00Z',
      modified: '2026-04-08T19:05:00Z',
    }
    expect(p.enforcement).toBe('enforce')
    expect(p.applies_to).toContain('job_template')
  })

  it('accepts a global policy with empty applies_to', () => {
    const p: Policy = {
      id: 2,
      type: 'policy',
      url: '/api/v2/policies/2/',
      name: 'global-rule',
      description: '',
      organization: null,
      rego_module: '',
      package_path: 'forge.launch',
      enforcement: 'warn',
      enabled: false,
      applies_to: [],
      trigger_count: 0,
      last_triggered_at: null,
      last_evaluated_at: null,
      last_sync_status: '',
      created: '2026-04-08T10:00:00Z',
      modified: '2026-04-08T10:00:00Z',
    }
    expect(p.organization).toBeNull()
    expect(p.applies_to).toHaveLength(0)
  })
})

describe('PolicyDecision', () => {
  it('accepts a deny decision', () => {
    const d: PolicyDecision = {
      id: 1,
      type: 'policy_decision',
      url: '/api/v2/policy_decisions/1/',
      policy: 1,
      policy_name: 'no-prod-after-hours',
      decision: 'deny',
      unified_job: null,
      unified_job_template: 42,
      organization: 1,
      triggered_by: 5,
      message: 'Out of hours change to prod inventory',
      context: { resource_type: 'job_template' },
      created: '2026-04-08T19:01:00Z',
    }
    expect(d.decision).toBe('deny')
    expect(d.unified_job).toBeNull()
  })

  it('accepts a warn decision tied to a launched job', () => {
    const d: PolicyDecision = {
      id: 2,
      type: 'policy_decision',
      url: '/api/v2/policy_decisions/2/',
      policy: 1,
      policy_name: 'risky-credential',
      decision: 'warn',
      unified_job: 1234,
      unified_job_template: 42,
      organization: 1,
      triggered_by: 5,
      message: 'Heads up: shared credential',
      context: {},
      created: '2026-04-08T19:01:00Z',
    }
    expect(d.unified_job).toBe(1234)
  })
})

describe('PolicyTestResponse', () => {
  it('accepts allowed response', () => {
    const r: PolicyTestResponse = {
      allowed: true,
      warnings: [],
      denies: [],
      raw: {},
    }
    expect(r.allowed).toBe(true)
  })

  it('accepts a response with warnings and denies', () => {
    const r: PolicyTestResponse = {
      allowed: false,
      warnings: ['heads up'],
      denies: ['blocked'],
      raw: { violations: [] },
    }
    expect(r.denies).toContain('blocked')
  })
})
