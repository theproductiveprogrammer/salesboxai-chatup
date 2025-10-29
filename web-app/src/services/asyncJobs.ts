import { callSalesboxApi } from './salesboxApi'
import type {
  AsyncJob,
  AsyncJobInput,
  AsyncJobsResponse,
  CreateAsyncJobResponse,
} from '@/types/asyncJobs'
import { AsyncJobStatus, AsyncJobType } from '@/types/asyncJobs'

/**
 * Service for managing AsyncJobs via Salesbox.AI API
 */

// Transform backend job data to our frontend format
function transformBackendJob(backendJob: any): AsyncJob {
  // Validate required fields
  if (!backendJob || !backendJob.job_id) {
    throw new Error('Invalid job data: missing required fields')
  }

  let jobData = null
  if (backendJob.job_data && backendJob.job_data !== 'null') {
    try {
      jobData = JSON.parse(backendJob.job_data)
    } catch (e) {
      console.warn('Failed to parse job_data:', e)
    }
  }

  return {
    id: backendJob.job_id,
    type: (backendJob.job_type as AsyncJobType) || AsyncJobType.BULK_OPERATION,
    status: mapBackendStatus(backendJob.job_status),
    title: backendJob.job_description || 'Unknown Job',
    description: backendJob.job_message,
    message: backendJob.job_message,
    input: jobData?.input || {},
    result: jobData?.output ? { output: jobData.output } : undefined,
    error: backendJob.job_status === 'FAILED' ? backendJob.job_message : undefined,
    progress: undefined, // Backend doesn't provide progress
    createdAt: backendJob.created || new Date().toISOString(),
    updatedAt: backendJob.modified || new Date().toISOString(),
    completedAt: backendJob.job_status === 'SUCCESS' || backendJob.job_status === 'FAILED' ? backendJob.modified : undefined,
    userId: backendJob.owner_id?.toString() || 'unknown',
  }
}

function mapBackendStatus(backendStatus: string): AsyncJobStatus {
  switch (backendStatus) {
    case 'SUCCESS':
      return AsyncJobStatus.COMPLETED
    case 'FAILED':
      return AsyncJobStatus.FAILED
    case 'RUNNING':
      return AsyncJobStatus.RUNNING
    case 'PENDING':
      return AsyncJobStatus.PENDING
    default:
      return AsyncJobStatus.PENDING
  }
}

/**
 * Get all async jobs for the current user
 */
export async function getAsyncJobs(
  apiKey: string,
  endpoint: string,
  page: number = 1,
  limit: number = 20,
  status?: AsyncJobStatus,
  type?: AsyncJobType
): Promise<AsyncJobsResponse> {
  try {
    const response = await fetch(`${endpoint}/mcp/job-list`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({})
    })

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    // Transform backend response to frontend format
    let transformedJobs = data.map(transformBackendJob)
    
    // Sort by creation date (latest first)
    transformedJobs.sort((a: AsyncJob, b: AsyncJob) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    // Apply client-side filtering if needed
    if (status) {
      transformedJobs = transformedJobs.filter((job: AsyncJob) => job.status === status)
    }
    
    if (type) {
      transformedJobs = transformedJobs.filter((job: AsyncJob) => job.type === type)
    }
    
    // Apply pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedJobs = transformedJobs.slice(startIndex, endIndex)
    
    return {
      jobs: paginatedJobs,
      total: transformedJobs.length,
      page: page,
      limit: limit,
    }
  } catch (error) {
    console.error('Error calling AsyncJob API:', error)
    throw new Error(error instanceof Error ? error.message : 'Unknown error occurred')
  }
}

/**
 * Get a specific async job by ID
 */
export async function getAsyncJob(jobId: string): Promise<AsyncJob> {
  const response = await callSalesboxApi<AsyncJob>(`/async-jobs/${jobId}`)

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!
}

/**
 * Create a new async job
 */
export async function createAsyncJob(
  jobInput: AsyncJobInput
): Promise<AsyncJob> {
  const response = await callSalesboxApi<CreateAsyncJobResponse>(
    '/async-jobs',
    {
      method: 'POST',
      body: JSON.stringify(jobInput),
    }
  )

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!.job
}

/**
 * Cancel an async job
 */
export async function cancelAsyncJob(jobId: string): Promise<AsyncJob> {
  const response = await callSalesboxApi<AsyncJob>(
    `/async-jobs/${jobId}/cancel`,
    {
      method: 'POST',
    }
  )

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!
}

/**
 * Delete an async job
 */
export async function deleteAsyncJob(jobId: string): Promise<void> {
  const response = await callSalesboxApi(`/async-jobs/${jobId}`, {
    method: 'DELETE',
  })

  if (response.error) {
    throw new Error(response.error)
  }
}

/**
 * Get job status updates (for polling)
 */
export async function getJobStatus(jobId: string, endpoint: string, apiKey: string): Promise<AsyncJob> {
  try {
    const response = await fetch(`${endpoint}/mcp/job/${jobId}/status`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({})
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Job not found: ${jobId}`)
      }
      throw new Error(`API call failed: ${response.status} ${response.statusText}`)
    }

    const backendJob = await response.json()
    
    // Check if the response is null or empty
    if (!backendJob) {
      throw new Error(`Job not found: ${jobId}`)
    }
    
    return transformBackendJob(backendJob)
  } catch (error) {
    console.error('Error calling job status API:', error)
    throw new Error(error instanceof Error ? error.message : 'Unknown error occurred')
  }
}

/**
 * Download job result (if applicable)
 */
export async function downloadJobResult(
  jobId: string,
  resultKey: string
): Promise<Blob> {
  const response = await callSalesboxApi(
    `/async-jobs/${jobId}/download/${resultKey}`,
    {
      method: 'GET',
    }
  )

  if (response.error) {
    throw new Error(response.error)
  }

  // This would need to be handled differently for binary data
  // For now, we'll assume the API returns a download URL
  throw new Error('Download functionality not yet implemented')
}


