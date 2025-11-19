import { useState, useEffect, useCallback } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  IconRefresh,
  IconSearch,
  IconLoader2,
  IconAlertCircle,
  IconCircle,
  IconX,
} from '@tabler/icons-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useSalesboxEndpoint } from '@/hooks/useSalesboxEndpoint'
import type { AsyncJob, AsyncJobStatus } from '@/types/asyncJobs'
import { AsyncJobStatus as JobStatus, AsyncJobType as JobType } from '@/types/asyncJobs'
import {
  getAsyncJobs,
  getJobStatus,
} from '@/services/asyncJobs'
import ProspectingJobWidget from '@/containers/asyncJobs/ProspectingJobWidget'

export const Route = createFileRoute('/prospecting')({
  component: ProspectingPage,
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

function ProspectingPage() {
  const { endpoint } = useSalesboxEndpoint()
  const [jobs, setJobs] = useState<AsyncJob[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<AsyncJobStatus | 'all'>('all')
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
      // Always filter for LEAD_PROSPECTING type
      const response = await getAsyncJobs(
        endpoint,
        currentPage,
        20,
        statusFilter === 'all' ? undefined : statusFilter,
        JobType.LEAD_PROSPECTING
      )

      if (reset) {
        setJobs(response.jobs)
      } else {
        setJobs(prev => [...prev, ...response.jobs])
      }

      setHasMore(response.jobs.length === 20)
      setPage(currentPage + 1)
    } catch (error) {
      console.error('Failed to load prospecting jobs:', error)
      toast.error('Failed to load prospecting jobs')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [endpoint, page, statusFilter])

  const refreshJobs = () => {
    loadJobs(true)
  }

  // Polling for running jobs
  const startPolling = useCallback((job: AsyncJob) => {
    if (!endpoint || pollingJobs.has(job.id)) return

    const pollJob = async () => {
      const ageMinutes = getJobAgeMinutes(job.createdAt)
      const interval = getPollingInterval(ageMinutes)

      if (!interval) {
        setPollingJobs(prev => {
          const next = new Set(prev)
          next.delete(job.id)
          return next
        })
        return
      }

      try {
        const updatedJob = await getJobStatus(endpoint, job.id)
        setJobs(prev => prev.map(j => j.id === job.id ? { ...j, ...updatedJob } : j))

        if (updatedJob.status === JobStatus.RUNNING) {
          setTimeout(pollJob, interval)
        } else {
          setPollingJobs(prev => {
            const next = new Set(prev)
            next.delete(job.id)
            return next
          })
        }
      } catch (error) {
        console.error('Failed to poll job status:', error)
        setPollingJobs(prev => {
          const next = new Set(prev)
          next.delete(job.id)
          return next
        })
      }
    }

    setPollingJobs(prev => new Set(prev).add(job.id))
    pollJob()
  }, [endpoint, pollingJobs])

  // Start polling for running jobs
  useEffect(() => {
    jobs
      .filter(job => job.status === JobStatus.RUNNING && !pollingJobs.has(job.id))
      .forEach(startPolling)
  }, [jobs, startPolling, pollingJobs])

  // Load jobs on mount and when filters change
  useEffect(() => {
    loadJobs(true)
  }, [statusFilter])

  const filteredJobs = jobs.filter(job => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const title = job.title?.toLowerCase() || ''
      const leadName = (job.input as any)?.leadContext?.name?.toLowerCase() || ''
      const leadCompany = (job.input as any)?.leadContext?.company?.toLowerCase() || ''
      if (!title.includes(searchLower) && !leadName.includes(searchLower) && !leadCompany.includes(searchLower)) {
        return false
      }
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

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-bold">Prospecting</h1>
          <p className="text-muted-foreground">
            Monitor your lead prospecting campaigns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={refreshJobs}
            disabled={refreshing}
          >
            <IconRefresh className={cn("h-4 w-4 mr-1", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="p-6 border-b">
        <div className="relative max-w-sm">
          <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by lead name or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Status Tabs */}
      <div className="px-6 pt-4">
        <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as AsyncJobStatus | 'all')}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all" className="flex items-center gap-2">
              All
              <Badge variant="secondary">{statusCounts.all}</Badge>
            </TabsTrigger>
            <TabsTrigger value={JobStatus.RUNNING} className="flex items-center gap-2">
              <IconLoader2 className="h-4 w-4" />
              Active
              <Badge variant="secondary">{statusCounts[JobStatus.RUNNING]}</Badge>
            </TabsTrigger>
            <TabsTrigger value={JobStatus.SUCCESS} className="flex items-center gap-2">
              <IconCircle className="h-4 w-4" />
              Completed
              <Badge variant="secondary">{statusCounts[JobStatus.SUCCESS]}</Badge>
            </TabsTrigger>
            <TabsTrigger value={JobStatus.FAILED} className="flex items-center gap-2">
              <IconX className="h-4 w-4" />
              Failed
              <Badge variant="secondary">{statusCounts[JobStatus.FAILED] + statusCounts[JobStatus.ERROR]}</Badge>
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
            <span className="ml-2">Loading prospecting campaigns...</span>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <IconAlertCircle className="h-8 w-8 mb-2" />
            <p>No prospecting campaigns found</p>
            {searchTerm && (
              <p className="text-sm">Try adjusting your search</p>
            )}
            {!searchTerm && statusFilter === 'all' && (
              <p className="text-sm mt-2">Start a new prospecting campaign from the chat</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map(job => (
              <ProspectingJobWidget
                key={job.id}
                job={job}
              />
            ))}
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
