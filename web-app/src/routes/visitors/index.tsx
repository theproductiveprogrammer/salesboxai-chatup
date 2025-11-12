import { useEffect, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  IconMessageCircle,
  IconRefresh,
  IconUser,
  IconCheck,
} from '@tabler/icons-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RenderMarkdown } from '@/containers/RenderMarkdown'
import {
  getVisitorConversations,
  extractVisitorInfo,
  isICPMatch,
} from '@/services/visitors'
import type { ParsedVisitorConversation } from '@/types/visitors'
import { route } from '@/constants/routes'
import { formatRelativeTime } from '@/utils/formatRelativeTime'
import { useLeadContext } from '@/hooks/useLeadContext'

export const Route = createFileRoute('/visitors/')({
  component: VisitorsPage,
})

function VisitorsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { setLeadContext } = useLeadContext()
  const [visitors, setVisitors] = useState<ParsedVisitorConversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch visitors
  const fetchVisitors = async () => {
    try {
      setError(null)
      const data = await getVisitorConversations()
      setVisitors(data)
    } catch (err) {
      console.error('Error fetching visitors:', err)
      setError(err instanceof Error ? err.message : 'Failed to load visitors')
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchVisitors()
  }, [])

  // Poll for updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchVisitors()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  // Handle chat button click
  const handleEngageVisitor = async (visitor: ParsedVisitorConversation) => {
    const info = extractVisitorInfo(visitor.data.content)

    if (!info.linkedinUrl) {
      console.log('No LinkedIn URL found for visitor:', visitor.id)
      return
    }

    try {
      // Set lead context before navigation
      setLeadContext({
        name: info.visitorName,
        linkedin: info.linkedinUrl,
        id: info.leadId,
        company: info.companyName,
      })

      // Pre-fill message for the user to edit/submit
      const message = `Please get detailed information about this lead: ${info.linkedinUrl}`

      // Navigate to home (New Chat) with pre-filled message
      await router.navigate({
        to: route.home,
        search: { message },
      })

      console.log('Successfully navigated to new chat with pre-filled message')
    } catch (error) {
      console.error('Error navigating to chat:', error)
    }
  }

  // Handle refresh
  const handleRefresh = () => {
    setLoading(true)
    fetchVisitors()
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-none px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Visitors</h1>
            <p className="text-muted-foreground">
              Website visitors identified by your AI agent
            </p>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <IconRefresh
              className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading && visitors.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">{t('common:loading')}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <p className="text-destructive">{error}</p>
            <Button onClick={handleRefresh} variant="outline">
              {t('common:retry')}
            </Button>
          </div>
        ) : visitors.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">No visitors yet</p>
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            {visitors.map((visitor) => (
              <VisitorCard
                key={visitor.id}
                visitor={visitor}
                onEngage={() => handleEngageVisitor(visitor)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function VisitorCard({
  visitor,
  onEngage,
}: {
  visitor: ParsedVisitorConversation
  onEngage: () => void
}) {
  const icpMatch = isICPMatch(visitor.data.content)
  const info = extractVisitorInfo(visitor.data.content)

  return (
    <div
      className={`relative rounded-xl border bg-card shadow-sm transition-all hover:shadow-md ${
        icpMatch
          ? 'border-l-2 border-green-500 bg-green-50/5 dark:bg-green-950/10'
          : 'border-l-2 border-blue-500/30 bg-blue-100/10'
      }`}
    >
      <div className="p-5">
        {/* Header with avatar and metadata */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className={`flex-shrink-0 rounded-full p-2 ${
              icpMatch
                ? 'bg-green-100 dark:bg-green-900/30'
                : 'bg-blue-100 dark:bg-blue-900/30'
            }`}
          >
            <IconUser
              className={`h-5 w-5 ${
                icpMatch
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-blue-600 dark:text-blue-400'
              }`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm">
                {info.visitorName || 'Anonymous Visitor'}
              </span>
              {icpMatch && (
                <Badge
                  variant="outline"
                  className="gap-1 text-xs bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700"
                >
                  <IconCheck className="h-3 w-3" />
                  ICP Match
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {info.companyName && <span>{info.companyName} • </span>}
              {formatRelativeTime(visitor.timestamp, { addSuffix: true })}
            </div>
          </div>
        </div>

        {/* Markdown content */}
        <div className="prose prose-sm dark:prose-invert max-w-none ml-11 mb-3">
          <RenderMarkdown
            content={visitor.data.content}
            className="select-text"
          />
        </div>

        {/* Footer with action */}
        <div className="flex items-center justify-end ml-11">
          <Button
            size="sm"
            onClick={onEngage}
            variant="default"
            className="gap-2"
          >
            <IconMessageCircle className="h-4 w-4" />
            Chat
          </Button>
        </div>
      </div>
    </div>
  )
}
