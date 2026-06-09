import { Routes, Route, Navigate } from 'react-router-dom'
import { useMe } from '@/api/hooks/useAuth'
import { useThemeStore } from '@/stores/theme'
import { AppLayout } from '@/components/layout/AppLayout'
import { AssistantPanel } from '@/components/assistant/AssistantPanel'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { Jobs } from '@/pages/Jobs'
import { JobDetail } from '@/pages/JobDetail'
import { Templates } from '@/pages/Templates'
import { TemplateDetail } from '@/pages/TemplateDetail'
import { Projects } from '@/pages/Projects'
import { ProjectDetail } from '@/pages/ProjectDetail'
import { Inventories } from '@/pages/Inventories'
import { InventoryDetail } from '@/pages/InventoryDetail'
import { Credentials } from '@/pages/Credentials'
import { CredentialDetail } from '@/pages/CredentialDetail'
import { Organizations } from '@/pages/Organizations'
import { OrganizationDetail } from '@/pages/OrganizationDetail'
import { Users } from '@/pages/Users'
import { UserDetail } from '@/pages/UserDetail'
import { Teams } from '@/pages/Teams'
import { TeamDetail } from '@/pages/TeamDetail'
import { Hosts } from '@/pages/Hosts'
import { HostDetail } from '@/pages/HostDetail'
import { Schedules } from '@/pages/Schedules'
import { ScheduleDetail } from '@/pages/ScheduleDetail'
import { ActivityStream } from '@/pages/ActivityStream'
import { AuditLog } from '@/pages/AuditLog'
import { JobTemplateForm } from '@/pages/JobTemplateForm'
import { ProjectForm } from '@/pages/ProjectForm'
import { InventoryForm } from '@/pages/InventoryForm'
import { CredentialForm } from '@/pages/CredentialForm'
import { OrganizationForm } from '@/pages/OrganizationForm'
import { Instances } from '@/pages/Instances'
import { InstanceDetail } from '@/pages/InstanceDetail'
import { InstanceGroups } from '@/pages/InstanceGroups'
import { InstanceGroupDetail } from '@/pages/InstanceGroupDetail'
import { ExecutionEnvironments } from '@/pages/ExecutionEnvironments'
import { ExecutionEnvironmentDetail } from '@/pages/ExecutionEnvironmentDetail'
import { Settings } from '@/pages/Settings'
import { SettingsCategory } from '@/pages/SettingsCategory'
import { UserForm } from '@/pages/UserForm'
import { TeamForm } from '@/pages/TeamForm'
import { WorkflowJobTemplateForm } from '@/pages/WorkflowJobTemplateForm'
import { NotificationTemplates } from '@/pages/NotificationTemplates'
import { NotificationTemplateDetail } from '@/pages/NotificationTemplateDetail'
import { NotificationTemplateForm } from '@/pages/NotificationTemplateForm'
import { NotFound } from '@/pages/NotFound'
import { ScheduleForm } from '@/pages/ScheduleForm'
import { WorkflowTemplateDetail } from '@/pages/WorkflowTemplateDetail'
import { TopologyPage } from '@/pages/TopologyPage'
import { ForcePasswordChange } from '@/pages/ForcePasswordChange'
import { EventRules } from '@/pages/EventRules'
import { EventRuleDetail } from '@/pages/EventRuleDetail'
import { EventRuleForm } from '@/pages/EventRuleForm'
import { EventLogs } from '@/pages/EventLogs'
import { EventLogDetail } from '@/pages/EventLogDetail'
import { OutboundWebhooks } from '@/pages/OutboundWebhooks'
import { OutboundWebhookDetail } from '@/pages/OutboundWebhookDetail'
import { OutboundWebhookForm } from '@/pages/OutboundWebhookForm'
import { DriftDetections } from '@/pages/DriftDetections'
import { DriftDetectionDetail } from '@/pages/DriftDetectionDetail'
import { DriftAlertRules } from '@/pages/DriftAlertRules'
import { DriftAlertRuleDetail } from '@/pages/DriftAlertRuleDetail'
import { DriftAlertRuleForm } from '@/pages/DriftAlertRuleForm'
import { DriftAlerts } from '@/pages/DriftAlerts'
import { DriftAlertDetail } from '@/pages/DriftAlertDetail'
import { FactSnapshots } from '@/pages/FactSnapshots'
import { Analytics } from '@/pages/Analytics'
import { ServicePortal } from '@/pages/ServicePortal'
import { MyServiceRequests } from '@/pages/MyServiceRequests'
import { ServiceRequestDetail } from '@/pages/ServiceRequestDetail'
import { ServiceApprovals } from '@/pages/ServiceApprovals'
import { ServiceCatalogAdmin } from '@/pages/ServiceCatalogAdmin'
import { ServiceCatalogItemForm } from '@/pages/ServiceCatalogItemForm'
import { UserSecurity } from '@/pages/UserSecurity'
import { MfaChallenge } from '@/pages/MfaChallenge'
import { Policies } from '@/pages/Policies'
import { PolicyForm } from '@/pages/PolicyForm'
import { PolicyDecisions } from '@/pages/PolicyDecisions'
import { Scanners } from '@/pages/Scanners'
import { ScannerForm } from '@/pages/ScannerForm'
import { ScanResults } from '@/pages/ScanResults'
import { Observability } from '@/pages/Observability'
import { Tenants } from '@/pages/Tenants'
import { TenantForm } from '@/pages/TenantForm'
import { TenantDetail } from '@/pages/TenantDetail'
import { TenantQuotaEvents } from '@/pages/TenantQuotaEvents'
import { GettingStartedWizard } from '@/pages/wizards/GettingStartedWizard'
import { AutomationWizard } from '@/pages/wizards/AutomationWizard'
import { SelfServiceWizard } from '@/pages/wizards/SelfServiceWizard'
import { TenancyWizard } from '@/pages/wizards/TenancyWizard'
import { ComplianceWizard } from '@/pages/wizards/ComplianceWizard'
import { ResourcesWizard } from '@/pages/wizards/ResourcesWizard'
import { AccessWizard } from '@/pages/wizards/AccessWizard'
import { useEffect } from 'react'

function AuthenticatedRoutes() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Jobs */}
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetail />} />

        {/* Templates */}
        <Route path="/templates" element={<Templates />} />
        <Route path="/templates/job_template/new" element={<JobTemplateForm />} />
        <Route path="/templates/job_template/:id/edit" element={<JobTemplateForm />} />
        <Route path="/templates/workflow_job_template/new" element={<WorkflowJobTemplateForm />} />
        <Route path="/templates/workflow_job_template/:id/edit" element={<WorkflowJobTemplateForm />} />
        <Route path="/templates/workflow_job_template/:id" element={<WorkflowTemplateDetail />} />
        <Route path="/templates/:type/:id" element={<TemplateDetail />} />

        {/* Projects */}
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/new" element={<ProjectForm />} />
        <Route path="/projects/:id/edit" element={<ProjectForm />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />

        {/* Inventories */}
        <Route path="/inventories" element={<Inventories />} />
        <Route path="/inventories/new" element={<InventoryForm />} />
        <Route path="/inventories/:id/edit" element={<InventoryForm />} />
        <Route path="/inventories/:id" element={<InventoryDetail />} />

        {/* Credentials */}
        <Route path="/credentials" element={<Credentials />} />
        <Route path="/credentials/new" element={<CredentialForm />} />
        <Route path="/credentials/:id/edit" element={<CredentialForm />} />
        <Route path="/credentials/:id" element={<CredentialDetail />} />

        {/* Access */}
        <Route path="/organizations" element={<Organizations />} />
        <Route path="/organizations/new" element={<OrganizationForm />} />
        <Route path="/organizations/:id/edit" element={<OrganizationForm />} />
        <Route path="/organizations/:id" element={<OrganizationDetail />} />
        <Route path="/users" element={<Users />} />
        <Route path="/users/new" element={<UserForm />} />
        <Route path="/users/:id/edit" element={<UserForm />} />
        <Route path="/users/:id" element={<UserDetail />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/teams/new" element={<TeamForm />} />
        <Route path="/teams/:id/edit" element={<TeamForm />} />
        <Route path="/teams/:id" element={<TeamDetail />} />

        {/* Administration */}
        <Route path="/instances" element={<Instances />} />
        <Route path="/instances/:id" element={<InstanceDetail />} />
        <Route path="/instance_groups" element={<InstanceGroups />} />
        <Route path="/instance_groups/:id" element={<InstanceGroupDetail />} />
        <Route path="/execution_environments" element={<ExecutionEnvironments />} />
        <Route path="/execution_environments/:id" element={<ExecutionEnvironmentDetail />} />

        {/* Other */}
        <Route path="/hosts" element={<Hosts />} />
        <Route path="/hosts/:id" element={<HostDetail />} />
        <Route path="/schedules" element={<Schedules />} />
        <Route path="/schedules/new" element={<ScheduleForm />} />
        <Route path="/schedules/:id/edit" element={<ScheduleForm />} />
        <Route path="/schedules/:id" element={<ScheduleDetail />} />
        <Route path="/notification_templates" element={<NotificationTemplates />} />
        <Route path="/notification_templates/new" element={<NotificationTemplateForm />} />
        <Route path="/notification_templates/:id/edit" element={<NotificationTemplateForm />} />
        <Route path="/notification_templates/:id" element={<NotificationTemplateDetail />} />
        <Route path="/topology" element={<TopologyPage />} />
        <Route path="/activity" element={<ActivityStream />} />
        <Route path="/audit" element={<AuditLog />} />

        {/* Event-Driven Automation */}
        <Route path="/event_rules" element={<EventRules />} />
        <Route path="/event_rules/new" element={<EventRuleForm />} />
        <Route path="/event_rules/:id/edit" element={<EventRuleForm />} />
        <Route path="/event_rules/:id" element={<EventRuleDetail />} />
        <Route path="/event_logs" element={<EventLogs />} />
        <Route path="/event_logs/:id" element={<EventLogDetail />} />
        <Route path="/outbound_webhooks" element={<OutboundWebhooks />} />
        <Route path="/outbound_webhooks/new" element={<OutboundWebhookForm />} />
        <Route path="/outbound_webhooks/:id/edit" element={<OutboundWebhookForm />} />
        <Route path="/outbound_webhooks/:id" element={<OutboundWebhookDetail />} />

        {/* Drift Detection */}
        <Route path="/drift_detections" element={<DriftDetections />} />
        <Route path="/drift_detections/:id" element={<DriftDetectionDetail />} />
        <Route path="/drift_alert_rules" element={<DriftAlertRules />} />
        <Route path="/drift_alert_rules/new" element={<DriftAlertRuleForm />} />
        <Route path="/drift_alert_rules/:id/edit" element={<DriftAlertRuleForm />} />
        <Route path="/drift_alert_rules/:id" element={<DriftAlertRuleDetail />} />
        <Route path="/drift_alerts" element={<DriftAlerts />} />
        <Route path="/drift_alerts/:id" element={<DriftAlertDetail />} />
        <Route path="/fact_snapshots" element={<FactSnapshots />} />

        {/* Analytics */}
        <Route path="/analytics" element={<Analytics />} />

        {/* Self-Service Portal */}
        <Route path="/service_portal" element={<ServicePortal />} />
        <Route path="/my_requests" element={<MyServiceRequests />} />
        <Route path="/service_requests/:id" element={<ServiceRequestDetail />} />
        <Route path="/service_approvals" element={<ServiceApprovals />} />
        <Route path="/service_catalog" element={<ServiceCatalogAdmin />} />
        <Route path="/service_catalog/new" element={<ServiceCatalogItemForm />} />
        <Route path="/service_catalog/:id/edit" element={<ServiceCatalogItemForm />} />

        {/* Account security */}
        <Route path="/me/security" element={<UserSecurity />} />
        <Route path="/auth/mfa" element={<MfaChallenge />} />

        {/* Policy-as-Code */}
        <Route path="/policies" element={<Policies />} />
        <Route path="/policies/new" element={<PolicyForm />} />
        <Route path="/policies/:id/edit" element={<PolicyForm />} />
        <Route path="/policy_decisions" element={<PolicyDecisions />} />
        <Route path="/scanners" element={<Scanners />} />
        <Route path="/scanners/new" element={<ScannerForm />} />
        <Route path="/scanners/:id/edit" element={<ScannerForm />} />
        <Route path="/scan_results" element={<ScanResults />} />
        <Route path="/observability" element={<Observability />} />

        {/* Multi-Tenancy */}
        <Route path="/tenants" element={<Tenants />} />
        <Route path="/tenants/new" element={<TenantForm />} />
        <Route path="/tenants/:id/edit" element={<TenantForm />} />
        <Route path="/tenants/:id" element={<TenantDetail />} />
        <Route path="/tenant_quota_events" element={<TenantQuotaEvents />} />

        {/* Wizards */}
        <Route path="/wizards/getting-started" element={<GettingStartedWizard />} />
        <Route path="/wizards/automation" element={<AutomationWizard />} />
        <Route path="/wizards/self-service" element={<SelfServiceWizard />} />
        <Route path="/wizards/tenancy" element={<TenancyWizard />} />
        <Route path="/wizards/compliance" element={<ComplianceWizard />} />
        <Route path="/wizards/resources" element={<ResourcesWizard />} />
        <Route path="/wizards/access" element={<AccessWizard />} />

        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/:slug" element={<SettingsCategory />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      <AssistantPanel />
    </AppLayout>
  )
}

export function App() {
  const { data: me, isLoading, isError } = useMe()
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (isError || !me) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  // Force password change on first login after deployment
  const passwordChangedKey = `forail_password_changed_${me.id}`
  const needsPasswordChange = me.is_superuser && !localStorage.getItem(passwordChangedKey)

  if (needsPasswordChange) {
    return (
      <Routes>
        <Route path="*" element={<ForcePasswordChange />} />
      </Routes>
    )
  }

  return <AuthenticatedRoutes />
}
