import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  IconLoader2,
  IconCheck,
  IconX,
  IconBan,
} from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/utils/formatRelativeTime'
import type { AsyncJobWidgetProps, AsyncJobAction } from '@/types/asyncJobs'
import { AsyncJobStatus, AsyncJobType } from '@/types/asyncJobs'
import { LinkedInProfileDisplay } from './LinkedInProfileDisplay'

const statusConfig = {
  [AsyncJobStatus.RUNNING]: {
    icon: IconLoader2,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    label: 'Running',
    animated: true,
  },
  [AsyncJobStatus.SUCCESS]: {
    icon: IconCheck,
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    label: 'Success',
    animated: false,
  },
  [AsyncJobStatus.ERROR]: {
    icon: IconX,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    label: 'Error',
    animated: false,
  },
  [AsyncJobStatus.FAILED]: {
    icon: IconX,
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    label: 'Failed',
    animated: false,
  },
  [AsyncJobStatus.CANCELLED]: {
    icon: IconBan,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    borderColor: 'border-gray-200 dark:border-gray-800',
    label: 'Cancelled',
    animated: false,
  },
}

const typeConfig = {
  [AsyncJobType.DATA_EXPORT]: {
    label: 'Data Export',
    color:
      'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
  },
  [AsyncJobType.REPORT_GENERATION]: {
    label: 'Report Generation',
    color:
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300',
  },
  [AsyncJobType.BULK_OPERATION]: {
    label: 'Bulk Operation',
    color:
      'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
  },
  [AsyncJobType.DISCOVER_LEADS]: {
    label: 'Lead Discovery',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  },
  [AsyncJobType.DISCOVER_EMAIL]: {
    label: 'Email Discovery',
    color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-300',
  },
  [AsyncJobType.LINKEDIN_LEAD_INFO]: {
    label: 'LinkedIn Lead Info',
    color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-300',
  },
  [AsyncJobType.LEAD_PROSPECTING]: {
    label: 'Lead Prospecting',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
  },
}

export const AsyncJobWidget: React.FC<AsyncJobWidgetProps> = ({
  job,
  onAction,
}) => {
  const statusInfo = statusConfig[job.status]
  const typeInfo = typeConfig[job.type] || {
    label: job.type || 'Unknown',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
  }
  const StatusIcon = statusInfo.icon

  const getDefaultActions = (): AsyncJobAction[] => {
    const actions: AsyncJobAction[] = []

    switch (job.status) {
      case AsyncJobStatus.RUNNING:
        actions.push({
          id: 'cancel',
          label: 'Cancel',
          icon: 'IconBan',
          variant: 'default',
          onClick: () => onAction?.('cancel', job),
        })
        break
      case AsyncJobStatus.SUCCESS:
        if (job.result?.downloadUrl) {
          actions.push({
            id: 'download',
            label: 'Download',
            icon: 'IconDownload',
            variant: 'default',
            onClick: () => onAction?.('download', job),
          })
        }
        actions.push({
          id: 'delete',
          label: 'Delete',
          icon: 'IconTrash',
          variant: 'destructive',
          onClick: () => onAction?.('delete', job),
        })
        break
      case AsyncJobStatus.ERROR:
      case AsyncJobStatus.FAILED:
        actions.push(
          {
            id: 'retry',
            label: 'Retry',
            icon: 'IconRefresh',
            variant: 'default',
            onClick: () => onAction?.('retry', job),
          },
          {
            id: 'delete',
            label: 'Delete',
            icon: 'IconTrash',
            variant: 'destructive',
            onClick: () => onAction?.('delete', job),
          }
        )
        break
      case AsyncJobStatus.CANCELLED:
        actions.push({
          id: 'delete',
          label: 'Delete',
          icon: 'IconTrash',
          variant: 'destructive',
          onClick: () => onAction?.('delete', job),
        })
        break
    }

    return actions
  }

  const actions = getDefaultActions()

  return (
    <Card
      className={cn(
        'transition-all duration-200 hover:shadow-md select-text',
        statusInfo.bgColor,
        statusInfo.borderColor,
        'border'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'p-2 rounded-full',
                statusInfo.bgColor,
                statusInfo.borderColor,
                'border'
              )}
            >
              <StatusIcon
                className={cn(
                  'h-5 w-5',
                  statusInfo.color,
                  statusInfo.animated && 'animate-spin'
                )}
              />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">
                {job.title}
              </CardTitle>
              {job.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {job.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
            <Badge
              variant="outline"
              className={cn('border-current', statusInfo.color)}
            >
              {statusInfo.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Running job animation */}
        {job.status === AsyncJobStatus.RUNNING && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-blue-500 rounded-full animate-ping opacity-75"></div>
                </div>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Processing...
                </span>
              </div>
              {job.progress !== undefined && (
                <div className="flex-1 ml-4">
                  <div className="flex justify-between text-xs text-blue-600 dark:text-blue-400 mb-1">
                    <span>Progress</span>
                    <span>{job.progress}%</span>
                  </div>
                  <Progress value={job.progress} className="h-1.5" />
                </div>
              )}
            </div>
            <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
              This job is currently running in the background. You can continue
              using the app while it processes.
            </div>
          </div>
        )}

        {/* Progress bar for other job statuses */}
        {job.status !== AsyncJobStatus.RUNNING &&
          job.progress !== undefined && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Progress</span>
                <span>{job.progress}%</span>
              </div>
              <Progress value={job.progress} className="h-2" />
            </div>
          )}

        {/* Job details */}
        <div className="text-sm text-muted-foreground">
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
                <b>Created</b> {createdTime}
                {completedTime && (
                  <span className="text-muted-foreground/70">
                    , time taken: {duration}
                  </span>
                )}
              </div>
            )
          })()}
        </div>

        {/* Error message for failed jobs */}
        {job.status === AsyncJobStatus.FAILED && job.error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-800 dark:text-red-200">
              <strong>Error:</strong> {job.error}
            </p>
          </div>
        )}

        {/* Result summary for completed jobs */}
        {job.status === AsyncJobStatus.SUCCESS && job.result && (
          job.type === AsyncJobType.LINKEDIN_LEAD_INFO ? (
            <LinkedInProfileDisplay result={job.result} input={job.input} />
          ) : (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>Result:</strong> {JSON.stringify(job.result, null, 2)}
              </p>
            </div>
          )
        )}

        {/* Action buttons */}
        {actions.length > 0 && (
          <div className="flex gap-2 mt-4">
            {actions.map((action) => (
              <Button
                key={action.id}
                variant={action.variant || 'default'}
                size="sm"
                onClick={() => action.onClick(job)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default AsyncJobWidget
