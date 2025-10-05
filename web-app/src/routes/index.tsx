/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, useSearch } from '@tanstack/react-router'
import ChatInput from '@/containers/ChatInput'
import HeaderPage from '@/containers/HeaderPage'
import { useTranslation } from '@/i18n/react-i18next-compat'
import { useTools } from '@/hooks/useTools'

import { useModelProvider } from '@/hooks/useModelProvider'
import SetupScreen from '@/containers/SetupScreen'
import { route } from '@/constants/routes'
import { localStorageKey } from '@/constants/localStorage'

type SearchParams = {
  model?: {
    id: string
    provider: string
  }
}
import DropdownAssistant from '@/containers/DropdownAssistant'
import { useEffect, useState } from 'react'
import { useThreads } from '@/hooks/useThreads'
import { useAutoDownloadDefaultModel } from '@/hooks/useAutoDownloadDefaultModel'
import { DownloadProgressScreen } from '@/containers/DownloadProgressScreen'

export const Route = createFileRoute(route.home as any)({
  component: Index,
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    model: search.model as SearchParams['model'],
  }),
})

function Index() {
  const { t } = useTranslation()
  const { providers } = useModelProvider()
  const search = useSearch({ from: route.home as any })
  const { setCurrentThreadId } = useThreads()
  const [splashScreenShown, setSplashScreenShown] = useState(() => {
    // Check if splash has been shown in this session
    return sessionStorage.getItem('splashScreenShown') === 'true'
  })
  useTools()

  // Auto-download default model on first launch
  const { isAutoDownloading, autoDownloadComplete, hasValidProviders } =
    useAutoDownloadDefaultModel()

  const selectedModel = search.model

  useEffect(() => {
    setCurrentThreadId(undefined)
  }, [setCurrentThreadId])

  // Auto-proceed when download completes and save Jan-Nano as lastUsedModel
  useEffect(() => {
    if (autoDownloadComplete && !splashScreenShown) {
      console.log('✅ Auto-download complete, proceeding to chat')

      // Save Jan-Nano to localStorage so it's auto-selected
      const llamacppProvider = providers.find(
        (p) => p.provider === 'llamacpp' && p.models.length > 0
      )
      if (llamacppProvider && llamacppProvider.models.length > 0) {
        const janNano = llamacppProvider.models[0]
        localStorage.setItem(
          localStorageKey.lastUsedModel,
          JSON.stringify({ provider: 'llamacpp', model: janNano.id })
        )
        console.log('💾 Saved Jan-Nano as lastUsedModel:', janNano.id)
      }

      setSplashScreenShown(true)
      sessionStorage.setItem('splashScreenShown', 'true')
    }
  }, [autoDownloadComplete, splashScreenShown, providers])

  // Debug: Log current state
  useEffect(() => {
    console.log('🎯 Route state:', {
      isAutoDownloading,
      autoDownloadComplete,
      hasValidProviders,
      splashScreenShown,
    })
  }, [isAutoDownloading, autoDownloadComplete, hasValidProviders, splashScreenShown])

  // Function to handle proceeding from splash screen
  const handleProceedFromSplash = () => {
    setSplashScreenShown(true)
    sessionStorage.setItem('splashScreenShown', 'true')
  }

  // Show download progress if auto-downloading
  if (isAutoDownloading) {
    return <DownloadProgressScreen />
  }

  // If no valid providers and not auto-downloading, show setup screen
  if (!hasValidProviders && !autoDownloadComplete) {
    return <SetupScreen onProceed={handleProceedFromSplash} />
  }

  // If splash screen hasn't been shown yet and has valid providers, show it with proceed button
  if (!splashScreenShown && hasValidProviders) {
    return <SetupScreen onProceed={handleProceedFromSplash} />
  }

  // Otherwise show the chat interface
  return (
    <div className="flex h-full flex-col flex-justify-center">
      <HeaderPage>
        <DropdownAssistant />
      </HeaderPage>
      <div className="h-full px-4 md:px-8 overflow-y-auto flex flex-col gap-2 justify-center">
        <div className="w-full md:w-4/6 mx-auto">
          <div className="mb-8 text-center">
            <h1 className="font-editorialnew text-main-view-fg text-4xl">
              {t('chat:welcome')}
            </h1>
            <p className="text-main-view-fg/70 text-lg mt-2">
              {t('chat:description')}
            </p>
          </div>
          <div className="flex-1 shrink-0">
            <ChatInput
              showSpeedToken={false}
              model={selectedModel}
              initialMessage={true}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
