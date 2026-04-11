/**
 * Type-shape tests for Recommendation.
 */
import { describe, it, expect } from 'vitest'
import type { Recommendation, RecommendationScope, RecommendationSeverity } from '@/api/types'

describe('Recommendation', () => {
  it('accepts a critical compliance recommendation', () => {
    const r: Recommendation = {
      id: 'no_scanners',
      scope: 'compliance',
      severity: 'critical',
      title: 'No scanners configured',
      why: 'Platform will not detect IaC issues.',
      action_link: '/wizards/compliance',
    }
    expect(r.severity).toBe('critical')
    expect(r.scope).toBe('compliance')
  })

  it('accepts an info dashboard recommendation', () => {
    const r: Recommendation = {
      id: 'welcome',
      scope: 'dashboard',
      severity: 'info',
      title: 'Welcome to Forge',
      why: 'Finish setup with the Getting Started wizard.',
      action_link: '/wizards/getting-started',
    }
    expect(r.severity).toBe('info')
  })

  it('accepts warn severity for automation scope', () => {
    const r: Recommendation = {
      id: 'no_schedules',
      scope: 'automation',
      severity: 'warn',
      title: 'No schedules',
      why: 'Templates never run automatically.',
      action_link: '/wizards/automation',
    }
    expect(r.severity).toBe('warn')
  })

  it('supports all scopes', () => {
    const scopes: RecommendationScope[] = [
      'dashboard',
      'automation',
      'self_service',
      'tenancy',
      'compliance',
      'resources',
      'access',
      'all',
    ]
    expect(scopes).toHaveLength(8)
  })

  it('supports all severities', () => {
    const sevs: RecommendationSeverity[] = ['info', 'warn', 'critical']
    expect(sevs).toContain('info')
    expect(sevs).toContain('warn')
    expect(sevs).toContain('critical')
  })
})
