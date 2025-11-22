import { useState } from 'react'
import { AsyncJob, AsyncJobStatus, ProspectingInput, ProspectingOutput, ProspectingTouch } from '@/types/asyncJobs'
import { Button } from '@/components/ui/button'
import {
  MapPin,
  Users,
  MessageSquare,
  Mail,
  Link as LinkIcon,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  FastForward
} from 'lucide-react'
import { useRouter } from '@tanstack/react-router'
import { route } from '@/constants/routes'
import { useSBAgentContext } from '@/hooks/useSBAgentContext'
import { useThreads } from '@/hooks/useThreads'
import { useAssistant } from '@/hooks/useAssistant'
import { useModelProvider } from '@/hooks/useModelProvider'
import { defaultModel } from '@/lib/models'
import { useSalesboxEndpoint } from '@/hooks/useSalesboxEndpoint'
import { useSalesboxAuth } from '@/hooks/useSalesboxAuth'
import { fetch as fetchTauri } from '@tauri-apps/plugin-http'
import { toast } from 'sonner'

interface ProspectingJobWidgetProps {
  job: AsyncJob
  onAction?: (action: string, job: AsyncJob) => void
}

export default function ProspectingJobWidget({ job }: ProspectingJobWidgetProps) {
  const router = useRouter()
  const { setContext } = useSBAgentContext()
  const { createThread } = useThreads()
  const { assistants } = useAssistant()
  const { selectedProvider } = useModelProvider()
  const { endpoint } = useSalesboxEndpoint()
  const [isSkipping, setIsSkipping] = useState(false)

  // Parse the job result to get prospecting data
  const input = job.input as any
  const result = (job.result as any)?.output as ProspectingOutput | undefined
  const agentContext = input as ProspectingInput | undefined

  // Check if job is in waiting state
  const isInWaitingState = () => {
    if (job.status !== AsyncJobStatus.RUNNING) return false
    if (job.message?.toLowerCase().includes('waiting')) return true
    return false
  }

  // Handler to skip wait by calling prospect-lead again
  const handleSkipWait = async () => {
    if (!endpoint || !agentContext) return

    const { token, isAuthenticated } = useSalesboxAuth.getState()
    if (!isAuthenticated || !token) {
      toast.error('Not authenticated. Please sign in.')
      return
    }

    setIsSkipping(true)
    try {
      const response = await fetchTauri(`${endpoint}/mcp/prospect-lead`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-SBAgent-Context': JSON.stringify(agentContext),
        },
        body: JSON.stringify({
          userMsg: 'Skip wait and continue prospecting'
        })
      })

      if (response.ok) {
        toast.success('Wait skipped - job will continue')
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.error || 'Failed to skip wait')
      }
    } catch (error) {
      console.error('Error skipping wait:', error)
      toast.error('Failed to skip wait')
    } finally {
      setIsSkipping(false)
    }
  }

  // Extract LinkedIn username from URL
  const extractLinkedInUsername = (url: string): string | null => {
    const match = url.match(/linkedin\.com\/in\/([^\/\?\s\(]+)/)
    if (match) {
      // Convert username to title case (e.g., "shahul-sk" -> "Shahul Sk")
      return match[1]
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
    }
    return null
  }

  // Get LinkedIn URL for the lead
  const getLinkedInUrl = (): string | null => {
    if (agentContext?.lead_linkedin) return agentContext.lead_linkedin
    // Check if job title contains a LinkedIn URL
    if (job.title && job.title.includes('linkedin.com/in/')) {
      const match = job.title.match(/(https?:\/\/[^\s\(]+linkedin\.com\/in\/[^\s\(]+)/)
      return match ? match[1] : null
    }
    return null
  }

  // Get lead display info
  const getLeadDisplayName = (): string => {
    if (agentContext?.lead_name) return agentContext.lead_name
    const parts: string[] = []
    if (result?.profile?.first_name) parts.push(result.profile.first_name)
    if (result?.profile?.last_name) parts.push(result.profile.last_name)
    if (parts.length > 0) return parts.join(' ')

    // Try to extract from job title
    if (job.title) {
      // If title contains LinkedIn URL, extract username
      const linkedInName = extractLinkedInUsername(job.title)
      if (linkedInName) return linkedInName

      // Check for "Prospecting: Name" format
      const titleMatch = job.title.match(/^Prospecting:\s*(.+)$/i)
      if (titleMatch) return titleMatch[1]

      return job.title
    }
    return 'Unknown Lead'
  }

  const linkedInUrl = getLinkedInUrl()

  // Format network distance for display
  const formatNetworkDistance = (distance?: string): string => {
    if (!distance) return ''
    switch (distance.toUpperCase()) {
      case 'FIRST_DEGREE': return '1st'
      case 'SECOND_DEGREE': return '2nd'
      case 'THIRD_DEGREE': return '3rd'
      case 'OUT_OF_NETWORK': return 'Out'
      default: return distance
    }
  }

  // Get touch type icon and color
  const getTouchTypeInfo = (touchType: string) => {
    switch (touchType.toUpperCase()) {
      case 'LINKEDIN_CONNECT':
        return { icon: LinkIcon, label: 'LinkedIn Invite', color: 'text-blue-600' }
      case 'LINKEDIN_MESSAGE':
        return { icon: MessageSquare, label: 'LinkedIn Message', color: 'text-blue-600' }
      case 'EMAIL':
        return { icon: Mail, label: 'Email', color: 'text-green-600' }
      default:
        return { icon: MessageSquare, label: touchType, color: 'text-gray-600' }
    }
  }

  // Format timestamp
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp)
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'SENT':
        return 'text-primary bg-accent/30'
      case 'FAILED':
        return 'text-destructive bg-destructive/10'
      default:
        return 'text-main-view-fg/60 bg-main-view-fg/5'
    }
  }

  // Handler to navigate to chat with lead context
  const handleChatWithLead = async () => {
    if (agentContext) {
      try {
        // Create a new thread first
        const selectedAssistant = assistants[0] // Use first assistant
        const newThread = await createThread(
          {
            id: defaultModel(selectedProvider),
            provider: selectedProvider,
          },
          '', // No initial prompt
          selectedAssistant
        )

        // Set agent context for this new thread
        setContext(newThread.id, {
          lead_name: getLeadDisplayName(),
          lead_linkedin: agentContext.lead_linkedin || null,
          lead_email: agentContext.lead_email || null,
          lead_id: agentContext.lead_id || null,
          lead_company: agentContext.lead_company || null,
          lead_title: agentContext.lead_title || null,
          account_id: agentContext.account_id || null,
          account_name: agentContext.account_name || null,
          opportunity_id: agentContext.opportunity_id || null,
        })

        const message = `Please continue prospecting: ${getLeadDisplayName()}`

        // Navigate to the new thread with pre-filled message
        await router.navigate({
          to: route.threadsDetail,
          params: { threadId: newThread.id },
          search: { message },
        })

        console.log('Successfully created thread and navigated with agent context:', newThread.id)
      } catch (error) {
        console.error('Error creating thread and navigating to chat:', error)
      }
    }
  }

  const touches = result?.touches || []

  return (
    <div className="border-l-[5px] border-primary/60 border border-border rounded-lg overflow-hidden bg-card shadow-sm hover:shadow-lg transition-all">
      {/* Header with lead info */}
      <div className="p-5 bg-primary/[0.02] border-b border-border/50">
        <div className="flex items-start gap-4">
          {/* Profile picture or initials */}
          {result?.profile?.profile_picture_url ? (
            <img
              src={result.profile.profile_picture_url}
              alt={getLeadDisplayName()}
              className="w-16 h-16 rounded-full object-cover border-2 border-primary/30"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center text-xl font-semibold text-primary">
              {getLeadDisplayName().charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-main-view-fg truncate">
                    {getLeadDisplayName()}
                  </h3>
                  {linkedInUrl && (
                    <a
                      href={linkedInUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80"
                      title="View LinkedIn Profile"
                    >
                      <LinkIcon size={16} />
                    </a>
                  )}
                </div>
                {(result?.profile?.headline || agentContext?.lead_title) && (
                  <p className="text-sm text-main-view-fg/70 mt-0.5 truncate">
                    {result?.profile?.headline || agentContext?.lead_title}
                  </p>
                )}
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-main-view-fg/60">
                  {(result?.profile?.location || agentContext?.lead_company) && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {result?.profile?.location || agentContext?.lead_company}
                    </span>
                  )}
                  {result?.networkDistance && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary font-medium rounded-full">
                      <Users size={12} />
                      {formatNetworkDistance(result.networkDistance)}
                    </span>
                  )}
                  {result?.profile?.connections_count && (
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {result.profile.connections_count} connections
                    </span>
                  )}
                </div>
              </div>

              {/* Status and actions */}
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  {job.status === AsyncJobStatus.RUNNING && (
                    <span className="flex items-center gap-1 text-xs px-2.5 py-1 bg-primary/10 text-primary font-medium rounded-full">
                      <Loader2 size={12} className="animate-spin" />
                      Running
                    </span>
                  )}
                  {job.status === AsyncJobStatus.SUCCESS && (
                    <span className="flex items-center gap-1 text-xs px-2.5 py-1 bg-accent/30 text-primary font-medium rounded-full">
                      <CheckCircle size={12} />
                      Complete
                    </span>
                  )}
                  {(job.status === AsyncJobStatus.FAILED || job.status === AsyncJobStatus.ERROR) && (
                    <span className="flex items-center gap-1 text-xs px-2.5 py-1 bg-destructive/10 text-destructive font-medium rounded-full">
                      <XCircle size={12} />
                      Failed
                    </span>
                  )}
                </div>
                {agentContext && (
                  <div className="flex items-center gap-2">
                    {isInWaitingState() && (
                      <Button
                        size="sm"
                        onClick={handleSkipWait}
                        disabled={isSkipping}
                        className="flex items-center gap-1 text-xs bg-accent/20 hover:bg-accent/30 text-primary"
                      >
                        {isSkipping ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <FastForward size={14} />
                        )}
                        {isSkipping ? 'Skipping...' : 'Skip Wait'}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={handleChatWithLead}
                      className="flex items-center gap-1 text-xs"
                      variant="default"
                    >
                      <MessageSquare size={14} />
                      Continue
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Job message - show as status indicator */}
        {job.message && (
          <div className="mt-3 flex items-center gap-2 text-sm text-main-view-fg/70">
            <Clock size={14} className="text-primary" />
            <span>{job.message}</span>
          </div>
        )}
      </div>

      {/* Touches timeline */}
      {touches.length > 0 && (
        <div className="p-5">
          <h4 className="text-sm font-semibold text-main-view-fg mb-3 flex items-center gap-2">
            <Clock size={14} className="text-primary" />
            Outreach Timeline ({touches.length} {touches.length === 1 ? 'touch' : 'touches'})
          </h4>
          <div className="space-y-3">
            {touches.map((touch: ProspectingTouch, index: number) => {
              const touchInfo = getTouchTypeInfo(touch.touchType)
              const TouchIcon = touchInfo.icon
              return (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-main-view-fg/[0.03] rounded-lg border border-border/30"
                >
                  <div className={`mt-0.5 ${touchInfo.color}`}>
                    <TouchIcon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-medium text-main-view-fg">
                        {touchInfo.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${getStatusColor(touch.status)}`}>
                          {touch.status}
                        </span>
                        <span className="text-xs text-main-view-fg/60">
                          {formatTimestamp(touch.timestamp)}
                        </span>
                      </div>
                    </div>
                    {touch.message && (
                      <p className="text-sm text-main-view-fg/70 line-clamp-2">
                        {touch.message}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state for no touches */}
      {touches.length === 0 && job.status === AsyncJobStatus.RUNNING && (
        <div className="p-5 text-center text-sm text-main-view-fg/60">
          <Loader2 size={20} className="animate-spin mx-auto mb-2 text-primary" />
          Analyzing lead and planning outreach...
        </div>
      )}

      {/* Error message */}
      {job.error && (
        <div className="p-4 bg-destructive/10 border-t border-destructive/20">
          <p className="text-sm text-destructive font-medium">{job.error}</p>
        </div>
      )}

      {/* Footer with timing info */}
      <div className="px-5 py-2.5 bg-main-view-fg/[0.02] border-t border-border/50 text-xs text-main-view-fg/60 flex justify-between">
        <span>Started: {new Date(job.createdAt).toLocaleString()}</span>
        {job.completedAt && (
          <span>Completed: {new Date(job.completedAt).toLocaleString()}</span>
        )}
      </div>
    </div>
  )
}
