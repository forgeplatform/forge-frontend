export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface User {
  id: number
  username: string
  first_name: string
  last_name: string
  email: string
  is_superuser: boolean
  is_system_auditor: boolean
  created: string
  modified: string
  last_login: string | null
  password: string
}

export interface MeResponse {
  count: number
  results: User[]
}

export interface DashboardCount {
  url: string
  total: number
  failed?: number
}

export interface DashboardResponse {
  inventories: DashboardCount
  groups: DashboardCount
  hosts: DashboardCount & { failed: number }
  projects: DashboardCount & { failed: number }
  users: DashboardCount
  organizations: DashboardCount
  teams: DashboardCount
  credentials: DashboardCount
  job_templates: DashboardCount
}

export interface DashboardJobGraphResponse {
  jobs: {
    successful: Array<[number, number]>
    failed: Array<[number, number]>
  }
}

export type JobStatus =
  | 'successful'
  | 'failed'
  | 'error'
  | 'canceled'
  | 'pending'
  | 'waiting'
  | 'running'
  | 'new'

export type LaunchType =
  | 'manual'
  | 'relaunch'
  | 'callback'
  | 'scheduled'
  | 'dependency'
  | 'workflow'
  | 'webhook'
  | 'sync'
  | 'scm'

export interface UnifiedJob {
  id: number
  name: string
  type: string
  status: JobStatus
  started: string | null
  finished: string | null
  elapsed: number
  failed: boolean
  launch_type: LaunchType
  execution_node: string
  controller_node: string
  created: string
  summary_fields: {
    organization?: { id: number; name: string }
    created_by?: { id: number; username: string }
    unified_job_template?: { id: number; name: string; unified_job_type: string }
  }
}

export interface JobDetail extends UnifiedJob {
  job_template: number | null
  inventory: number | null
  project: number | null
  playbook: string
  scm_branch: string
  forks: number
  limit: string
  verbosity: number
  extra_vars: string
  job_tags: string
  skip_tags: string
  diff_mode: boolean
  scm_revision: string
  job_slice_number: number
  job_slice_count: number
  host_status_counts: Record<string, number>
  playbook_counts: Record<string, number>
  summary_fields: UnifiedJob['summary_fields'] & {
    job_template?: { id: number; name: string; description: string }
    inventory?: { id: number; name: string; kind: string }
    project?: { id: number; name: string; scm_type: string }
    execution_environment?: { id: number; name: string; image: string }
    credentials?: Array<{ id: number; name: string; kind: string }>
    labels?: { count: number; results: Array<{ id: number; name: string }> }
    launched_by?: { id: number; name: string; type: string }
  }
}

export interface JobStdoutResponse {
  range: { start: number; end: number; absolute_end: number }
  content: string
}

export interface JobHostSummary {
  id: number
  host_id: number
  host_name: string
  ok: number
  changed: number
  dark: number
  failures: number
  skipped: number
  ignored: number
  rescued: number
  processed: number
  failed: boolean
}

// --- Job Templates ---

export interface JobTemplate {
  id: number
  name: string
  description: string
  type: 'job_template'
  status: JobStatus
  last_job_run: string | null
  last_job_failed: boolean
  playbook: string
  forks: number
  limit: string
  verbosity: number
  extra_vars: string
  job_tags: string
  skip_tags: string
  diff_mode: boolean
  ask_variables_on_launch: boolean
  ask_limit_on_launch: boolean
  ask_tags_on_launch: boolean
  ask_skip_tags_on_launch: boolean
  ask_job_type_on_launch: boolean
  ask_verbosity_on_launch: boolean
  ask_inventory_on_launch: boolean
  ask_credential_on_launch: boolean
  ask_execution_environment_on_launch: boolean
  ask_forks_on_launch: boolean
  ask_job_slice_count_on_launch: boolean
  ask_labels_on_launch: boolean
  ask_timeout_on_launch: boolean
  survey_enabled: boolean
  become_enabled: boolean
  allow_simultaneous: boolean
  job_slice_count: number
  webhook_service: string
  created: string
  modified: string
  summary_fields: {
    organization?: { id: number; name: string }
    inventory?: { id: number; name: string; kind: string }
    project?: { id: number; name: string; scm_type: string }
    execution_environment?: { id: number; name: string; image: string }
    last_job?: { id: number; name: string; status: JobStatus; finished: string | null }
    last_update?: { id: number; name: string; status: JobStatus }
    created_by?: { id: number; username: string }
    modified_by?: { id: number; username: string }
    credentials?: Array<{ id: number; name: string; kind: string }>
    labels?: { count: number; results: Array<{ id: number; name: string }> }
    recent_jobs?: Array<{ id: number; status: JobStatus; finished: string }>
    object_roles?: Record<string, ObjectRole>
  }
}

export interface WorkflowJobTemplate {
  id: number
  name: string
  description: string
  type: 'workflow_job_template'
  status: JobStatus
  organization: number | null
  inventory: number | null
  limit: string | null
  scm_branch: string | null
  skip_tags: string | null
  job_tags: string | null
  last_job_run: string | null
  last_job_failed: boolean
  survey_enabled: boolean
  allow_simultaneous: boolean
  ask_variables_on_launch: boolean
  ask_inventory_on_launch: boolean
  ask_limit_on_launch: boolean
  ask_scm_branch_on_launch: boolean
  ask_labels_on_launch: boolean
  ask_skip_tags_on_launch: boolean
  ask_tags_on_launch: boolean
  extra_vars: string
  webhook_service: string
  created: string
  modified: string
  summary_fields: {
    organization?: { id: number; name: string }
    last_job?: { id: number; name: string; status: JobStatus; finished: string | null }
    last_update?: { id: number; name: string; status: JobStatus }
    created_by?: { id: number; username: string }
    modified_by?: { id: number; username: string }
    labels?: { count: number; results: Array<{ id: number; name: string }> }
    recent_jobs?: Array<{ id: number; status: JobStatus; finished: string }>
    object_roles?: Record<string, ObjectRole>
  }
}

export type Template = JobTemplate | WorkflowJobTemplate

// --- Projects ---

export type ProjectStatus = 'successful' | 'failed' | 'error' | 'canceled' | 'pending' | 'waiting' | 'running' | 'new' | 'ok' | 'missing' | 'never updated'

export interface Project {
  id: number
  name: string
  description: string
  status: ProjectStatus
  scm_type: string
  scm_url: string
  scm_branch: string
  scm_revision: string
  scm_clean: boolean
  scm_delete_on_update: boolean
  scm_track_submodules: boolean
  scm_update_on_launch: boolean
  scm_update_cache_timeout: number
  allow_override: boolean
  last_job_run: string | null
  last_job_failed: boolean
  last_update_failed: boolean
  created: string
  modified: string
  summary_fields: {
    organization?: { id: number; name: string }
    default_environment?: { id: number; name: string; image: string }
    created_by?: { id: number; username: string }
    modified_by?: { id: number; username: string }
    last_job?: { id: number; name: string; status: JobStatus; finished: string | null }
    last_update?: { id: number; name: string; status: JobStatus; failed: boolean }
    credential?: { id: number; name: string; kind: string }
    object_roles?: Record<string, ObjectRole>
  }
}

// --- Inventories ---

export interface Inventory {
  id: number
  name: string
  description: string
  kind: '' | 'smart' | 'constructed'
  type: 'inventory'
  total_hosts: number
  hosts_with_active_failures: number
  total_groups: number
  has_active_failures: boolean
  total_inventory_sources: number
  has_inventory_sources: boolean
  organization: number
  variables: string
  created: string
  modified: string
  summary_fields: {
    organization: { id: number; name: string }
    created_by?: { id: number; username: string }
    modified_by?: { id: number; username: string }
    object_roles?: Record<string, ObjectRole>
  }
}

export interface Host {
  id: number
  name: string
  description: string
  enabled: boolean
  instance_id: string
  variables: string
  has_active_failures: boolean
  has_inventory_sources: boolean
  last_job: number | null
  last_job_host_summary: number | null
  inventory: number
  created: string
  modified: string
  summary_fields: {
    inventory: { id: number; name: string }
    last_job?: { id: number; name: string; status: JobStatus; finished: string | null }
    last_job_host_summary?: { failed: boolean }
    groups?: { count: number; results: Array<{ id: number; name: string }> }
    recent_jobs?: Array<{ id: number; name: string; status: JobStatus; finished: string }>
  }
}

export interface Group {
  id: number
  name: string
  description: string
  inventory: number
  variables: string
  total_hosts: number
  hosts_with_active_failures: number
  total_groups: number
  has_active_failures: boolean
  has_inventory_sources: boolean
  created: string
  modified: string
  summary_fields: {
    inventory: { id: number; name: string }
  }
}

export interface InventorySource {
  id: number
  name: string
  description: string
  source: string
  source_path: string
  source_vars: string
  enabled_var: string
  enabled_value: string
  host_filter: string
  overwrite: boolean
  overwrite_vars: boolean
  update_on_launch: boolean
  update_cache_timeout: number
  status: JobStatus
  last_job_run: string | null
  last_job_failed: boolean
  inventory: number
  created: string
  modified: string
  summary_fields: {
    inventory: { id: number; name: string }
    credential?: { id: number; name: string; kind: string }
    source_project?: { id: number; name: string }
    last_job?: { id: number; name: string; status: JobStatus; finished: string | null }
  }
}

// --- Credentials ---

export interface CredentialType {
  id: number
  name: string
  description: string
  kind: 'ssh' | 'vault' | 'net' | 'scm' | 'cloud' | 'registry' | 'token' | 'insights' | 'external' | 'kubernetes' | 'galaxy' | 'cryptography'
  namespace: string | null
  managed: boolean
  inputs: Record<string, unknown>
  injectors: Record<string, unknown>
  created: string
  modified: string
}

export interface Credential {
  id: number
  name: string
  description: string
  credential_type: number
  managed: boolean
  inputs: Record<string, unknown>
  organization: number | null
  kind: string
  cloud: boolean
  kubernetes: boolean
  created: string
  modified: string
  summary_fields: {
    credential_type: { id: number; name: string; kind: string }
    organization?: { id: number; name: string }
    created_by?: { id: number; username: string }
    modified_by?: { id: number; username: string }
    owners?: Array<{ id: number; type: string; name: string; url: string }>
    object_roles?: Record<string, ObjectRole>
  }
}

// --- Organizations ---

export interface Organization {
  id: number
  name: string
  description: string
  max_hosts: number
  created: string
  modified: string
  summary_fields: {
    created_by?: { id: number; username: string }
    modified_by?: { id: number; username: string }
    related_field_counts?: {
      inventories: number
      teams: number
      users: number
      job_templates: number
      admins: number
      projects: number
    }
    object_roles?: Record<string, ObjectRole>
  }
}

// --- Teams ---

export interface Team {
  id: number
  name: string
  description: string
  organization: number
  created: string
  modified: string
  summary_fields: {
    organization: { id: number; name: string }
    created_by?: { id: number; username: string }
    modified_by?: { id: number; username: string }
  }
}

// --- Activity Stream ---

export interface ActivityStreamEntry {
  id: number
  timestamp: string
  operation: 'create' | 'update' | 'delete' | 'associate' | 'disassociate'
  changes: Record<string, unknown>
  object1: string
  object2: string
  actor_ip?: string
  actor_user_agent?: string
  actor_session_id?: string
  summary_fields: {
    actor?: { id: number; username: string }
  }
}

// --- Audit Events ---

export interface AuditEvent {
  id: number
  timestamp: string
  actor: number | null
  actor_username: string
  actor_ip: string | null
  actor_user_agent: string
  actor_session_id: string
  category: 'auth' | 'credential_access' | 'permission_change' | 'resource_change' | 'system'
  severity: 'info' | 'warning' | 'critical'
  action: string
  description: string
  resource_type: string
  resource_id: number | null
  resource_name: string
  action_node: string
  detail: Record<string, unknown>
  organization: number | null
}

// --- Schedules ---

export interface Schedule {
  id: number
  name: string
  description: string
  rrule: string
  dtstart: string
  dtend: string | null
  next_run: string | null
  enabled: boolean
  unified_job_template: number
  created: string
  modified: string
  summary_fields: {
    unified_job_template: { id: number; name: string; unified_job_type: string }
    created_by?: { id: number; username: string }
  }
}

// --- Schedule Helpers ---

export interface SchedulePreviewResponse {
  local: string[]
  utc: string[]
}

export interface ScheduleZoneInfoResponse {
  zones: string[]
  links: Record<string, string>
}

export interface SchedulePayload {
  name: string
  description?: string
  rrule: string
  enabled: boolean
  unified_job_template: number
}

// --- Workflow Nodes ---

export interface WorkflowNode {
  id: number
  workflow_job_template: number
  unified_job_template: number | null
  success_nodes: number[]
  failure_nodes: number[]
  always_nodes: number[]
  all_parents_must_converge: boolean
  identifier: string
  extra_data: Record<string, unknown>
  inventory: number | null
  scm_branch: string
  job_type: string
  limit: string
  verbosity: number | null
  summary_fields: {
    unified_job_template?: { id: number; name: string; unified_job_type: string }
    workflow_job_template: { id: number; name: string }
  }
}

export interface WorkflowNodePayload {
  unified_job_template?: number
  all_parents_must_converge?: boolean
  identifier?: string
  extra_data?: Record<string, unknown>
  inventory?: number | null
  scm_branch?: string
  job_type?: string
  limit?: string
  verbosity?: number | null
}

// --- Receptor / Topology ---

export interface ReceptorAddress {
  id: number
  address: string
  port: number
  protocol: string
  is_internal: boolean
  canonical: boolean
  instance: number
}

// --- Notification Templates ---

export type NotificationType =
  | 'awssns'
  | 'email'
  | 'slack'
  | 'twilio'
  | 'pagerduty'
  | 'grafana'
  | 'webhook'
  | 'mattermost'
  | 'rocketchat'
  | 'irc'

export interface NotificationTemplate {
  id: number
  name: string
  description: string
  organization: number | null
  notification_type: NotificationType
  notification_configuration: Record<string, unknown>
  messages: Record<string, unknown> | null
  created: string
  modified: string
  summary_fields: {
    organization?: { id: number; name: string }
    created_by?: { id: number; username: string }
    modified_by?: { id: number; username: string }
    recent_notifications?: Array<{ id: number; status: string; created: string; error: string }>
    user_capabilities?: { edit: boolean; delete: boolean; copy: boolean }
  }
}

export interface Notification {
  id: number
  notification_template: number
  notification_type: NotificationType
  status: 'successful' | 'failed' | 'pending'
  error: string
  subject: string
  recipients: string
  body: Record<string, unknown>
  created: string
}

// --- RBAC ---

export interface ObjectRole {
  id: number
  name: string
  description: string
  user_only?: boolean
}

export interface RoleUser {
  id: number
  username: string
  first_name: string
  last_name: string
}

export interface RoleTeam {
  id: number
  name: string
}

// --- Instances & Instance Groups ---

export interface Instance {
  id: number
  hostname: string
  node_type: 'control' | 'execution' | 'hybrid' | 'hop'
  node_state: string
  enabled: boolean
  capacity: number
  consumed_capacity: number
  percent_capacity_remaining: number
  jobs_running: number
  jobs_total: number
  cpu: number
  memory: number
  cpu_capacity: number
  mem_capacity: number
  version: string
  errors: string
  last_seen: string
  health_check_started: string | null
  health_check_pending: boolean
  created: string
  modified: string
}

export interface InstanceGroup {
  id: number
  name: string
  is_container_group: boolean
  capacity: number
  consumed_capacity: number
  percent_capacity_remaining: number
  jobs_running: number
  jobs_total: number
  instances: number
  policy_instance_minimum: number
  policy_instance_percentage: number
  max_concurrent_jobs: number
  max_forks: number
  created: string
  modified: string
  summary_fields: {
    object_roles?: Record<string, { id: number; name: string; description: string }>
  }
}

// --- Execution Environments ---

export interface ExecutionEnvironment {
  id: number
  name: string
  description: string
  image: string
  managed: boolean
  pull: 'always' | 'missing' | 'never'
  organization: number | null
  credential: number | null
  created: string
  modified: string
  summary_fields: {
    organization?: { id: number; name: string }
    credential?: { id: number; name: string }
  }
}
