import { createFileRoute } from '@tanstack/react-router'
import { route } from '@/constants/routes'
import SettingsMenu from '@/containers/SettingsMenu'
import HeaderPage from '@/containers/HeaderPage'
import { Card, CardItem } from '@/containers/Card'
import { useTranslation } from '@/i18n/react-i18next-compat'
import { SalesboxAuthStatus } from '@/containers/SalesboxAuthStatus'
import { SalesboxEndpointInput } from '@/containers/SalesboxEndpointInput'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Route = createFileRoute(route.settings.privacy as any)({
  component: Privacy,
})

function Privacy() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col h-full">
      <HeaderPage>
        <h1 className="font-medium">{t('common:settings')}</h1>
      </HeaderPage>
      <div className="flex h-full w-full">
        <SettingsMenu />
        <div className="p-4 w-full h-[calc(100%-32px)] overflow-y-auto">
          <div className="flex flex-col justify-between gap-4 gap-y-3 w-full">
            <Card
              header={
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-main-view-fg font-medium text-base">
                    {t('settings:privacy.security')}
                  </h1>
                </div>
              }
            >
              <CardItem
                title="Authentication"
                description="Manage your SalesBox.AI account authentication and JWT tokens"
                align="start"
                actions={<SalesboxAuthStatus />}
              />
              <CardItem
                title="API Endpoint"
                description="Configure the backend endpoint for API calls (e.g., https://agent.salesbox.ai)"
                align="start"
                actions={<SalesboxEndpointInput />}
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
