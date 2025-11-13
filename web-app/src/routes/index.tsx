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
  IconBrandLinkedin,
  IconCalendarBolt,
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
import { useLeadContext } from '@/hooks/useLeadContext'

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
  const { leadContext } = useLeadContext()
  useTools()

  const userName = user?.name || user?.username || 'there'

  useEffect(() => {
    setCurrentThreadId(undefined)
  }, [setCurrentThreadId])

  // Helper function to format lead context for prompt
  const formatLeadForPrompt = (): string => {
    if (!leadContext) return ''

    // Build a readable representation of the lead
    const parts: string[] = []

    if (leadContext.name) {
      if (leadContext.id) {
        parts.push(`${leadContext.name}[id:${leadContext.id}]`)
      } else {
        parts.push(leadContext.name)
      }
    } else if (leadContext.id) {
      parts.push(`[id:${leadContext.id}]`)
    }
    if (leadContext.linkedin) parts.push(leadContext.linkedin)
    if (leadContext.email) parts.push(leadContext.email)

    return parts.join(' - ')
  }

  const suggestedActions = [
    {
      icon: IconSearch,
      label: 'Discover leads',
      prompt: 'Please find find leads from: ',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor:
        'bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50',
    },
    {
      icon: IconUserSearch,
      label: 'Find lead information',
      prompt: 'Please find detailed information about this lead: {{lead}}',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor:
        'bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-950/50',
    },
    {
      icon: IconMail,
      label: 'Send email',
      prompt: 'Please send an email to: {{lead}}',
      color: 'text-green-600 dark:text-green-400',
      bgColor:
        'bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-950/50',
    },
    {
      icon: IconBrandLinkedin,
      label: 'Send LinkedIn message',
      prompt: 'Please send a LinkedIn message to: {{lead}}',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor:
        'bg-orange-50 dark:bg-orange-950/30 hover:bg-orange-100 dark:hover:bg-orange-950/50',
    },
    {
      icon: IconCalendarBolt,
      label: 'Appointment Setting',
      prompt: 'Please try and set an appointment with: {{lead}}',
      color: 'text-pink-600 dark:text-pink-400',
      bgColor:
        'bg-pink-50 dark:bg-pink-950/30 hover:bg-pink-100 dark:hover:bg-pink-950/50',
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
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border border-border/20 transition-all ${action.bgColor}`}
                  onClick={() => {
                    // Replace {{lead}} placeholder with actual lead data
                    const leadData = formatLeadForPrompt()
                    const filledPrompt = action.prompt.replace(
                      /\{\{lead\}\}/g,
                      leadData
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
