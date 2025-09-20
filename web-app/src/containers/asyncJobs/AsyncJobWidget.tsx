import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  IconClock,
  IconLoader2,
  IconCheck,
  IconX,
  IconBan,
} from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/utils/formatRelativeTime'
import type { AsyncJobWidgetProps, AsyncJobAction } from '@/types/asyncJobs'
import { AsyncJobStatus, AsyncJobType } from '@/types/asyncJobs'

const statusConfig = {
  [AsyncJobStatus.PENDING]: {
    icon: IconClock,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    label: 'Pending',
    animated: false,
  },
  [AsyncJobStatus.RUNNING]: {
    icon: IconLoader2,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    label: 'Running',
    animated: true,
  },
  [AsyncJobStatus.COMPLETED]: {
    icon: IconCheck,
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    label: 'Completed',
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
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
  },
  [AsyncJobType.REPORT_GENERATION]: {
    label: 'Report Generation',
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300',
  },
  [AsyncJobType.BULK_OPERATION]: {
    label: 'Bulk Operation',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
  },
  [AsyncJobType.DISCOVER_LEADS]: {
    label: 'Lead Discovery',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  },
}

export const AsyncJobWidget: React.FC<AsyncJobWidgetProps> = ({
  job,
  onAction,
}) => {
  const statusInfo = statusConfig[job.status]
  const typeInfo = typeConfig[job.type]
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
      case AsyncJobStatus.COMPLETED:
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
      case AsyncJobStatus.PENDING:
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
        'transition-all duration-200 hover:shadow-md',
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
              className={cn(
                'border-current',
                statusInfo.color
              )}
            >
              {statusInfo.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Progress bar for running jobs */}
        {job.status === AsyncJobStatus.RUNNING && job.progress !== undefined && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Progress</span>
              <span>{job.progress}%</span>
            </div>
            <Progress value={job.progress} className="h-2" />
          </div>
        )}

        {/* Job details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created:</span>
            <span>{formatRelativeTime(new Date(job.createdAt), { addSuffix: true })}</span>
          </div>
          {job.updatedAt !== job.createdAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Updated:</span>
              <span>{formatRelativeTime(new Date(job.updatedAt), { addSuffix: true })}</span>
            </div>
          )}
          {job.completedAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Completed:</span>
              <span>{formatRelativeTime(new Date(job.completedAt), { addSuffix: true })}</span>
            </div>
          )}
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
        {job.status === AsyncJobStatus.COMPLETED && job.result && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>Result:</strong> {JSON.stringify(job.result, null, 2)}
            </p>
          </div>
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
