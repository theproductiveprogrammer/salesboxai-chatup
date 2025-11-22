/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, useSearch } from '@tanstack/react-router'
import ChatInput from '@/containers/ChatInput'
import HeaderPage from '@/containers/HeaderPage'
import { useTranslation } from '@/i18n/react-i18next-compat'
import { useTools } from '@/hooks/useTools'
import {
  IconSearch,
  IconUserSearch,
  IconMail,
  IconTargetArrow,
} from '@tabler/icons-react'

import { route } from '@/constants/routes'

type SearchParams = {
  model?: {
    id: string
    provider: string
  }
  message?: string
}
import DropdownAssistant from '@/containers/DropdownAssistant'
import { useEffect } from 'react'
import { useThreads } from '@/hooks/useThreads'
import { useSalesboxAuth } from '@/hooks/useSalesboxAuth'
import { usePrompt } from '@/hooks/usePrompt'

export const Route = createFileRoute(route.home as any)({
  component: Index,
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    model: search.model as SearchParams['model'],
    message: search.message as string | undefined,
  }),
})

function Index() {
  const { t } = useTranslation()
  const search = useSearch({ from: route.home as any })
  const { setCurrentThreadId } = useThreads()
  const { user } = useSalesboxAuth()
  const { setPrompt } = usePrompt()
  useTools()

  const userName = user?.name || user?.username || 'there'

  useEffect(() => {
    setCurrentThreadId(undefined)
  }, [setCurrentThreadId])

  const suggestedActions = [
    {
      icon: IconSearch,
      label: 'Discover leads',
      prompt: 'Please find find leads from: ',
      color: 'text-primary',
      bgColor: 'bg-primary/10 hover:bg-primary/15',
    },
    {
      icon: IconUserSearch,
      label: 'Find lead information',
      prompt: 'Please find detailed information about this lead: {{lead}}',
      color: 'text-primary',
      bgColor: 'bg-accent/30 hover:bg-accent/40',
    },
    {
      icon: IconMail,
      label: 'Send email',
      prompt: 'Please send an email to: {{lead}}',
      color: 'text-primary',
      bgColor: 'bg-primary/8 hover:bg-primary/12',
    },
    {
      icon: IconTargetArrow,
      label: 'Prospect Lead',
      prompt: 'Please start prospecting: {{lead}}',
      color: 'text-primary',
      bgColor: 'bg-accent/20 hover:bg-accent/30',
    },
  ]

  // Always show chat interface directly - no splash screen needed
  return (
    <div className="flex h-full flex-col flex-justify-center">
      <HeaderPage>
        <DropdownAssistant />
      </HeaderPage>
      <div className="h-full px-4 md:px-8 overflow-y-auto flex flex-col gap-2 justify-center">
        <div className="w-full md:w-4/6 mx-auto">
          <div className="mb-8 text-center">
            <h1 className="font-editorialnew text-main-view-fg text-4xl">
              Hi {userName}!
            </h1>
            <p className="text-main-view-fg/70 text-lg mt-2">
              {t('chat:description')}
            </p>
          </div>

          <div className="flex-1 shrink-0">
            <ChatInput
              showSpeedToken={false}
              initialMessage={true}
              initialPrompt={search.message}
              strongBorder={true}
            />
          </div>

          {/* Suggested Actions */}
          <div className="my-6">
            <div className="flex flex-wrap gap-2 justify-center max-w-3xl mx-auto">
              {suggestedActions.map((action, index) => (
                <button
                  key={index}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border border-border/20 transition-all ${action.bgColor} cursor-pointer opacity-80 hover:opacity-100`}
                  onClick={() => {
                    // Replace {{lead}} placeholder with empty string (user will fill in)
                    const filledPrompt = action.prompt.replace(
                      /\{\{lead\}\}/g,
                      ''
                    )
                    setPrompt(filledPrompt)

                    // Focus the textarea after setting the prompt
                    setTimeout(() => {
                      const input = document.querySelector(
                        'textarea'
                      ) as HTMLTextAreaElement
                      if (input) {
                        input.focus()
                      }
                    }, 0)
                  }}
                >
                  <action.icon
                    className={`h-5 w-5 flex-shrink-0 ${action.color}`}
                  />
                  <span className="text-sm font-medium whitespace-nowrap">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
