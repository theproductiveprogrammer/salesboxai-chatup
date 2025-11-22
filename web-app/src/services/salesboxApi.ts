import { fetch as fetchTauri } from '@tauri-apps/plugin-http'
import { useSalesboxAuth } from '@/hooks/useSalesboxAuth'
import { useSalesboxEndpoint } from '@/hooks/useSalesboxEndpoint'
import { useSBAgentContext } from '@/hooks/useSBAgentContext'
import { isTokenExpired } from '@/lib/jwt'
import type { SBAgentContext } from '@/types/agent'

/**
 * Service for making authenticated API calls to SalesboxAI using JWT tokens
 * Automatically handles X-SBAgent-Context header for thread-specific agent context
 */

export interface SalesboxApiResponse<T = any> {
  data?: T
  error?: string
  status: number
  agentContext?: SBAgentContext | null
}

/**
 * Makes an authenticated request to SalesboxAI API using JWT token
 * Automatically includes X-SBAgent-Context header if threadId is provided and context exists
 * @param endpoint - The API endpoint (e.g., '/users', '/models')
 * @param options - Fetch options (method, body, etc.)
 * @param threadId - Optional thread ID for agent context
 * @returns Promise with the API response including updated agent context
 */
export async function callSalesboxApi<T = any>(
  endpoint: string,
  options: RequestInit = {},
  threadId?: string
): Promise<SalesboxApiResponse<T>> {
  // Get the JWT token and endpoint from the store
  const { token, isAuthenticated, logout } = useSalesboxAuth.getState()
  const { endpoint: baseEndpoint } = useSalesboxEndpoint.getState()

  // Check authentication
  if (!isAuthenticated || !token) {
    throw new Error('Not authenticated. Please sign in to continue.')
  }

  // Check if token is expired
  if (isTokenExpired(token)) {
    console.error('Token is expired')
    logout()
    throw new Error('Session expired. Please sign in again.')
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...(options.headers as Record<string, string>),
  }

  // Add agent context header if threadId is provided
  if (threadId) {
    const { getContext } = useSBAgentContext.getState()
    const agentContext = getContext(threadId)
    if (agentContext) {
      headers['X-SBAgent-Context'] = JSON.stringify(agentContext)
    }
  }

  try {
    const response = await fetchTauri(`${baseEndpoint}${endpoint}`, {
      method: 'GET',
      ...options,
      headers,
    })

    // Handle 401 Unauthorized - token might be invalid or expired
    if (response.status === 401) {
      console.error('Received 401 Unauthorized - logging out')
      logout()
      return {
        error: 'Authentication failed. Please sign in again.',
        status: 401,
      }
    }

    if (!response.ok) {
      return {
        error: `API call failed: ${response.status} ${response.statusText}`,
        status: response.status,
      }
    }

    const data = await response.json()

    // Parse and update agent context from response header if present
    let agentContext: SBAgentContext | null = null
    if (threadId) {
      const contextHeader = response.headers.get('X-SBAgent-Context')
      if (contextHeader) {
        try {
          agentContext = JSON.parse(contextHeader) as SBAgentContext
          // Update the context store for this thread
          const { setContext } = useSBAgentContext.getState()
          setContext(threadId, agentContext)
        } catch (error) {
          console.warn('Failed to parse X-SBAgent-Context header:', error)
        }
      }
    }

    return {
      data,
      status: response.status,
      agentContext,
    }
  } catch (error) {
    console.error('Error calling SalesboxAI API:', error)
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      status: 0,
    }
  }
}

/**
 * Example: Get user profile from SalesboxAI
 */
export async function getSalesboxUserProfile() {
  return callSalesboxApi('/user/profile')
}

/**
 * Example: Get available models from SalesboxAI
 */
export async function getSalesboxModels() {
  return callSalesboxApi('/models')
}

/**
 * Example: Send a message to SalesboxAI
 */
export async function sendSalesboxMessage(message: string, model?: string) {
  return callSalesboxApi('/chat/completions', {
    method: 'POST',
    body: JSON.stringify({
      message,
      model: model || 'default',
      stream: false,
    }),
  })
}
