import { describe, it, expect } from 'vitest'
import { statusConfig, typeLabels } from './statusConfig'
import type { JobStatus } from '@/api/types'

describe('statusConfig', () => {
  const ALL_STATUSES: JobStatus[] = [
    'successful',
    'failed',
    'error',
    'canceled',
    'pending',
    'waiting',
    'running',
    'new',
  ]

  it('has an entry for every JobStatus', () => {
    for (const status of ALL_STATUSES) {
      expect(statusConfig[status]).toBeDefined()
      expect(statusConfig[status].label).toBeTruthy()
      expect(statusConfig[status].variant).toBeTruthy()
      expect(statusConfig[status].icon).toBeTruthy()
    }
  })

  it('uses correct variant for success/failure/warning statuses', () => {
    expect(statusConfig.successful.variant).toBe('success')
    expect(statusConfig.failed.variant).toBe('error')
    expect(statusConfig.error.variant).toBe('error')
    expect(statusConfig.canceled.variant).toBe('warning')
    expect(statusConfig.running.variant).toBe('warning')
  })

  it('uses secondary variant for pending states', () => {
    expect(statusConfig.pending.variant).toBe('secondary')
    expect(statusConfig.waiting.variant).toBe('secondary')
    expect(statusConfig.new.variant).toBe('secondary')
  })

  it('has unique labels for each status', () => {
    const labels = Object.values(statusConfig).map((c) => c.label)
    const unique = new Set(labels)
    expect(unique.size).toBe(labels.length)
  })
})

describe('typeLabels', () => {
  const EXPECTED_TYPES = [
    'job',
    'project_update',
    'inventory_update',
    'workflow_job',
    'system_job',
    'ad_hoc_command',
  ]

  it('has a label for every unified job type', () => {
    for (const type of EXPECTED_TYPES) {
      expect(typeLabels[type]).toBeTruthy()
    }
  })

  it('returns human-readable labels', () => {
    expect(typeLabels.job).toBe('Playbook')
    expect(typeLabels.workflow_job).toBe('Workflow')
    expect(typeLabels.ad_hoc_command).toBe('Command')
  })
})
