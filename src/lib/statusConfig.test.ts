import { describe, it, expect } from 'vitest'
import { statusConfig, typeLabels } from './statusConfig'

describe('statusConfig', () => {
  it('has entries for all job statuses', () => {
    const expectedStatuses = [
      'successful', 'failed', 'error', 'canceled',
      'pending', 'waiting', 'running', 'new',
    ]
    for (const status of expectedStatuses) {
      expect(statusConfig[status as keyof typeof statusConfig]).toBeDefined()
    }
  })

  it('each entry has label, variant, and icon', () => {
    for (const [, config] of Object.entries(statusConfig)) {
      expect(config).toHaveProperty('label')
      expect(config).toHaveProperty('variant')
      expect(config).toHaveProperty('icon')
      expect(typeof config.label).toBe('string')
      expect(typeof config.variant).toBe('string')
    }
  })

  it('successful has success variant', () => {
    expect(statusConfig.successful.variant).toBe('success')
    expect(statusConfig.successful.label).toBe('Success')
  })

  it('failed has error variant', () => {
    expect(statusConfig.failed.variant).toBe('error')
  })

  it('running has warning variant', () => {
    expect(statusConfig.running.variant).toBe('warning')
  })
})

describe('typeLabels', () => {
  it('maps job type to human readable label', () => {
    expect(typeLabels['job']).toBe('Playbook')
    expect(typeLabels['workflow_job']).toBe('Workflow')
    expect(typeLabels['project_update']).toBe('Source Update')
    expect(typeLabels['inventory_update']).toBe('Inventory Sync')
    expect(typeLabels['system_job']).toBe('Management')
    expect(typeLabels['ad_hoc_command']).toBe('Command')
  })
})
