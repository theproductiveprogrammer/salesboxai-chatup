import { useEffect, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {IconMessageCircle, IconRefresh} from '@tabler/icons-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RenderMarkdown } from '@/containers/RenderMarkdown'
import { getVisitorConversations, extractVisitorInfo, isICPMatch } from '@/services/visitors'
import type { ParsedVisitorConversation } from '@/types/visitors'
import { route } from '@/constants/routes'
import { formatRelativeTime } from '@/utils/formatRelativeTime'

export const Route = createFileRoute('/visitors/')({
  component: VisitorsPage,
})

function VisitorsPage() {
  const { t } = useTranslation()
  const router = useRouter()
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
            <h1 className="text-2xl font-semibold">{t('common:visitors')}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Website visitors identified by your AI agent
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="gap-2"
          >
            <IconRefresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {t('common:refresh')}
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
          <div className="space-y-4 max-w-4xl mx-auto">
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

  return (
    <Card className={`${icpMatch ? 'border-green-500/50 bg-green-50/5' : ''}`}>
      <CardContent className="pt-6">
        {/* Markdown content */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <RenderMarkdown content={visitor.data.content} className="select-text" />
        </div>

        {/* Footer with timestamp and action */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            {formatRelativeTime(visitor.timestamp, { addSuffix: true })}
          </div>
          <Button size="sm" onClick={onEngage} className="gap-2">
            <IconMessageCircle className="h-4 w-4" />
            Chat
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
