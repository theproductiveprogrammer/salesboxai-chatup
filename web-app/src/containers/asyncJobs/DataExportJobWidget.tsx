import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  IconFileDownload,
  IconDatabase,
  IconCalendar,
  IconUsers,
  IconFileText,
} from '@tabler/icons-react'
import { formatRelativeTime } from '@/utils/formatRelativeTime'
import type { AsyncJobWidgetProps } from '@/types/asyncJobs'
import { AsyncJobStatus } from '@/types/asyncJobs'

interface DataExportInput {
  dataType: 'contacts' | 'leads' | 'deals' | 'activities' | 'all'
  dateRange?: {
    start: string
    end: string
  }
  format: 'csv' | 'xlsx' | 'json'
  includeDeleted?: boolean
  filters?: Record<string, any>
}

interface DataExportResult {
  downloadUrl: string
  fileSize: number
  recordCount: number
  fileName: string
  expiresAt: string
}

export const DataExportJobWidget: React.FC<AsyncJobWidgetProps> = ({
  job,
  onAction,
}) => {
  const input = job.input as DataExportInput
  const result = job.result as DataExportResult | undefined

  const getDataTypeIcon = (dataType: string) => {
    switch (dataType) {
      case 'contacts':
        return IconUsers
      case 'leads':
        return IconUsers
      case 'deals':
        return IconFileText
      case 'activities':
        return IconCalendar
      default:
        return IconDatabase
    }
  }

  const getDataTypeLabel = (dataType: string) => {
    switch (dataType) {
      case 'contacts':
        return 'Contacts'
      case 'leads':
        return 'Leads'
      case 'deals':
        return 'Deals'
      case 'activities':
        return 'Activities'
      case 'all':
        return 'All Data'
      default:
        return dataType
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const DataTypeIcon = getDataTypeIcon(input.dataType)

  return (
    <Card className="transition-all duration-200 hover:shadow-md border-l-4 border-l-purple-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/20">
              <DataTypeIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">
                {job.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Exporting {getDataTypeLabel(input.dataType)} data
              </p>
            </div>
          </div>
          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
            Data Export
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Export details */}
        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Format:</span>
              <span className="ml-2 font-medium uppercase">{input.format}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Data Type:</span>
              <span className="ml-2 font-medium">{getDataTypeLabel(input.dataType)}</span>
            </div>
            {input.dateRange && (
              <>
                <div>
                  <span className="text-muted-foreground">Start Date:</span>
                  <span className="ml-2 font-medium">
                    {new Date(input.dateRange.start).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">End Date:</span>
                  <span className="ml-2 font-medium">
                    {new Date(input.dateRange.end).toLocaleDateString()}
                  </span>
                </div>
              </>
            )}
          </div>

          {input.includeDeleted && (
            <div className="text-sm">
              <Badge variant="outline" className="text-orange-600 border-orange-200">
                Including deleted records
              </Badge>
            </div>
          )}
        </div>

        {/* Running job animation */}
        {job.status === AsyncJobStatus.RUNNING && (
          <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-purple-500 rounded-full animate-ping opacity-75"></div>
                </div>
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Exporting data...
                </span>
              </div>
              {job.progress !== undefined && (
                <div className="flex-1 ml-4">
                  <div className="flex justify-between text-xs text-purple-600 dark:text-purple-400 mb-1">
                    <span>Progress</span>
                    <span>{job.progress}%</span>
                  </div>
                  <Progress value={job.progress} className="h-1.5" />
                </div>
              )}
            </div>
            <div className="mt-2 text-xs text-purple-600 dark:text-purple-400">
              Preparing your {getDataTypeLabel(input.dataType)} export. This may take a few minutes.
            </div>
          </div>
        )}

        {/* Result for completed jobs */}
        {job.status === AsyncJobStatus.COMPLETED && result && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <IconFileDownload className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold text-green-800 dark:text-green-200">
                Export Complete
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Records:</span>
                <span className="ml-2 font-medium">{result.recordCount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">File Size:</span>
                <span className="ml-2 font-medium">{formatFileSize(result.fileSize)}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">File:</span>
                <span className="ml-2 font-medium">{result.fileName}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Expires:</span>
                <span className="ml-2 font-medium">
                  {formatRelativeTime(new Date(result.expiresAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error for failed jobs */}
        {job.status === AsyncJobStatus.FAILED && job.error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
              Export Failed
            </h4>
            <p className="text-sm text-red-700 dark:text-red-300">{job.error}</p>
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
          {job.status === AsyncJobStatus.COMPLETED && result?.downloadUrl && (
            <Button
              onClick={() => onAction?.('download', job)}
              className="flex items-center gap-2"
            >
              <IconFileDownload className="h-4 w-4" />
              Download
            </Button>
          )}
          {job.status === AsyncJobStatus.RUNNING && (
            <Button
              variant="default"
              onClick={() => onAction?.('cancel', job)}
            >
              Cancel Export
            </Button>
          )}
          {job.status === AsyncJobStatus.FAILED && (
            <Button
              variant="default"
              onClick={() => onAction?.('retry', job)}
            >
              Retry Export
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onAction?.('delete', job)}
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default DataExportJobWidget
