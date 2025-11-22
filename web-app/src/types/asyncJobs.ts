/**
 * AsyncJob types and interfaces for managing background jobs
 */

import type { SBAgentContext } from './agent'

export enum AsyncJobStatus {
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum AsyncJobType {
  // Add specific job types as they are implemented
  DATA_EXPORT = 'data_export',
  REPORT_GENERATION = 'report_generation',
  BULK_OPERATION = 'bulk_operation',
  DISCOVER_LEADS = 'DISCOVER_LEADS',
  DISCOVER_EMAIL = 'DISCOVER_EMAIL',
  LINKEDIN_LEAD_INFO = 'LINKEDIN_LEAD_INFO',
  LEAD_PROSPECTING = 'LEAD_PROSPECTING',
}

export interface AsyncJob {
  id: string
  type: AsyncJobType
  status: AsyncJobStatus
  title: string
  description?: string
  message?: string
  input: Record<string, any>
  result?: Record<string, any>
  error?: string
  progress?: number // 0-100
  createdAt: string
  updatedAt: string
  completedAt?: string
  userId: string
}

export interface AsyncJobInput {
  type: AsyncJobType
  title: string
  description?: string
  input: Record<string, any>
}

export interface AsyncJobResult {
  id: string
  status: AsyncJobStatus
  result?: Record<string, any>
  error?: string
  progress?: number
  updatedAt: string
  completedAt?: string
}

export interface AsyncJobsResponse {
  jobs: AsyncJob[]
  total: number
  page: number
  limit: number
}

export interface CreateAsyncJobResponse {
  job: AsyncJob
}

export interface AsyncJobWidgetProps {
  job: AsyncJob
  onAction?: (action: string, job: AsyncJob) => void
}

export interface AsyncJobAction {
  id: string
  label: string
  icon?: string
  variant?: 'default' | 'destructive' | 'link'
  onClick: (job: AsyncJob) => void
}

// Discover Leads specific types
export interface DiscoverLeadsInput {
  companyLinkedinUrl?: string
  countries?: string[]
  functions?: string[]
  titles?: string[]
  levels?: string[]
  maxResults?: number
}

export interface DiscoverLeadsOutput {
  id: string | number
  name?: string // For backward compatibility
  firstname?: string
  lastname?: string
  type: string
  linkedin?: string // Backend uses 'linkedin' field
  linkedinUrl?: string // For backward compatibility
  email?: string
  company?: string
  title?: string
  location?: string
  country?: string
  industry?: string
  engScore?: number
  validEmail?: boolean
  leadStatus?: string
}

export interface DiscoverLeadsResult {
  input: DiscoverLeadsInput
  output: DiscoverLeadsOutput[]
}

// Lead Prospecting specific types
export interface ProspectingTouch {
  touchType: string // LINKEDIN_CONNECT, LINKEDIN_MESSAGE, EMAIL
  timestamp: number
  message: string
  status: string // SENT, FAILED
}

// ProspectingInput is now SBAgentContext (matches backend LeadProspectingJobDataDTO.input)
export type ProspectingInput = SBAgentContext

export interface ProspectingOutput {
  providerId?: string
  networkDistance?: string // FIRST_DEGREE, SECOND_DEGREE, THIRD_DEGREE, OUT_OF_NETWORK
  currentStatus?: string
  touches: ProspectingTouch[]
  llmReasoning?: string
  nextCheckTimestamp?: number
  profile?: {
    first_name?: string
    last_name?: string
    headline?: string
    location?: string
    profile_picture_url?: string
    connections_count?: number
    follower_count?: number
  }
}

export interface ProspectingResult {
  input: ProspectingInput
  output: ProspectingOutput
}
