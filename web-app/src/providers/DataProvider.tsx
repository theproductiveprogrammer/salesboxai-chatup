import { useMessages } from '@/hooks/useMessages'
import { useModelProvider } from '@/hooks/useModelProvider'

import { useAppUpdater } from '@/hooks/useAppUpdater'
import { fetchMessages } from '@/services/messages'
import { fetchThreads } from '@/services/threads'
import { useEffect } from 'react'
import { useMCPServers } from '@/hooks/useMCPServers'
import { getMCPConfig } from '@/services/mcp'
import { useAssistant } from '@/hooks/useAssistant'
import { getAssistants } from '@/services/assistants'
import {
  onOpenUrl,
  getCurrent as getCurrentDeepLinkUrls,
} from '@tauri-apps/plugin-deep-link'
import { useNavigate } from '@tanstack/react-router'
import { route } from '@/constants/routes'
import { useThreads } from '@/hooks/useThreads'
import { useLocalApiServer } from '@/hooks/useLocalApiServer'

export function DataProvider() {
  // Model provider is now hardcoded to salesbox + gpt-4o-mini
  // No need to load or set providers
  const { selectModelProvider } = useModelProvider()

  const { setMessages } = useMessages()
  const { checkForUpdate } = useAppUpdater()
  const { setServers } = useMCPServers()
  const { setAssistants, initializeWithLastUsed } = useAssistant()
  const { setThreads } = useThreads()
  const navigate = useNavigate()

  // Local API Server hooks - TEMP: kept for when we re-enable
  const { enableOnStartup } = useLocalApiServer()

  useEffect(() => {
    console.log('Initializing DataProvider...')

    // Ensure salesbox provider and gpt-4o-mini model are selected
    selectModelProvider('salesbox', 'gpt-4o-mini')

    getMCPConfig().then((data) => setServers(data.mcpServers ?? []))
    getAssistants()
      .then((data) => {
        // Only update assistants if we have valid data
        if (data && Array.isArray(data) && data.length > 0) {
          setAssistants(data as unknown as Assistant[])
          initializeWithLastUsed()
        }
      })
      .catch((error) => {
        console.warn('Failed to load assistants, keeping default:', error)
      })
    getCurrentDeepLinkUrls().then(handleDeepLink)
    onOpenUrl(handleDeepLink)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchThreads().then((threads) => {
      setThreads(threads)
      threads.forEach((thread) =>
        fetchMessages(thread.id).then((messages) =>
          setMessages(thread.id, messages)
        )
      )
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Check for app updates
  useEffect(() => {
    // Only check for updates if the auto updater is not disabled
    // App might be distributed via other package managers
    // or methods that handle updates differently
    if (!AUTO_UPDATER_DISABLED) {
      checkForUpdate()
    }
  }, [checkForUpdate])

  // Model imported event no longer needed - we only use salesbox provider

  // TEMP: Commented out while debugging - will restore when re-enabling auto-start
  // const getLastUsedModel = (): { provider: string; model: string } | null => {
  //   try {
  //     const stored = localStorage.getItem(localStorageKey.lastUsedModel)
  //     return stored ? JSON.parse(stored) : null
  //   } catch (error) {
  //     console.debug('Failed to get last used model from localStorage:', error)
  //     return null
  //   }
  // }

  // // Helper function to determine which model to start
  // const getModelToStart = () => {
  //   // Use last used model if available
  //   const lastUsedModel = getLastUsedModel()
  //   if (lastUsedModel) {
  //     const provider = getProviderByName(lastUsedModel.provider)
  //     if (
  //       provider &&
  //       provider.models.some((m) => m.id === lastUsedModel.model)
  //     ) {
  //       return { model: lastUsedModel.model, provider }
  //     }
  //   }

  //   // Use selected model if available
  //   if (selectedModel && selectedProvider) {
  //     const provider = getProviderByName(selectedProvider)
  //     if (provider) {
  //       return { model: selectedModel.id, provider }
  //     }
  //   }

  //   // Use first model from llamacpp provider
  //   const llamacppProvider = getProviderByName('llamacpp')
  //   if (
  //     llamacppProvider &&
  //     llamacppProvider.models &&
  //     llamacppProvider.models.length > 0
  //   ) {
  //     return {
  //       model: llamacppProvider.models[0].id,
  //       provider: llamacppProvider,
  //     }
  //   }

  //   return null
  // }

  // Auto-start Local API Server on app startup if enabled
  useEffect(() => {
    // TEMPORARILY DISABLED to debug model reload issue
    console.log('DataProvider auto-start effect running, enableOnStartup:', enableOnStartup)
    console.log('TEMP: Auto-start disabled for debugging')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDeepLink = (urls: string[] | null) => {
    if (!urls) return
    console.log('Received deeplink:', urls)
    const deeplink = urls[0]
    if (deeplink) {
      const url = new URL(deeplink)
      const params = url.pathname.split('/').filter((str) => str.length > 0)

      if (params.length < 3) return undefined
      // const action = params[0]
      // const provider = params[1]
      const resource = params.slice(1).join('/')
      // return { action, provider, resource }
      navigate({
        to: route.hub.model,
        search: {
          repo: resource,
        },
      })
    }
  }

  return null
}
