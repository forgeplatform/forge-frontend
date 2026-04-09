/**
 * Type-shape tests for Scanner, ScanResult, and ScanFinding.
 */
import { describe, it, expect } from 'vitest'
import type { Scanner, ScanResult, ScanFinding } from '@/api/types'

describe('Scanner', () => {
  it('accepts a fully populated scanner', () => {
    const s: Scanner = {
      id: 1,
      type: 'scanner',
      url: '/api/v2/scanners/1/',
      name: 'block-shell-injection',
      description: 'Catch unquoted shell usage',
      organization: 1,
      tool: 'ansible-lint',
      config: { profile: 'production' },
      severity_threshold: 'high',
      enforcement: 'enforce',
      enabled: true,
      applies_to: ['job_template', 'workflow_job_template'],
      trigger_count: 7,
      last_run_at: '2026-04-08T19:01:00Z',
      last_run_status: 'ok',
      created: '2026-04-08T10:00:00Z',
      modified: '2026-04-08T19:01:00Z',
    }
    expect(s.tool).toBe('ansible-lint')
    expect(s.applies_to).toContain('job_template')
  })

  it('accepts a global scanner with empty applies_to', () => {
    const s: Scanner = {
      id: 2,
      type: 'scanner',
      url: '/api/v2/scanners/2/',
      name: 'global-checkov',
      description: '',
      organization: null,
      tool: 'checkov',
      config: {},
      severity_threshold: 'medium',
      enforcement: 'warn',
      enabled: false,
      applies_to: [],
      trigger_count: 0,
      last_run_at: null,
      last_run_status: '',
      created: '2026-04-08T10:00:00Z',
      modified: '2026-04-08T10:00:00Z',
    }
    expect(s.organization).toBeNull()
    expect(s.applies_to).toHaveLength(0)
  })

  it('accepts pip-audit tool', () => {
    const s: Scanner = {
      id: 3,
      name: 'py-deps',
      description: '',
      organization: null,
      tool: 'pip-audit',
      config: {},
      severity_threshold: 'critical',
      enforcement: 'enforce',
      enabled: true,
      applies_to: ['ad_hoc_command'],
      trigger_count: 0,
      last_run_at: null,
      last_run_status: '',
      created: '2026-04-08T10:00:00Z',
      modified: '2026-04-08T10:00:00Z',
    }
    expect(s.tool).toBe('pip-audit')
  })
})

describe('ScanFinding', () => {
  it('accepts a finding with a line number', () => {
    const f: ScanFinding = {
      id: 1,
      rule_id: 'yaml[line-length]',
      severity: 'medium',
      file_path: 'playbooks/site.yml',
      line: 42,
      message: 'Line too long',
    }
    expect(f.line).toBe(42)
  })

  it('accepts a finding without a line number', () => {
    const f: ScanFinding = {
      id: 2,
      rule_id: 'CKV_ANSIBLE_1',
      severity: 'critical',
      file_path: 'roles/web/tasks/main.yml',
      line: null,
      message: 'Avoid shell with user input',
    }
    expect(f.line).toBeNull()
  })
})

describe('ScanResult', () => {
  it('accepts a blocked scan result with embedded findings', () => {
    const r: ScanResult = {
      id: 1,
      type: 'scan_result',
      url: '/api/v2/scan_results/1/',
      scanner: 1,
      scanner_name: 'block-shell-injection',
      unified_job: null,
      unified_job_template: 42,
      organization: 1,
      triggered_by: 5,
      status: 'blocked',
      duration_ms: 842,
      finding_count: 2,
      highest_severity: 'high',
      message: 'Blocked: 2 findings ≥ high',
      raw_output: '{}',
      findings: [
        {
          id: 1,
          rule_id: 'yaml[line-length]',
          severity: 'high',
          file_path: 'playbooks/site.yml',
          line: 12,
          message: 'Bad',
        },
      ],
      created: '2026-04-08T19:00:00Z',
      modified: '2026-04-08T19:00:00Z',
    }
    expect(r.status).toBe('blocked')
    expect(r.findings).toHaveLength(1)
  })

  it('accepts an ok scan result with no findings', () => {
    const r: ScanResult = {
      id: 2,
      scanner: 1,
      scanner_name: 'block-shell-injection',
      unified_job: 123,
      unified_job_template: 42,
      organization: 1,
      triggered_by: 5,
      status: 'ok',
      duration_ms: 120,
      finding_count: 0,
      highest_severity: '',
      message: '',
      raw_output: '',
      findings: [],
      created: '2026-04-08T19:00:00Z',
      modified: '2026-04-08T19:00:00Z',
    }
    expect(r.status).toBe('ok')
    expect(r.findings).toHaveLength(0)
  })
})
