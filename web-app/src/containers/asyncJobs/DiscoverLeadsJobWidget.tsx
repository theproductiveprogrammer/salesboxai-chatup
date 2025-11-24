import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  IconUsers,
  IconBuilding,
  IconMapPin,
  IconBriefcase,
  IconUser,
  IconDownload,
  IconRefresh,
  IconTrash,
  IconExternalLink,
} from '@tabler/icons-react'
import { formatRelativeTime } from '@/utils/formatRelativeTime'
import type {
  AsyncJobWidgetProps,
  DiscoverLeadsResult,
  DiscoverLeadsInput,
} from '@/types/asyncJobs'
import { AsyncJobStatus } from '@/types/asyncJobs'
import { openUrl } from '@tauri-apps/plugin-opener'
import { invoke } from '@tauri-apps/api/core'
import { useRouter } from '@tanstack/react-router'
import { route } from '@/constants/routes'
import { useSBAgentContext } from '@/hooks/useSBAgentContext'

export const DiscoverLeadsJobWidget: React.FC<AsyncJobWidgetProps> = ({
  job,
  onAction,
}) => {
  const router = useRouter()
  const { setPendingContext } = useSBAgentContext()

  console.log('DiscoverLeadsJobWidget - job:', job)
  console.log('DiscoverLeadsJobWidget - job.status:', job.status)
  console.log('DiscoverLeadsJobWidget - job.result:', job.result)

  const result = job.result as DiscoverLeadsResult | undefined
  const input = result?.input || (job.input as DiscoverLeadsInput)

  console.log('DiscoverLeadsJobWidget - result:', result)
  console.log('DiscoverLeadsJobWidget - input:', input)

  const getCompanyName = (linkedinUrl: string | undefined) => {
    if (!linkedinUrl) return 'Unknown Company'
    const match = linkedinUrl.match(/linkedin\.com\/company\/([^\/]+)/)
    return match ? match[1] : 'Unknown Company'
  }

  // Helper function to get display name from lead data
  const getLeadDisplayName = (lead: any): string => {
    if (lead.name) {
      return lead.name
    }
    if (lead.firstname && lead.lastname) {
      return `${lead.firstname} ${lead.lastname}`
    }
    if (lead.firstname) {
      return lead.firstname
    }
    return `Lead #${lead.id}`
  }

  // Helper function to get LinkedIn URL
  const getLeadLinkedInUrl = (lead: any): string | undefined => {
    return lead.linkedin || lead.linkedinUrl
  }

  // Helper function to get initials for avatar
  const getLeadInitials = (lead: any): string => {
    const name = getLeadDisplayName(lead)
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  // Handler to create a chat with lead info
  const handleChatWithLead = async (lead: any, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const linkedinUrl = getLeadLinkedInUrl(lead)
    if (!linkedinUrl) {
      console.log('No LinkedIn URL available for lead:', lead.id)
      return
    }

    try {
      // Set pending context that will be attached when user sends message
      setPendingContext({
        lead_name: getLeadDisplayName(lead),
        lead_linkedin: linkedinUrl,
        lead_email: lead.email,
        lead_id: lead.id,
        lead_company: lead.company,
        lead_title: lead.title,
        account_id: null,
        account_name: null,
        opportunity_id: null,
      })

      // Pre-fill message for the user to edit/submit
      const message = `Please get detailed information about this lead: ${linkedinUrl}`

      // Navigate to home with pre-filled message
      await router.navigate({
        to: route.home,
        search: { message },
      })

      console.log('Successfully set pending context and navigated to home with message')
    } catch (error) {
      console.error('Error navigating to chat:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-accent/30 text-primary'
      case 'failed':
        return 'bg-destructive/10 text-destructive'
      case 'running':
        return 'bg-primary/10 text-primary'
      case 'pending':
        return 'bg-accent/20 text-primary'
      default:
        return 'bg-main-view-fg/5 text-main-view-fg/60'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✅'
      case 'failed':
        return '❌'
      case 'running':
        return '🔄'
      case 'pending':
        return '⏳'
      default:
        return '❓'
    }
  }

  return (
    <Card className="transition-all duration-200 hover:shadow-md border-l-[5px] border-primary/60 border border-border select-text">
      <CardHeader className="pb-3 bg-primary/[0.02]">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-accent/20">
              <IconUsers className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">
                {job.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Lead Discovery for {getCompanyName(input?.companyLinkedinUrl)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary">
              Lead Discovery
            </Badge>
            <Badge className={getStatusColor(job.status)}>
              {getStatusIcon(job.status)} {job.status}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Search Criteria */}
        {input ? (
          <div className="space-y-3 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <IconBuilding className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Company:</span>
                {input.companyLinkedinUrl ? (
                  <a
                    href={input.companyLinkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    {getCompanyName(input.companyLinkedinUrl)}
                    <IconExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="font-medium">Unknown Company</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <IconMapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Countries:</span>
                <span className="font-medium">
                  {input.countries?.join(', ') || 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <IconBriefcase className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Functions:</span>
                <span className="font-medium">
                  {input.functions?.join(', ') || 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <IconUser className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Titles:</span>
                <span className="font-medium">
                  {input.titles?.join(', ') || 'N/A'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                Levels: {input.levels?.join(', ') || 'N/A'}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Max Results: {input.maxResults || 'N/A'}
              </Badge>
            </div>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> Input data not available for this job.
            </p>
          </div>
        )}

        {/* Running job animation */}
        {job.status === AsyncJobStatus.RUNNING && (
          <div className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-primary rounded-full animate-ping opacity-75"></div>
                </div>
                <span className="text-sm font-medium text-primary">
                  Discovering leads...
                </span>
              </div>
              {job.progress !== undefined && (
                <div className="flex-1 ml-4">
                  <div className="flex justify-between text-xs text-primary mb-1">
                    <span>Progress</span>
                    <span>{job.progress}%</span>
                  </div>
                  <Progress value={job.progress} className="h-1.5" />
                </div>
              )}
            </div>
            <div className="mt-2 text-xs text-primary/80">
              Searching for leads based on your criteria. This may take a few
              minutes.
            </div>
          </div>
        )}

        {/* Results for successful jobs */}
        {job.status === AsyncJobStatus.SUCCESS && result?.output && (
          <div className="mb-4 p-4 bg-accent/20 border border-accent/40 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <IconUsers className="h-5 w-5 text-primary" />
              <h4 className="font-semibold text-primary">
                Discovery Complete - {result.output.length} leads found
              </h4>
            </div>
            <div className="space-y-2">
              {result.output.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded border hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={async (e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      console.log('Lead clicked:', lead)
                      const linkedinUrl = getLeadLinkedInUrl(lead)
                      console.log('LinkedIn URL:', linkedinUrl)
                      if (linkedinUrl) {
                        console.log('Opening LinkedIn URL:', linkedinUrl)
                        try {
                          // Method 1: Try Tauri shell command via core API (most reliable for system browser)
                          await invoke('plugin:shell|open', {
                            path: linkedinUrl,
                          })
                          console.log(
                            'Successfully opened LinkedIn URL with shell command'
                          )
                        } catch (shellError) {
                          console.log(
                            'Shell command failed, trying opener plugin:',
                            shellError
                          )
                          try {
                            // Method 2: Try Tauri opener plugin
                            await openUrl(linkedinUrl)
                            console.log(
                              'Successfully opened LinkedIn URL with opener plugin'
                            )
                          } catch (openerError) {
                            console.log(
                              'Opener plugin failed, trying window.open:',
                              openerError
                            )
                            try {
                              // Method 3: Fallback to window.open
                              window.open(
                                linkedinUrl,
                                '_blank',
                                'noopener,noreferrer'
                              )
                              console.log('Opened with window.open fallback')
                            } catch (fallbackError) {
                              console.error(
                                'All methods failed:',
                                fallbackError
                              )
                            }
                          }
                        }
                      } else {
                        console.log(
                          'No LinkedIn URL available for lead:',
                          lead.id
                        )
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-accent/30 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">
                          {getLeadInitials(lead)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {getLeadDisplayName(lead)}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Lead #{lead.id}</span>
                          {getLeadLinkedInUrl(lead) && (
                            <div className="flex items-center gap-1 text-primary hover:text-primary/80">
                              <IconExternalLink className="h-3 w-3" />
                              <span>LinkedIn</span>
                            </div>
                          )}
                        </div>
                        {lead.title && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {lead.title}
                          </p>
                        )}
                        {lead.company && (
                          <p className="text-xs text-muted-foreground">
                            {lead.company}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getLeadLinkedInUrl(lead) && (
                        <Button
                          size="sm"
                          className="text-xs hover:bg-accent/20 border border-primary/20 text-primary hover:border-primary/30 cursor-pointer bg-transparent shadow-none"
                          onClick={(e) => handleChatWithLead(lead, e)}
                          title="Chat with lead info"
                        >
                          Chat
                        </Button>
                      )}
                    </div>
                  </div>
              ))}
            </div>
          </div>
        )}

        {/* Error for failed jobs */}
        {(job.status === AsyncJobStatus.FAILED || job.status === AsyncJobStatus.ERROR) && job.error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
              Discovery Failed
            </h4>
            <p className="text-sm text-red-700 dark:text-red-300">
              {job.error}
            </p>
          </div>
        )}

        {/* Job Message */}
        {job.message && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-md">
            <p className="text-sm text-gray-800 dark:text-gray-200">
              <strong>Message:</strong> {job.message}
            </p>
          </div>
        )}

        {/* Timestamps */}
        <div className="text-sm text-muted-foreground border-t pt-3">
          {(() => {
            const createdTime = formatRelativeTime(new Date(job.createdAt), {
              addSuffix: true,
            })
            const completedTime = job.completedAt
              ? formatRelativeTime(new Date(job.completedAt), {
                  addSuffix: true,
                })
              : null

            // Calculate duration if completed
            const duration = job.completedAt
              ? (() => {
                  const ms =
                    new Date(job.completedAt).getTime() -
                    new Date(job.createdAt).getTime()
                  const seconds = Math.floor(ms / 1000)
                  const minutes = Math.floor(seconds / 60)
                  const hours = Math.floor(minutes / 60)
                  const days = Math.floor(hours / 24)

                  if (days > 0) return `${days}d ${hours % 24}h`
                  if (hours > 0) return `${hours}h ${minutes % 60}m`
                  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
                  return `${seconds}s`
                })()
              : null

            return (
              <div className="text-right text-sm gray-50">
                <b>Done</b> {createdTime}
                {completedTime && (
                  <span className="text-muted-foreground/70">
                    , time taken: {duration}
                  </span>
                )}
              </div>
            )
          })()}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          {job.status === AsyncJobStatus.SUCCESS &&
            result?.output &&
            result.output.length > 0 && (
              <Button
                onClick={() => onAction?.('download', job)}
                className="flex items-center gap-2"
              >
                <IconDownload className="h-4 w-4" />
                Export Leads
              </Button>
            )}
          {job.status === AsyncJobStatus.RUNNING && (
            <Button variant="default" onClick={() => onAction?.('cancel', job)}>
              Cancel Discovery
            </Button>
          )}
          {(job.status === AsyncJobStatus.FAILED || job.status === AsyncJobStatus.ERROR) && (
            <Button variant="default" onClick={() => onAction?.('retry', job)}>
              <IconRefresh className="h-4 w-4 mr-2" />
              Retry Discovery
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onAction?.('delete', job)}
          >
            <IconTrash className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default DiscoverLeadsJobWidget
