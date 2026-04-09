/**
 * Type-shape tests for ObservabilityConfig.
 */
import { describe, it, expect } from 'vitest'
import type { ObservabilityConfig } from '@/api/types'

describe('ObservabilityConfig', () => {
  it('accepts a fully enabled healthy config', () => {
    const c: ObservabilityConfig = {
      enabled: true,
      service_name: 'forge',
      exporter_endpoint: 'http://forge-otel-collector:4317',
      sampler: 'parentbased_traceidratio',
      sampler_arg: '0.1',
      collector_healthy: true,
      collector_last_check: '2026-04-09T15:42:00Z',
    }
    expect(c.enabled).toBe(true)
    expect(c.collector_healthy).toBe(true)
  })

  it('accepts a disabled config with null last check', () => {
    const c: ObservabilityConfig = {
      enabled: false,
      service_name: 'forge',
      exporter_endpoint: '',
      sampler: 'always_off',
      sampler_arg: '',
      collector_healthy: false,
      collector_last_check: null,
    }
    expect(c.enabled).toBe(false)
    expect(c.collector_last_check).toBeNull()
  })

  it('accepts an unhealthy collector with prior check timestamp', () => {
    const c: ObservabilityConfig = {
      enabled: true,
      service_name: 'forge',
      exporter_endpoint: 'http://forge-otel-collector:4317',
      sampler: 'always_on',
      sampler_arg: '1.0',
      collector_healthy: false,
      collector_last_check: '2026-04-09T14:00:00Z',
    }
    expect(c.collector_healthy).toBe(false)
    expect(c.collector_last_check).not.toBeNull()
  })

  it('accepts a low sampling rate', () => {
    const c: ObservabilityConfig = {
      enabled: true,
      service_name: 'forge',
      exporter_endpoint: 'http://otel:4317',
      sampler: 'traceidratio',
      sampler_arg: '0.01',
      collector_healthy: true,
      collector_last_check: '2026-04-09T00:00:00Z',
    }
    expect(c.sampler_arg).toBe('0.01')
  })

  it('accepts a custom service name', () => {
    const c: ObservabilityConfig = {
      enabled: true,
      service_name: 'forge-staging',
      exporter_endpoint: 'http://otel-staging:4317',
      sampler: 'parentbased_always_on',
      sampler_arg: '1.0',
      collector_healthy: true,
      collector_last_check: '2026-04-09T12:00:00Z',
    }
    expect(c.service_name).toBe('forge-staging')
  })
})
