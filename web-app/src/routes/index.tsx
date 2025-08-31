/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, useSearch } from '@tanstack/react-router'
import ChatInput from '@/containers/ChatInput'
import HeaderPage from '@/containers/HeaderPage'
import { useTranslation } from '@/i18n/react-i18next-compat'
import { useTools } from '@/hooks/useTools'

import { useModelProvider } from '@/hooks/useModelProvider'
import SetupScreen from '@/containers/SetupScreen'
import { route } from '@/constants/routes'

type SearchParams = {
  model?: {
    id: string
    provider: string
  }
}
import DropdownAssistant from '@/containers/DropdownAssistant'
import { useEffect } from 'react'
import { useThreads } from '@/hooks/useThreads'

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
  const selectedModel = search.model
  const { setCurrentThreadId } = useThreads()
  useTools()

  // Conditional to check if there are any valid providers
  // required min 1 api_key or 1 model in llama.cpp
  const hasValidProviders = providers.some(
    (provider) =>
      provider.api_key?.length ||
      (provider.provider === 'llamacpp' && provider.models.length)
  )

  useEffect(() => {
    setCurrentThreadId(undefined)
  }, [setCurrentThreadId])

  // Always show the splash screen first
  return <SetupScreen />
}
