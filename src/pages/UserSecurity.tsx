import { useState } from 'react'
import { ShieldCheck, KeyRound, Plus, Trash, Pencil, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  useWebAuthnCredentials,
  useRegisterWebAuthn,
  useRenameWebAuthnCredential,
  useDeleteWebAuthnCredential,
} from '@/api/hooks/useWebAuthn'
import { formatRelativeTime } from '@/lib/utils'

export function UserSecurity() {
  const { data, isLoading } = useWebAuthnCredentials()
  const registerMutation = useRegisterWebAuthn()
  const renameMutation = useRenameWebAuthnCredential()
  const deleteMutation = useDeleteWebAuthnCredential()

  const [newLabel, setNewLabel] = useState('')

  const handleAdd = async () => {
    if (!newLabel.trim()) return
    registerMutation.mutate(newLabel.trim(), {
      onSuccess: () => setNewLabel(''),
    })
  }

  const handleRename = (id: number, current: string) => {
    const next = window.prompt('Rename security key', current)
    if (next && next !== current) {
      renameMutation.mutate({ id, label: next })
    }
  }

  const handleDelete = (id: number, label: string) => {
    if (window.confirm(`Remove "${label}"? You will no longer be able to sign in with it.`)) {
      deleteMutation.mutate(id)
    }
  }

  const credentials = data?.results ?? []

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ShieldCheck className="h-6 w-6" />
          Security
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your security keys (FIDO2 / WebAuthn). Use them for passwordless
          login or as a second factor when your organization requires it.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add a security key</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Nickname (e.g. YubiKey, Touch ID)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              maxLength={128}
            />
            <Button onClick={handleAdd} disabled={registerMutation.isPending || !newLabel.trim()}>
              {registerMutation.isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-1 h-4 w-4" />
              )}
              Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Your browser will prompt you to touch your key, use Touch ID, or enter a PIN.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Registered keys
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : credentials.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              You have no security keys registered yet.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-t border-b text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">Label</th>
                  <th className="p-3">Transports</th>
                  <th className="p-3">Last used</th>
                  <th className="p-3">Added</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {credentials.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="p-3 font-medium">{c.label || 'Unnamed key'}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        {c.transports.map((t) => (
                          <Badge key={t} variant="outline" className="text-xs">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {c.last_used_at ? formatRelativeTime(c.last_used_at) : 'Never'}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {formatRelativeTime(c.created)}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRename(c.id, c.label)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(c.id, c.label)}
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
