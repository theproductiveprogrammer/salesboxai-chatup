import { fetch as fetchTauri } from '@tauri-apps/plugin-http'
import { useSalesboxEndpoint } from '@/hooks/useSalesboxEndpoint'
import { isTokenExpiringSoon } from '@/lib/jwt'
import type { TokenResponse } from '@/types/auth'

/**
 * Authentication service for SalesBox.AI
 * Handles login, token refresh, and auto-refresh scheduling
 */

export interface LoginResult {
  success: boolean
  token?: string
  error?: string
}

/**
 * Login with username and password to get JWT token
 */
export async function loginWithCredentials(
  username: string,
  password: string
): Promise<LoginResult> {
  const { endpoint: baseEndpoint } = useSalesboxEndpoint.getState()

  if (!username || !password) {
    return {
      success: false,
      error: 'Username and password are required',
    }
  }

  try {
    console.log('[Auth] Attempting login to:', `${baseEndpoint}/user-token/login`)

    const response = await fetchTauri(`${baseEndpoint}/user-token/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    })

    console.log('[Auth] Response status:', response.status, response.statusText)

    if (!response.ok) {
      // Try to get error message from response body
      try {
        const errorData = await response.json()
        const errorMsg = errorData.error || errorData.message || `${response.status} ${response.statusText}`
        return {
          success: false,
          error: errorMsg,
        }
      } catch {
        return {
          success: false,
          error: `Login failed: ${response.status} ${response.statusText}`,
        }
      }
    }

    const data: TokenResponse = await response.json()
    console.log('[Auth] Response data:', { hasToken: !!data.access_token, hasError: !!data.error })

    if (data.error) {
      return {
        success: false,
        error: data.error,
      }
    }

    if (!data.access_token) {
      return {
        success: false,
        error: 'No access token received',
      }
    }

    console.log('[Auth] Login successful')
    return {
      success: true,
      token: data.access_token,
    }
  } catch (error) {
    console.error('[Auth] Login error:', error)
    console.error('[Auth] Error details:', JSON.stringify(error, null, 2))
    return {
      success: false,
      error: error instanceof Error ? error.message : `Unknown login error: ${String(error)}`,
    }
  }
}

/**
 * Auto-refresh token scheduler
 * Checks every 30 minutes and refreshes if token expires within 1 hour
 */
let refreshInterval: ReturnType<typeof setInterval> | null = null

export function startAutoRefresh() {
  // Clear any existing interval
  stopAutoRefresh()

  // Check immediately
  checkAndRefreshToken()

  // Then check every 30 minutes
  refreshInterval = setInterval(
    () => {
      checkAndRefreshToken()
    },
    30 * 60 * 1000
  ) // 30 minutes
}

export function stopAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

async function checkAndRefreshToken() {
  // Dynamically import to avoid circular dependency
  const { useSalesboxAuth } = await import('@/hooks/useSalesboxAuth')
  const { token, refreshToken, isAuthenticated } = useSalesboxAuth.getState()

  if (!isAuthenticated || !token) {
    return
  }

  // Check if token expires within 60 minutes
  if (isTokenExpiringSoon(token, 60)) {
    console.log('Token expiring soon, refreshing...')
    const success = await refreshToken()

    if (success) {
      console.log('Token refreshed successfully')
    } else {
      console.error('Failed to refresh token')
    }
  }
}

/**
 * Manually trigger token refresh
 */
export async function manualRefreshToken(): Promise<boolean> {
  const { useSalesboxAuth } = await import('@/hooks/useSalesboxAuth')
  const { refreshToken } = useSalesboxAuth.getState()
  return await refreshToken()
}
