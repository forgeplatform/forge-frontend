import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Anvil, KeyRound } from 'lucide-react'
import { useLogin } from '@/api/hooks/useAuth'
import { useAuthenticateWebAuthn } from '@/api/hooks/useWebAuthn'
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
import { useThemeStore } from '@/stores/theme'
import { Moon, Sun } from 'lucide-react'
import { useEffect } from 'react'

export function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const login = useLogin()
  const webauthn = useAuthenticateWebAuthn()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useThemeStore()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    login.mutate(
      { username, password },
      {
        onSuccess: () => navigate('/'),
      },
    )
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-background px-4">
      <div className="absolute right-4 top-4">
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="mb-8 flex items-center gap-3">
        <Anvil className="h-10 w-10 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Forail</h1>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {login.isError && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Invalid username or password.
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={login.isPending}
            >
              {login.isPending ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-4 space-y-2">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={webauthn.isPending || !username}
              onClick={() =>
                webauthn.mutate(
                  { username },
                  {
                    onSuccess: (data) => {
                      if (data?.logged_in) navigate('/')
                    },
                  },
                )
              }
            >
              <KeyRound className="mr-2 h-4 w-4" />
              {webauthn.isPending ? 'Waiting for key…' : 'Sign in with security key'}
            </Button>

            <a
              href="/sso/login/oidc/"
              className="block w-full rounded-md border border-input bg-background px-4 py-2 text-center text-sm font-medium ring-offset-background hover:bg-accent hover:text-accent-foreground"
            >
              Sign in with OIDC
            </a>
          </div>
        </CardContent>
      </Card>

      <p className="mt-6 text-xs text-muted-foreground">
        Forail &mdash; Infrastructure Automation Platform
      </p>
    </div>
  )
}
