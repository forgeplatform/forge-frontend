import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Anvil } from 'lucide-react'
import { useAuthenticateWebAuthn } from '@/api/hooks/useWebAuthn'

/**
 * Interstitial shown after primary auth (form / OIDC) when the user's
 * organization requires WebAuthn. Triggers the browser FIDO2 prompt and,
 * on success, redirects to the originally requested page.
 */
export function MfaChallenge() {
  const navigate = useNavigate()
  const auth = useAuthenticateWebAuthn()

  const handleVerify = () => {
    auth.mutate(
      {},
      {
        onSuccess: (data) => {
          if (data?.mfa_satisfied || data?.logged_in) {
            navigate('/')
          }
        },
      },
    )
  }

  // Auto-trigger once on mount — most users want the prompt right away.
  useEffect(() => {
    handleVerify()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 flex items-center gap-3">
        <Anvil className="h-10 w-10 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Forail</h1>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 rounded-full bg-muted p-3">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">Verify your identity</CardTitle>
          <CardDescription>
            Your organization requires a security key to finish signing in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={handleVerify}
            className="w-full"
            disabled={auth.isPending}
          >
            {auth.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Waiting for security key…
              </>
            ) : (
              'Use security key'
            )}
          </Button>
          {auth.isError && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              Verification failed. Try again.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
