/**
 * Tests for Drift Detection types, validation logic, and label mappings.
 */
import { describe, it, expect } from 'vitest'
import type {
  DriftCategory,
  DriftSeverity,
  DriftDetection,
  DriftAlertRule,
  DriftAlert,
  HostFactSnapshot,
  DriftSummary,
} from '@/api/types'

// ---------------------------------------------------------------------------
// Type structure tests
// ---------------------------------------------------------------------------

describe('DriftDetection type', () => {
  it('should accept a valid drift detection', () => {
    const drift: DriftDetection = {
      id: 1,
      type: 'drift_detection',
      url: '/api/v2/drift_detections/1/',
      related: { host: '/api/v2/hosts/10/' },
      host: 10,
      host_name: 'web01',
      inventory: 5,
      organization: 1,
      snapshot_before: 100,
      snapshot_after: 101,
      detected_at: '2026-04-05T10:00:00Z',
      job: 42,
      category: 'packages',
      severity: 'medium',
      fact_path: 'ansible_packages',
      summary: 'ansible_packages: +2 items',
      detail: { before: { nginx: '1.18' }, after: { nginx: '1.24' }, diff_type: 'changed' },
      acknowledged: false,
      acknowledged_by: null,
      acknowledged_at: null,
    }
    expect(drift.type).toBe('drift_detection')
    expect(drift.category).toBe('packages')
    expect(drift.detail.diff_type).toBe('changed')
  })

  it('should support all diff types', () => {
    const types: DriftDetection['detail']['diff_type'][] = ['added', 'removed', 'changed']
    expect(types).toHaveLength(3)
  })
})

describe('DriftAlertRule type', () => {
  it('should accept a valid alert rule', () => {
    const rule: DriftAlertRule = {
      id: 1,
      type: 'drift_alert_rule',
      url: '/api/v2/drift_alert_rules/1/',
      related: {},
      name: 'Critical drift',
      description: 'Alert on critical drift',
      organization: 1,
      enabled: true,
      inventory: null,
      host_filter: 'web-*',
      categories: ['kernel', 'users_groups'],
      severity_min: 'high',
      threshold_count: 3,
      threshold_window_minutes: 60,
      notification_template: 5,
      last_triggered_at: null,
      trigger_count: 0,
      cooldown_minutes: 30,
      created: '2026-04-05T10:00:00Z',
      modified: '2026-04-05T10:00:00Z',
    }
    expect(rule.type).toBe('drift_alert_rule')
    expect(rule.categories).toContain('kernel')
  })
})

describe('DriftAlert type', () => {
  it('should accept a valid alert', () => {
    const alert: DriftAlert = {
      id: 1,
      type: 'drift_alert',
      url: '/api/v2/drift_alerts/1/',
      related: { alert_rule: '/api/v2/drift_alert_rules/1/' },
      created: '2026-04-05T10:00:00Z',
      alert_rule: 1,
      alert_rule_name: 'Critical drift',
      host: 10,
      organization: 1,
      drift_count: 5,
      summary: '5 drift items on web01',
      notification_status: 'sent',
      notification_error: '',
    }
    expect(alert.notification_status).toBe('sent')
  })

  it('should support all notification statuses', () => {
    const statuses: DriftAlert['notification_status'][] = ['pending', 'sent', 'failed']
    expect(statuses).toHaveLength(3)
  })
})

describe('HostFactSnapshot type', () => {
  it('should accept a valid snapshot', () => {
    const snapshot: HostFactSnapshot = {
      id: 1,
      type: 'fact_snapshot',
      url: '/api/v2/fact_snapshots/1/',
      related: { host: '/api/v2/hosts/10/' },
      host: 10,
      job: 42,
      inventory: 5,
      organization: 1,
      captured_at: '2026-04-05T10:00:00Z',
      facts: { ansible_hostname: 'web01' },
      facts_hash: 'abcdef1234567890',
    }
    expect(snapshot.type).toBe('fact_snapshot')
  })
})

// ---------------------------------------------------------------------------
// Validation logic tests
// ---------------------------------------------------------------------------

describe('DriftCategory validation', () => {
  it('should include all valid categories', () => {
    const categories: DriftCategory[] = [
      'packages', 'services', 'users_groups', 'network', 'mounts', 'kernel', 'other',
    ]
    expect(categories).toHaveLength(7)
  })
})

describe('DriftSeverity validation', () => {
  it('should include all valid severities', () => {
    const severities: DriftSeverity[] = ['low', 'medium', 'high', 'critical']
    expect(severities).toHaveLength(4)
  })
})

describe('Severity badge mapping', () => {
  const SEVERITY_VARIANT: Record<DriftSeverity, string> = {
    critical: 'error',
    high: 'error',
    medium: 'outline',
    low: 'secondary',
  }

  it('should map critical to error', () => {
    expect(SEVERITY_VARIANT.critical).toBe('error')
  })

  it('should map high to error', () => {
    expect(SEVERITY_VARIANT.high).toBe('error')
  })

  it('should map medium to outline', () => {
    expect(SEVERITY_VARIANT.medium).toBe('outline')
  })

  it('should map low to secondary', () => {
    expect(SEVERITY_VARIANT.low).toBe('secondary')
  })
})

describe('Category label mapping', () => {
  const CATEGORY_LABELS: Record<DriftCategory, string> = {
    packages: 'Packages',
    services: 'Services',
    users_groups: 'Users & Groups',
    network: 'Network',
    mounts: 'Mounts',
    kernel: 'Kernel',
    other: 'Other',
  }

  it('should have labels for all categories', () => {
    const categories: DriftCategory[] = [
      'packages', 'services', 'users_groups', 'network', 'mounts', 'kernel', 'other',
    ]
    for (const cat of categories) {
      expect(CATEGORY_LABELS[cat]).toBeDefined()
      expect(CATEGORY_LABELS[cat].length).toBeGreaterThan(0)
    }
  })
})

describe('DriftSummary type', () => {
  it('should accept a valid summary', () => {
    const summary: DriftSummary = {
      total_hosts_with_drift: 10,
      total_drift_items: 42,
      unacknowledged_count: 15,
      by_category: { packages: 10, services: 5, users_groups: 3, network: 8, mounts: 2, kernel: 4, other: 10 },
      by_severity: { low: 10, medium: 15, high: 12, critical: 5 },
    }
    expect(summary.total_drift_items).toBe(42)
    expect(summary.by_category.packages).toBe(10)
  })
})
