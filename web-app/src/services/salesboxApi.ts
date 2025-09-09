import { fetch as fetchTauri } from '@tauri-apps/plugin-http'
import { useSalesboxApiKey } from '@/hooks/useSalesboxApiKey'

/**
 * Example service for making API calls to Salesbox.AI
 * This demonstrates how to use the Salesbox.AI API key for REST API calls
 */

export interface SalesboxApiResponse<T = any> {
  data?: T
  error?: string
  status: number
}

/**
 * Makes an authenticated request to Salesbox.AI API
 * @param endpoint - The API endpoint (e.g., '/users', '/models')
 * @param options - Fetch options (method, body, etc.)
 * @returns Promise with the API response
 */
export async function callSalesboxApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<SalesboxApiResponse<T>> {
  // Get the API key from the store
  const { apiKey } = useSalesboxApiKey.getState()
  
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('Salesbox.AI API key is required. Please set it in Settings → Security.')
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'Authorization': `Bearer ${apiKey}`,
    ...options.headers,
  }

  try {
    const response = await fetchTauri(`https://api.salesbox.ai${endpoint}`, {
      method: 'GET',
      ...options,
      headers,
    })

    if (!response.ok) {
      return {
        error: `API call failed: ${response.status} ${response.statusText}`,
        status: response.status,
      }
    }

    const data = await response.json()
    return {
      data,
      status: response.status,
    }
  } catch (error) {
    console.error('Error calling Salesbox.AI API:', error)
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      status: 0,
    }
  }
}

/**
 * Example: Get user profile from Salesbox.AI
 */
export async function getSalesboxUserProfile() {
  return callSalesboxApi('/user/profile')
}

/**
 * Example: Get available models from Salesbox.AI
 */
export async function getSalesboxModels() {
  return callSalesboxApi('/models')
}

/**
 * Example: Send a message to Salesbox.AI
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
