import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const settingsCategories = [
  {
    title: 'Authentication',
    description: 'Configure login providers: LDAP, SAML, GitHub, Google, Azure AD',
    slug: 'authentication',
  },
  {
    title: 'Jobs',
    description: 'Job execution settings, isolation, timeouts, and paths',
    slug: 'jobs',
  },
  {
    title: 'System',
    description: 'Base URL, proxy settings, license, and platform configuration',
    slug: 'system',
  },
  {
    title: 'User Interface',
    description: 'UI customization, analytics, and branding',
    slug: 'ui',
  },
  {
    title: 'Logging',
    description: 'External log aggregator settings and integration',
    slug: 'logging',
  },
  {
    title: 'Miscellaneous',
    description: 'Other platform-wide settings',
    slug: 'misc',
  },
]

export function Settings() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Platform configuration and preferences
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {settingsCategories.map((cat) => (
          <Card
            key={cat.slug}
            className="cursor-pointer transition-colors hover:border-primary/50"
            onClick={() => navigate(`/settings/${cat.slug}`)}
          >
            <CardHeader>
              <CardTitle className="text-base">{cat.title}</CardTitle>
              <CardDescription>{cat.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}
