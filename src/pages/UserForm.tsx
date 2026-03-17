import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useUserDetail, useCreateUser, useUpdateUser } from '@/api/hooks/useUsers'
import { FormPageSkeleton } from '@/components/skeletons/FormPageSkeleton'

export function UserForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id

  const { data: user, isLoading } = useUserDetail(id ?? '')
  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser(id ?? '')

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [isSuperuser, setIsSuperuser] = useState(false)
  const [isAuditor, setIsAuditor] = useState(false)

  useEffect(() => {
    if (isEdit && user) {
      setUsername(user.username)
      setEmail(user.email)
      setFirstName(user.first_name)
      setLastName(user.last_name)
      setIsSuperuser(user.is_superuser)
      setIsAuditor(user.is_system_auditor)
    }
  }, [isEdit, user])

  const isPending = createMutation.isPending || updateMutation.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: Record<string, unknown> = {
      username,
      email,
      first_name: firstName,
      last_name: lastName,
      is_superuser: isSuperuser,
      is_system_auditor: isAuditor,
    }
    if (password) payload.password = password

    const mutation = isEdit ? updateMutation : createMutation
    mutation.mutate(payload, {
      onSuccess: (data) => navigate(`/users/${data.id}`),
    })
  }

  if (isEdit && isLoading) {
    return <FormPageSkeleton />
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/users"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Users
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          {isEdit ? 'Edit User' : 'Create User'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input id="first_name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input id="last_name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{isEdit ? 'Password (leave empty to keep current)' : 'Password *'}</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required={!isEdit} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Permissions</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Switch id="is_superuser" checked={isSuperuser} onCheckedChange={setIsSuperuser} />
              <Label htmlFor="is_superuser">Superuser (Admin)</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="is_auditor" checked={isAuditor} onCheckedChange={setIsAuditor} />
              <Label htmlFor="is_auditor">System Auditor</Label>
            </div>
          </CardContent>
        </Card>

        {(createMutation.error || updateMutation.error) && (
          <p className="text-sm text-destructive">
            {(createMutation.error || updateMutation.error)?.message || 'An error occurred.'}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending || !username}>
            {isPending ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}
            {isEdit ? 'Save Changes' : 'Create User'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
