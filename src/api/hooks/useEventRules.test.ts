import { describe, it, expect } from 'vitest'
import type {
  EventRule,
  EventLog,
  OutboundWebhook,
  EventRuleSourceType,
  EventLogStatus,
  OutboundWebhookEventType,
} from '@/api/types'

/**
 * Type-level tests for EDA interfaces and validation logic.
 * These tests verify that the TypeScript types are correctly defined
 * and that validation patterns work as expected.
 */

describe('EDA Types', () => {
  describe('EventRule', () => {
    it('has correct structure', () => {
      const rule: EventRule = {
        id: 1,
        type: 'event_rule',
        url: '/api/v2/event_rules/1/',
        related: { organization: '/api/v2/organizations/1/' },
        name: 'Deploy on push',
        description: 'Auto-deploy when code is pushed to main',
        organization: 1,
        enabled: true,
        source_type: 'webhook_github',
        webhook_path: 'github-deploy',
        conditions: [
          { jinja2_expression: 'event.ref == "refs/heads/main"', description: 'Main branch' },
        ],
        actions: [
          { action_type: 'launch_job_template', target_id: 5, description: 'Run deploy' },
        ],
        throttle_seconds: 30,
        last_fired_at: '2026-04-03T12:00:00Z',
        fire_count: 42,
        webhook_url: 'https://forge.example.com/api/v2/eda_webhooks/github-deploy/',
        created: '2026-04-01T00:00:00Z',
        modified: '2026-04-03T12:00:00Z',
      }

      expect(rule.type).toBe('event_rule')
      expect(rule.source_type).toBe('webhook_github')
      expect(rule.conditions).toHaveLength(1)
      expect(rule.actions).toHaveLength(1)
      expect(rule.actions[0]!.action_type).toBe('launch_job_template')
    })

    it('supports all source types', () => {
      const types: EventRuleSourceType[] = [
        'webhook_generic',
        'webhook_github',
        'webhook_gitlab',
        'alertmanager',
        'pagerduty',
        'datadog',
        'cloudwatch',
      ]
      expect(types).toHaveLength(7)
    })

    it('supports nullable fields', () => {
      const rule: Partial<EventRule> = {
        organization: null,
        last_fired_at: null,
      }
      expect(rule.organization).toBeNull()
      expect(rule.last_fired_at).toBeNull()
    })
  })

  describe('EventLog', () => {
    it('has correct structure', () => {
      const log: EventLog = {
        id: 1,
        type: 'event_log',
        url: '/api/v2/event_logs/1/',
        related: { event_rule: '/api/v2/event_rules/1/' },
        created: '2026-04-03T12:00:00Z',
        event_rule: 1,
        event_rule_name: 'Deploy on push',
        source_type: 'webhook_github',
        source_ip: '192.168.1.1',
        event_type: 'push',
        event_guid: 'abc-123-def-456',
        payload: { ref: 'refs/heads/main' },
        headers: { 'X-Github-Event': 'push' },
        conditions_matched: true,
        condition_results: [
          { expression: 'event.ref == "refs/heads/main"', description: 'Main branch', matched: true },
        ],
        actions_triggered: [
          { action_type: 'launch_job_template', target_id: 5, description: 'Deploy', status: 'success', job_id: 42 },
        ],
        status: 'action_fired',
        error_detail: '',
        job_id: 42,
        organization: 1,
      }

      expect(log.type).toBe('event_log')
      expect(log.status).toBe('action_fired')
      expect(log.conditions_matched).toBe(true)
      expect(log.actions_triggered).toHaveLength(1)
    })

    it('supports all status values', () => {
      const statuses: EventLogStatus[] = [
        'received',
        'matched',
        'unmatched',
        'throttled',
        'action_fired',
        'action_failed',
        'error',
        'signature_failed',
      ]
      expect(statuses).toHaveLength(8)
    })
  })

  describe('OutboundWebhook', () => {
    it('has correct structure', () => {
      const webhook: OutboundWebhook = {
        id: 1,
        type: 'outbound_webhook',
        url: '/api/v2/outbound_webhooks/1/',
        related: { organization: '/api/v2/organizations/1/' },
        name: 'Slack notification',
        description: 'Notify Slack on job completion',
        organization: 1,
        target_url: 'https://hooks.slack.com/services/XXX',
        events: ['job.succeeded', 'job.failed'],
        custom_headers: {},
        enabled: true,
        ssl_verify: true,
        last_status: 'success',
        last_sent_at: '2026-04-03T12:00:00Z',
        last_error: '',
        created: '2026-04-01T00:00:00Z',
        modified: '2026-04-03T12:00:00Z',
      }

      expect(webhook.type).toBe('outbound_webhook')
      expect(webhook.events).toContain('job.succeeded')
      expect(webhook.events).toContain('job.failed')
    })

    it('supports all event types', () => {
      const events: OutboundWebhookEventType[] = [
        'job.started',
        'job.succeeded',
        'job.failed',
        'job.canceled',
        'workflow.started',
        'workflow.succeeded',
        'workflow.failed',
      ]
      expect(events).toHaveLength(7)
    })
  })
})

describe('EDA Validation Logic', () => {
  describe('webhook_path validation', () => {
    const isValidPath = (path: string) => /^[a-zA-Z0-9_-]+$/.test(path)

    it('accepts valid paths', () => {
      expect(isValidPath('my-hook')).toBe(true)
      expect(isValidPath('deploy_prod')).toBe(true)
      expect(isValidPath('github-main-123')).toBe(true)
      expect(isValidPath('alertmanager01')).toBe(true)
    })

    it('rejects invalid paths', () => {
      expect(isValidPath('my hook')).toBe(false)
      expect(isValidPath('deploy/prod')).toBe(false)
      expect(isValidPath('../etc')).toBe(false)
      expect(isValidPath('')).toBe(false)
    })
  })

  describe('action validation', () => {
    const VALID_ACTION_TYPES = new Set(['launch_job_template', 'launch_workflow', 'send_notification'])

    it('validates action types', () => {
      expect(VALID_ACTION_TYPES.has('launch_job_template')).toBe(true)
      expect(VALID_ACTION_TYPES.has('launch_workflow')).toBe(true)
      expect(VALID_ACTION_TYPES.has('send_notification')).toBe(true)
      expect(VALID_ACTION_TYPES.has('unknown_action')).toBe(false)
    })
  })

  describe('event type validation for outbound webhooks', () => {
    const VALID_EVENTS = new Set([
      'job.started', 'job.succeeded', 'job.failed', 'job.canceled',
      'workflow.started', 'workflow.succeeded', 'workflow.failed',
    ])

    it('validates event types', () => {
      expect(VALID_EVENTS.has('job.succeeded')).toBe(true)
      expect(VALID_EVENTS.has('workflow.failed')).toBe(true)
      expect(VALID_EVENTS.has('invalid.event')).toBe(false)
    })
  })

  describe('source type labels', () => {
    const SOURCE_LABELS: Record<string, string> = {
      webhook_generic: 'Generic',
      webhook_github: 'GitHub',
      webhook_gitlab: 'GitLab',
      alertmanager: 'Alertmanager',
      pagerduty: 'PagerDuty',
      datadog: 'Datadog',
      cloudwatch: 'CloudWatch',
    }

    it('has labels for all source types', () => {
      expect(Object.keys(SOURCE_LABELS)).toHaveLength(7)
    })

    it('returns correct labels', () => {
      expect(SOURCE_LABELS['webhook_github']).toBe('GitHub')
      expect(SOURCE_LABELS['alertmanager']).toBe('Alertmanager')
    })
  })

  describe('status badge mapping', () => {
    const STATUS_VARIANT: Record<string, string> = {
      action_fired: 'success',
      matched: 'success',
      unmatched: 'secondary',
      throttled: 'outline',
      action_failed: 'error',
      error: 'error',
      signature_failed: 'error',
      received: 'outline',
    }

    it('maps all statuses to badge variants', () => {
      expect(Object.keys(STATUS_VARIANT)).toHaveLength(8)
    })

    it('success statuses map to success variant', () => {
      expect(STATUS_VARIANT['action_fired']).toBe('success')
      expect(STATUS_VARIANT['matched']).toBe('success')
    })

    it('error statuses map to error variant', () => {
      expect(STATUS_VARIANT['action_failed']).toBe('error')
      expect(STATUS_VARIANT['error']).toBe('error')
      expect(STATUS_VARIANT['signature_failed']).toBe('error')
    })
  })
})
