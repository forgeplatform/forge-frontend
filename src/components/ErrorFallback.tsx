import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ErrorFallbackProps {
  error: Error
  onReset: () => void
}

export function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  const { t } = useTranslation()
  return (
    <div className="flex h-full items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{t('common.something_went_wrong')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {error.message || t('common.unexpected_error')}
            </p>
          </div>
          <Button onClick={onReset}>{t('common.try_again')}</Button>
        </CardContent>
      </Card>
    </div>
  )
}
