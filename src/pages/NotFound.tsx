import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

export function NotFound() {
  const { t } = useTranslation()
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <p className="text-lg text-muted-foreground">{t('common.page_not_found')}</p>
      <Link to="/dashboard">
        <Button>{t('common.back_to_dashboard')}</Button>
      </Link>
    </div>
  )
}
