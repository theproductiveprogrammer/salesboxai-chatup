import { AsyncJob, AsyncJobStatus, ProspectingOutput, ProspectingTouch } from '@/types/asyncJobs'
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
  Loader2
} from 'lucide-react'
import { useRouter } from '@tanstack/react-router'
import { route } from '@/constants/routes'
import { useLeadContext } from '@/hooks/useLeadContext'

interface ProspectingJobWidgetProps {
  job: AsyncJob
  onAction?: (action: string, job: AsyncJob) => void
}

export default function ProspectingJobWidget({ job }: ProspectingJobWidgetProps) {
  const router = useRouter()
  const { setLeadContext } = useLeadContext()

  // Parse the job result to get prospecting data
  const input = job.input as any
  const result = (job.result as any)?.output as ProspectingOutput | undefined
  const leadContext = input?.leadContext

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
    if (leadContext?.linkedin) return leadContext.linkedin
    // Check if job title contains a LinkedIn URL
    if (job.title && job.title.includes('linkedin.com/in/')) {
      const match = job.title.match(/(https?:\/\/[^\s\(]+linkedin\.com\/in\/[^\s\(]+)/)
      return match ? match[1] : null
    }
    return null
  }

  // Get lead display info
  const getLeadDisplayName = (): string => {
    if (leadContext?.name) return leadContext.name
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
        return 'text-green-600 bg-green-50 dark:bg-green-900/20'
      case 'FAILED':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20'
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  // Handler to navigate to chat with lead context
  const handleChatWithLead = async () => {
    if (leadContext) {
      setLeadContext({
        name: getLeadDisplayName(),
        linkedin: leadContext.linkedin,
        email: leadContext.email,
        id: leadContext.id,
        company: leadContext.company,
        title: leadContext.title,
      })

      await router.navigate({
        to: route.home,
        search: { message: `Please continue prospecting: ${getLeadDisplayName()}` },
      })
    }
  }

  const touches = result?.touches || []

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
      {/* Header with lead info */}
      <div className="p-4 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/40 dark:to-gray-900/40 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-4">
          {/* Profile picture or initials */}
          {result?.profile?.profile_picture_url ? (
            <img
              src={result.profile.profile_picture_url}
              alt={getLeadDisplayName()}
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-xl font-semibold text-blue-700 dark:text-blue-300">
              {getLeadDisplayName().charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {getLeadDisplayName()}
                  </h3>
                  {linkedInUrl && (
                    <a
                      href={linkedInUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      title="View LinkedIn Profile"
                    >
                      <LinkIcon size={16} />
                    </a>
                  )}
                </div>
                {(result?.profile?.headline || leadContext?.title) && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 truncate">
                    {result?.profile?.headline || leadContext?.title}
                  </p>
                )}
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {(result?.profile?.location || leadContext?.company) && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {result?.profile?.location || leadContext?.company}
                    </span>
                  )}
                  {result?.networkDistance && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full">
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
                    <span className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                      <Loader2 size={12} className="animate-spin" />
                      Running
                    </span>
                  )}
                  {job.status === AsyncJobStatus.SUCCESS && (
                    <span className="flex items-center gap-1 text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                      <CheckCircle size={12} />
                      Complete
                    </span>
                  )}
                  {(job.status === AsyncJobStatus.FAILED || job.status === AsyncJobStatus.ERROR) && (
                    <span className="flex items-center gap-1 text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">
                      <XCircle size={12} />
                      Failed
                    </span>
                  )}
                </div>
                {leadContext && (
                  <Button
                    size="sm"
                    onClick={handleChatWithLead}
                    className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <MessageSquare size={14} />
                    Continue
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Job message - show as status indicator */}
        {job.message && (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Clock size={14} />
            <span>{job.message}</span>
          </div>
        )}
      </div>

      {/* Touches timeline */}
      {touches.length > 0 && (
        <div className="p-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <Clock size={14} />
            Outreach Timeline ({touches.length} {touches.length === 1 ? 'touch' : 'touches'})
          </h4>
          <div className="space-y-3">
            {touches.map((touch: ProspectingTouch, index: number) => {
              const touchInfo = getTouchTypeInfo(touch.touchType)
              const TouchIcon = touchInfo.icon
              return (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                >
                  <div className={`mt-0.5 ${touchInfo.color}`}>
                    <TouchIcon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {touchInfo.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(touch.status)}`}>
                          {touch.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(touch.timestamp)}
                        </span>
                      </div>
                    </div>
                    {touch.message && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
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
        <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <Loader2 size={20} className="animate-spin mx-auto mb-2" />
          Analyzing lead and planning outreach...
        </div>
      )}

      {/* Error message */}
      {job.error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-300">{job.error}</p>
        </div>
      )}

      {/* Footer with timing info */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
        <span>Started: {new Date(job.createdAt).toLocaleString()}</span>
        {job.completedAt && (
          <span>Completed: {new Date(job.completedAt).toLocaleString()}</span>
        )}
      </div>
    </div>
  )
}
