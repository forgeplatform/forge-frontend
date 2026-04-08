/**
 * Type-shape and validation tests for Self-Service Portal hooks/types.
 */
import { describe, it, expect } from 'vitest'
import type {
  ServiceCatalogItem,
  ServiceCatalogItemLaunchData,
  ServiceRequest,
  ServiceRequestStatus,
  ServiceRequestSubmitPayload,
} from '@/api/types'

describe('ServiceCatalogItem', () => {
  it('accepts a valid catalog item wrapping a job template', () => {
    const item: ServiceCatalogItem = {
      id: 1,
      type: 'service_catalog_item',
      url: '/api/v2/service_catalog_items/1/',
      name: 'Restart nginx',
      description: 'Rolling restart of nginx on all web hosts',
      icon: 'RotateCcw',
      category: 'Web',
      tags: ['nginx', 'restart'],
      organization: 1,
      job_template: 42,
      workflow_job_template: null,
      requires_approval: true,
      approver_team: 7,
      enabled: true,
      is_workflow: false,
      created: '2026-04-08T10:00:00Z',
      modified: '2026-04-08T10:00:00Z',
    }
    expect(item.name).toBe('Restart nginx')
    expect(item.is_workflow).toBe(false)
    expect(item.tags).toContain('nginx')
  })

  it('accepts a workflow-backed catalog item', () => {
    const item: ServiceCatalogItem = {
      id: 2,
      type: 'service_catalog_item',
      url: '/api/v2/service_catalog_items/2/',
      name: 'Provision app',
      description: '',
      icon: 'Server',
      category: 'Provisioning',
      tags: [],
      organization: 1,
      job_template: null,
      workflow_job_template: 99,
      requires_approval: false,
      approver_team: null,
      enabled: true,
      is_workflow: true,
      created: '2026-04-08T10:00:00Z',
      modified: '2026-04-08T10:00:00Z',
    }
    expect(item.is_workflow).toBe(true)
    expect(item.workflow_job_template).toBe(99)
  })
})

describe('ServiceRequest', () => {
  it('accepts each lifecycle status', () => {
    const statuses: ServiceRequestStatus[] = [
      'pending_approval',
      'approved',
      'rejected',
      'running',
      'successful',
      'failed',
      'canceled',
    ]
    expect(statuses).toHaveLength(7)
  })

  it('accepts a pending request', () => {
    const sr: ServiceRequest = {
      id: 1,
      type: 'service_request',
      url: '/api/v2/service_requests/1/',
      catalog_item: 1,
      requested_by: 5,
      status: 'pending_approval',
      extra_vars: { hostname: 'web01' },
      node_survey_data: {},
      justification: 'Routine maintenance',
      approved_by: null,
      approved_at: null,
      rejection_reason: '',
      unified_job: null,
      created: '2026-04-08T10:00:00Z',
      modified: '2026-04-08T10:00:00Z',
    }
    expect(sr.status).toBe('pending_approval')
    expect(sr.unified_job).toBeNull()
  })

  it('accepts a running request with linked unified job', () => {
    const sr: ServiceRequest = {
      id: 2,
      type: 'service_request',
      url: '/api/v2/service_requests/2/',
      catalog_item: 1,
      requested_by: 5,
      status: 'running',
      extra_vars: {},
      node_survey_data: { node_a: { region: 'eu-west-1' } },
      justification: '',
      approved_by: 9,
      approved_at: '2026-04-08T10:05:00Z',
      rejection_reason: '',
      unified_job: 444,
      created: '2026-04-08T10:00:00Z',
      modified: '2026-04-08T10:05:00Z',
    }
    expect(sr.unified_job).toBe(444)
    expect(sr.node_survey_data.node_a).toEqual({ region: 'eu-west-1' })
  })

  it('accepts a rejected request with reason', () => {
    const sr: ServiceRequest = {
      id: 3,
      type: 'service_request',
      url: '/api/v2/service_requests/3/',
      catalog_item: 1,
      requested_by: 5,
      status: 'rejected',
      extra_vars: {},
      node_survey_data: {},
      justification: 'wanted to test',
      approved_by: 9,
      approved_at: '2026-04-08T10:05:00Z',
      rejection_reason: 'Out of scope',
      unified_job: null,
      created: '2026-04-08T10:00:00Z',
      modified: '2026-04-08T10:05:00Z',
    }
    expect(sr.status).toBe('rejected')
    expect(sr.rejection_reason).toBe('Out of scope')
  })
})

describe('ServiceRequestSubmitPayload', () => {
  it('accepts an empty payload', () => {
    const p: ServiceRequestSubmitPayload = {}
    expect(p.extra_vars).toBeUndefined()
  })

  it('accepts full payload with workflow node surveys', () => {
    const p: ServiceRequestSubmitPayload = {
      extra_vars: { env: 'prod' },
      node_survey_data: { deploy_node: { version: '2.0' } },
      justification: 'release',
    }
    expect(p.extra_vars?.env).toBe('prod')
    expect(p.node_survey_data?.deploy_node).toEqual({ version: '2.0' })
  })
})

describe('ServiceCatalogItemLaunchData', () => {
  it('accepts launch data with workflow node surveys', () => {
    const ld: ServiceCatalogItemLaunchData = {
      catalog_item: {
        id: 1,
        name: 'Provision app',
        description: '',
        icon: 'Server',
        requires_approval: true,
      },
      is_workflow: true,
      survey_enabled: true,
      survey_spec: { spec: [] },
      ask_variables_on_launch: false,
      node_surveys: [
        { node_id: 10, identifier: 'deploy', survey_spec: { spec: [] } },
      ],
    }
    expect(ld.is_workflow).toBe(true)
    expect(ld.node_surveys).toHaveLength(1)
  })

  it('accepts launch data without node surveys for plain JT', () => {
    const ld: ServiceCatalogItemLaunchData = {
      catalog_item: { id: 2, name: 'Restart', description: '', icon: '', requires_approval: false },
      is_workflow: false,
      survey_enabled: false,
      survey_spec: {},
      ask_variables_on_launch: false,
    }
    expect(ld.is_workflow).toBe(false)
    expect(ld.node_surveys).toBeUndefined()
  })
})
