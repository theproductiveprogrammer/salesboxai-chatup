import { callSalesboxApi } from './salesboxApi'
import type {
  AsyncJob,
  AsyncJobInput,
  AsyncJobResult,
  AsyncJobsResponse,
  CreateAsyncJobResponse,
  AsyncJobStatus,
  AsyncJobType,
} from '@/types/asyncJobs'

/**
 * Service for managing AsyncJobs via Salesbox.AI API
 */

/**
 * Get all async jobs for the current user
 */
export async function getAsyncJobs(
  page: number = 1,
  limit: number = 20,
  status?: AsyncJobStatus,
  type?: AsyncJobType
): Promise<AsyncJobsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })

  if (status) {
    params.append('status', status)
  }

  if (type) {
    params.append('type', type)
  }

  const response = await callSalesboxApi<AsyncJobsResponse>(
    `/async-jobs?${params.toString()}`
  )

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!
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
export async function getJobStatus(jobId: string): Promise<AsyncJobResult> {
  const response = await callSalesboxApi<AsyncJobResult>(
    `/async-jobs/${jobId}/status`
  )

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!
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
