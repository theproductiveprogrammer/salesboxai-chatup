import { useState, useEffect, useCallback } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import {
  IconRefresh,
  IconSearch,
  IconPlus,
  IconLoader2,
  IconAlertCircle,
  IconCircle,
  IconX,
  IconTargetArrow,
  IconExternalLink,
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
import { route } from '@/constants/routes'

export const Route = createFileRoute('/async-jobs')({
  component: AsyncJobsPage,
})

// Age-based polling intervals (in milliseconds)
const getPollingInterval = (jobAgeMinutes: number): number | null => {
  if (jobAgeMinutes < 1) return 5000 // 0-1 min: 5 seconds
  if (jobAgeMinutes < 5) return 30000 // 1-5 min: 30 seconds
  if (jobAgeMinutes < 30) return 300000 // 5-30 min: 5 minutes
  if (jobAgeMinutes < 60) return 300000 // 30-60 min: 5 minutes
  return null // 60+ min: stop polling
}

// Calculate job age in minutes
const getJobAgeMinutes = (createdAt: string): number => {
  const now = new Date().getTime()
  const created = new Date(createdAt).getTime()
  return (now - created) / (1000 * 60)
}

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

  // Poll for job status updates with age-based intervals
  useEffect(() => {
    if (pollingJobs.size === 0) return

    const intervals: NodeJS.Timeout[] = []

    // Set up polling for each job based on its age
    for (const jobId of pollingJobs) {
      const job = jobs.find(j => j.id === jobId)
      if (!job) continue

      const jobAge = getJobAgeMinutes(job.createdAt)
      const pollingInterval = getPollingInterval(jobAge)

      // Stop polling if job is too old (> 60 minutes)
      if (pollingInterval === null) {
        stopPolling(jobId)
        continue
      }

      const interval = setInterval(async () => {
        if (!endpoint) return

        try {
          const updatedJob = await getJobStatus(jobId, endpoint)
          setJobs(prev => prev.map(j =>
            j.id === jobId ? updatedJob : j
          ))

          // Stop polling if job is completed, failed, error, or cancelled
          if ([JobStatus.SUCCESS, JobStatus.FAILED, JobStatus.ERROR, JobStatus.CANCELLED].includes(updatedJob.status)) {
            stopPolling(jobId)
          }
        } catch (error) {
          console.error(`Failed to poll job ${jobId}:`, error)
          stopPolling(jobId)
        }
      }, pollingInterval)

      intervals.push(interval)
    }

    return () => intervals.forEach(interval => clearInterval(interval))
  }, [pollingJobs, jobs, stopPolling, endpoint])

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
      [JobStatus.RUNNING]: 0,
      [JobStatus.SUCCESS]: 0,
      [JobStatus.ERROR]: 0,
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
      case JobType.LEAD_PROSPECTING:
        // Simplified view with link to Prospecting page
        const statusColor = job.status === JobStatus.RUNNING ? 'text-primary bg-primary/10' :
                           job.status === JobStatus.SUCCESS ? 'text-primary bg-accent/30' :
                           job.status === JobStatus.FAILED || job.status === JobStatus.ERROR ? 'text-destructive bg-destructive/10' :
                           'text-main-view-fg/60 bg-main-view-fg/5'
        const statusLabel = job.status === JobStatus.RUNNING ? 'Running' :
                           job.status === JobStatus.SUCCESS ? 'Complete' :
                           job.status === JobStatus.FAILED || job.status === JobStatus.ERROR ? 'Failed' :
                           job.status === JobStatus.CANCELLED ? 'Cancelled' : job.status
        return (
          <Card key={job.id} className="transition-all duration-200 hover:shadow-lg border-l-[5px] border-primary/60 border border-border">
            <CardContent className="p-5 bg-primary/[0.02]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-accent/20">
                    <IconTargetArrow className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-main-view-fg">
                      {job.title}
                    </h3>
                    <p className="text-sm text-main-view-fg/70">
                      {job.message || 'Lead prospecting in progress'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={cn('border-none font-medium', statusColor)}>
                    {statusLabel}
                  </Badge>
                  <Link to={route.prospecting}>
                    <Button variant="default" size="sm" className="gap-2">
                      <IconExternalLink className="h-4 w-4" />
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
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
    <div className="h-full flex flex-col bg-main-view">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-border/50 bg-gradient-to-b from-main-view to-transparent">
        <div>
          <h1 className="text-2xl font-bold text-main-view-fg">Jobs</h1>
          <p className="text-main-view-fg/70 text-sm">
            Monitor and manage your background jobs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={refreshJobs}
            disabled={refreshing}
            className="gap-2"
          >
            <IconRefresh className={cn("h-4 w-4", refreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button size="sm" className="gap-2">
            <IconPlus className="h-4 w-4" />
            New Job
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="px-6 py-4 border-b border-border/50 space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-main-view-fg/50" />
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
              <SelectItem value={JobStatus.RUNNING}>Running</SelectItem>
              <SelectItem value={JobStatus.SUCCESS}>Success</SelectItem>
              <SelectItem value={JobStatus.ERROR}>Error</SelectItem>
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
            <TabsTrigger value={JobStatus.RUNNING} className="flex items-center gap-2">
              <IconLoader2 className="h-4 w-4" />
              Running
              <Badge variant="secondary">{statusCounts[JobStatus.RUNNING]}</Badge>
            </TabsTrigger>
            <TabsTrigger value={JobStatus.SUCCESS} className="flex items-center gap-2">
              <IconCircle className="h-4 w-4" />
              Success
              <Badge variant="secondary">{statusCounts[JobStatus.SUCCESS]}</Badge>
            </TabsTrigger>
            <TabsTrigger value={JobStatus.ERROR} className="flex items-center gap-2">
              <IconAlertCircle className="h-4 w-4" />
              Error
              <Badge variant="secondary">{statusCounts[JobStatus.ERROR]}</Badge>
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
      <div className="flex-1 overflow-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-main-view-fg/70">Loading jobs...</span>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-main-view-fg/60">
            <IconAlertCircle className="h-8 w-8 mb-2" />
            <p className="font-medium">No jobs found</p>
            {searchTerm && (
              <p className="text-sm mt-1">Try adjusting your search or filters</p>
            )}
          </div>
        ) : (
          <div className="space-y-5 max-w-4xl mx-auto pb-6">
            {filteredJobs.map(renderJobWidget)}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="default"
                  onClick={() => loadJobs(false)}
                  disabled={refreshing}
                  className="gap-2"
                >
                  {refreshing ? (
                    <>
                      <IconLoader2 className="h-4 w-4 animate-spin" />
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
