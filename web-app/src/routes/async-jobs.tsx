import { useState, useEffect, useCallback } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  IconRefresh,
  IconSearch,
  IconPlus,
  IconLoader2,
  IconAlertCircle,
  IconCircle,
  IconClock,
  IconX,
} from '@tabler/icons-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useSalesboxEndpoint } from '@/hooks/useSalesboxEndpoint'
import type { AsyncJob, AsyncJobStatus, AsyncJobType } from '@/types/asyncJobs'
import { AsyncJobStatus as JobStatus, AsyncJobType as JobType } from '@/types/asyncJobs'
import {
  getAsyncJobs,
  cancelAsyncJob,
  deleteAsyncJob,
  getJobStatus,
} from '@/services/asyncJobs'
import { AsyncJobWidget, DataExportJobWidget } from '@/containers/asyncJobs'
import { DiscoverLeadsJobWidget } from '@/containers/asyncJobs/DiscoverLeadsJobWidget'

export const Route = createFileRoute('/async-jobs')({
  component: AsyncJobsPage,
})

const POLLING_INTERVAL = 5000 // 5 seconds

function AsyncJobsPage() {
  const { endpoint } = useSalesboxEndpoint()
  const [jobs, setJobs] = useState<AsyncJob[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<AsyncJobStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<AsyncJobType | 'all'>('all')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [pollingJobs, setPollingJobs] = useState<Set<string>>(new Set())


  const loadJobs = useCallback(async (reset = false) => {
    if (!endpoint) {
      console.error('No endpoint available')
      toast.error('Please configure your endpoint first')
      setLoading(false)
      setRefreshing(false)
      return
    }

    try {
      if (reset) {
        setLoading(true)
        setPage(1)
      } else {
        setRefreshing(true)
      }

      const currentPage = reset ? 1 : page
      const response = await getAsyncJobs(
        endpoint,
        currentPage,
        20,
        statusFilter === 'all' ? undefined : statusFilter,
        typeFilter === 'all' ? undefined : typeFilter
      )

      if (reset) {
        setJobs(response.jobs)
      } else {
        setJobs(prev => [...prev, ...response.jobs])
      }

      setHasMore(response.jobs.length === 20)
      setPage(currentPage + 1)
    } catch (error) {
      console.error('Failed to load jobs:', error)
      toast.error('Failed to load jobs')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [endpoint, page, statusFilter, typeFilter])

  const refreshJobs = useCallback(() => {
    loadJobs(true)
  }, [loadJobs])

  const handleJobAction = useCallback(async (action: string, job: AsyncJob) => {
    try {
      switch (action) {
        case 'cancel':
          await cancelAsyncJob(job.id)
          toast.success('Job cancelled successfully')
          break
        case 'delete':
          await deleteAsyncJob(job.id)
          toast.success('Job deleted successfully')
          break
        case 'download':
          if (job.result?.downloadUrl) {
            window.open(job.result.downloadUrl, '_blank')
          }
          break
        case 'retry':
          // This would need to be implemented based on your API
          toast.info('Retry functionality not yet implemented')
          break
      }
      refreshJobs()
    } catch (error) {
      console.error(`Failed to ${action} job:`, error)
      toast.error(`Failed to ${action} job`)
    }
  }, [refreshJobs])

  const startPolling = useCallback((jobId: string) => {
    setPollingJobs(prev => new Set(prev).add(jobId))
  }, [])

  const stopPolling = useCallback((jobId: string) => {
    setPollingJobs(prev => {
      const newSet = new Set(prev)
      newSet.delete(jobId)
      return newSet
    })
  }, [])

  // Poll for job status updates
  useEffect(() => {
    if (pollingJobs.size === 0) return

    const interval = setInterval(async () => {
      if (!endpoint) return

      for (const jobId of pollingJobs) {
        try {
          const updatedJob = await getJobStatus(jobId, endpoint)
          setJobs(prev => prev.map(job =>
            job.id === jobId
              ? updatedJob
              : job
          ))

          // Stop polling if job is completed, failed, or cancelled
          if ([JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED].includes(updatedJob.status)) {
            stopPolling(jobId)
          }
        } catch (error) {
          console.error(`Failed to poll job ${jobId}:`, error)
          stopPolling(jobId)
        }
      }
    }, POLLING_INTERVAL)

    return () => clearInterval(interval)
  }, [pollingJobs, stopPolling, endpoint])

  // Start polling for running jobs
  useEffect(() => {
    const runningJobs = jobs.filter(job => job.status === JobStatus.RUNNING)
    runningJobs.forEach(job => startPolling(job.id))
  }, [jobs, startPolling])

  // Load jobs on mount and when filters change
  useEffect(() => {
    loadJobs(true)
  }, [statusFilter, typeFilter])

  const filteredJobs = jobs.filter(job => {
    if (searchTerm && !job.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    return true
  })

  const getStatusCounts = () => {
    const counts = {
      all: jobs.length,
      [JobStatus.PENDING]: 0,
      [JobStatus.RUNNING]: 0,
      [JobStatus.COMPLETED]: 0,
      [JobStatus.FAILED]: 0,
      [JobStatus.CANCELLED]: 0,
    }

    jobs.forEach(job => {
      counts[job.status]++
    })

    return counts
  }

  const statusCounts = getStatusCounts()

  const renderJobWidget = (job: AsyncJob) => {
    switch (job.type) {
      case JobType.DATA_EXPORT:
        return (
          <DataExportJobWidget
            key={job.id}
            job={job}
            onAction={handleJobAction}
          />
        )
      case JobType.DISCOVER_LEADS:
        return (
          <DiscoverLeadsJobWidget
            key={job.id}
            job={job}
            onAction={handleJobAction}
          />
        )
      default:
        return (
          <AsyncJobWidget
            key={job.id}
            job={job}
            onAction={handleJobAction}
          />
        )
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-bold">Jobs</h1>
          <p className="text-muted-foreground">
            Monitor and manage your background jobs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={refreshJobs}
            disabled={refreshing}
          >
            <IconRefresh className={cn("h-4 w-4", refreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button size="sm">
            <IconPlus className="h-4 w-4" />
            New Job
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="p-6 border-b space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as AsyncJobStatus | 'all')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value={JobStatus.PENDING}>Pending</SelectItem>
              <SelectItem value={JobStatus.RUNNING}>Running</SelectItem>
              <SelectItem value={JobStatus.COMPLETED}>Completed</SelectItem>
              <SelectItem value={JobStatus.FAILED}>Failed</SelectItem>
              <SelectItem value={JobStatus.CANCELLED}>Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as AsyncJobType | 'all')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value={JobType.DATA_EXPORT}>Data Export</SelectItem>
              <SelectItem value={JobType.REPORT_GENERATION}>Report Generation</SelectItem>
              <SelectItem value={JobType.BULK_OPERATION}>Bulk Operation</SelectItem>
              <SelectItem value={JobType.DISCOVER_LEADS}>Lead Discovery</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="px-6 pt-4">
        <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as AsyncJobStatus | 'all')}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all" className="flex items-center gap-2">
              All
              <Badge variant="secondary">{statusCounts.all}</Badge>
            </TabsTrigger>
            <TabsTrigger value={JobStatus.PENDING} className="flex items-center gap-2">
              <IconClock className="h-4 w-4" />
              Pending
              <Badge variant="secondary">{statusCounts[JobStatus.PENDING]}</Badge>
            </TabsTrigger>
            <TabsTrigger value={JobStatus.RUNNING} className="flex items-center gap-2">
              <IconLoader2 className="h-4 w-4" />
              Running
              <Badge variant="secondary">{statusCounts[JobStatus.RUNNING]}</Badge>
            </TabsTrigger>
            <TabsTrigger value={JobStatus.COMPLETED} className="flex items-center gap-2">
              <IconCircle className="h-4 w-4" />
              Completed
              <Badge variant="secondary">{statusCounts[JobStatus.COMPLETED]}</Badge>
            </TabsTrigger>
            <TabsTrigger value={JobStatus.FAILED} className="flex items-center gap-2">
              <IconX className="h-4 w-4" />
              Failed
              <Badge variant="secondary">{statusCounts[JobStatus.FAILED]}</Badge>
            </TabsTrigger>
            <TabsTrigger value={JobStatus.CANCELLED} className="flex items-center gap-2">
              <IconAlertCircle className="h-4 w-4" />
              Cancelled
              <Badge variant="secondary">{statusCounts[JobStatus.CANCELLED]}</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Jobs List */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <IconLoader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading jobs...</span>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <IconAlertCircle className="h-8 w-8 mb-2" />
            <p>No jobs found</p>
            {searchTerm && (
              <p className="text-sm">Try adjusting your search or filters</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map(renderJobWidget)}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="default"
                  onClick={() => loadJobs(false)}
                  disabled={refreshing}
                >
                  {refreshing ? (
                    <>
                      <IconLoader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AsyncJobsPage
