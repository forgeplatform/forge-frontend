import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { Anvil, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function ForcePasswordChange() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [validationError, setValidationError] = useState('')
  const [success, setSuccess] = useState(false)
  const user = useAuthStore((s) => s.user)

  const changePassword = useMutation({
    mutationFn: async (password: string) => {
      await api.patch(`/users/${user!.id}/`, { password })
    },
    onSuccess: () => {
      localStorage.setItem(`forge_password_changed_${user!.id}`, 'true')
      setSuccess(true)
      // Redirect to login after 3 seconds so user can log in with new password
      setTimeout(() => {
        window.location.href = '/login'
      }, 3000)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setValidationError('')

    if (newPassword.length < 8) {
      setValidationError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setValidationError('Passwords do not match. Please try again.')
      return
    }

    changePassword.mutate(newPassword)
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 flex items-center gap-3">
        <Anvil className="h-10 w-10 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Forge</h1>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          {success ? (
            <>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
              <CardTitle className="text-xl">Password Changed Successfully</CardTitle>
              <CardDescription>
                Redirecting to login page...
              </CardDescription>
            </>
          ) : (
            <>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <ShieldAlert className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-xl">Password Change Required</CardTitle>
              <CardDescription>
                For security, you must change your password before continuing.
              </CardDescription>
            </>
          )}
        </CardHeader>
        {!success && (
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoFocus
                  autoComplete="new-password"
                  placeholder="Minimum 8 characters"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              {validationError && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {validationError}
                </div>
              )}

              {changePassword.isError && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  Failed to change password. Please try again.
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={changePassword.isPending}
              >
                {changePassword.isPending ? 'Changing...' : 'Change Password'}
              </Button>
            </form>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
