import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { invoke } from '@tauri-apps/api/core'
import { decodeJWT, extractUserFromJWT, isTokenExpired, isValidTokenStructure } from '../lib/jwt'

// Sync credentials to Tauri secure storage
const syncCredentialsToTauri = async (username: string, password: string) => {
  try {
    await invoke('sync_salesbox_credentials', { username, password })
  } catch (error) {
    console.error('Failed to sync credentials to Tauri store:', error)
  }
}

// Clear credentials from Tauri secure storage
const clearCredentialsFromTauri = async () => {
  try {
    await invoke('clear_salesbox_credentials')
  } catch (error) {
    console.error('Failed to clear credentials from Tauri store:', error)
  }
}

// Load credentials from Tauri secure storage
const loadCredentialsFromTauri = async (): Promise<{ username: string; password: string } | null> => {
  try {
    const result = await invoke<{ username: string; password: string } | null>('get_salesbox_credentials')
    return result
  } catch (error) {
    console.error('Failed to load credentials from Tauri store:', error)
    return null
  }
}

export const useSalesboxAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      credentials: null,

      // Actions
      login: async (username: string, password: string): Promise<boolean> => {
        set({ isLoading: true, error: null })

        try {
          // Import auth service (lazy to avoid circular dependency)
          const { loginWithCredentials } = await import('../services/auth')

          const result = await loginWithCredentials(username, password)

          if (result.success && result.token) {
            // Decode token to get user info
            const payload = decodeJWT(result.token)
            if (!payload) {
              set({
                isLoading: false,
                error: 'Failed to decode token',
                isAuthenticated: false
              })
              return false
            }

            const user = extractUserFromJWT(payload)

            // Store credentials for auto-refresh
            const credentials = { username, password }

            // Sync to Tauri secure storage
            await syncCredentialsToTauri(username, password)

            // Reinitialize MCP servers (download from new endpoint + start builtin)
            try {
              await invoke('reinitialize_mcp_servers')
              console.log('[Auth] MCP servers reinitialized after login')
            } catch (error) {
              console.warn('[Auth] Failed to reinitialize MCP servers:', error)
              // Non-fatal error - don't block login
            }

            set({
              token: result.token,
              user,
              credentials,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            })

            return true
          } else {
            set({
              isLoading: false,
              error: result.error || 'Login failed',
              isAuthenticated: false,
            })
            return false
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
          })
          return false
        }
      },

      logout: () => {
        // Clear credentials from Tauri
        clearCredentialsFromTauri()

        set({
          token: null,
          user: null,
          credentials: null,
          isAuthenticated: false,
          error: null,
        })
      },

      setToken: (token: string) => {
        // Validate token structure
        if (!isValidTokenStructure(token)) {
          console.error('Invalid token structure')
          return
        }

        // Check if expired
        if (isTokenExpired(token)) {
          console.error('Token is expired')
          get().logout()
          return
        }

        // Decode and extract user info
        const payload = decodeJWT(token)
        if (!payload) {
          console.error('Failed to decode token')
          return
        }

        const user = extractUserFromJWT(payload)

        set({
          token,
          user,
          isAuthenticated: true,
          error: null,
        })
      },

      clearError: () => {
        set({ error: null })
      },

      loadStoredCredentials: async () => {
        const credentials = await loadCredentialsFromTauri()
        if (credentials) {
          // Try to auto-login
          const { login } = get()
          await login(credentials.username, credentials.password)
        }
      },

      refreshToken: async (): Promise<boolean> => {
        const { credentials } = get()

        if (!credentials) {
          console.error('No credentials stored for token refresh')
          return false
        }

        // Re-login with stored credentials
        const { login } = get()
        return await login(credentials.username, credentials.password)
      },
    }),
    {
      name: 'salesbox-auth',
      storage: createJSONStorage(() => localStorage),
      // Don't persist credentials in localStorage for security
      // They're stored in Tauri's secure storage instead
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
