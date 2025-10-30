import { useState, useEffect, useCallback, useRef } from 'react'
import { getUserContext, formatUserContextAsMarkdown, type UserContext } from '@/services/userContext'
import { useSalesboxAuth } from './useSalesboxAuth'

/**
 * Cache duration in milliseconds (5 minutes)
 */
const CACHE_TTL_MS = 5 * 60 * 1000

interface UseUserContextResult {
  /** Current user context data */
  context: UserContext | null
  /** Formatted markdown string ready for AI consumption */
  contextMarkdown: string
  /** Whether the context is currently being fetched */
  isLoading: boolean
  /** Error message if fetch failed */
  error: string | null
  /** Manually refresh the context (bypasses cache) */
  refresh: () => Promise<void>
  /** Whether the cached data is stale (but still being served) */
  isStale: boolean
}

/**
 * React hook for managing user context with 5-minute TTL caching
 *
 * @param enabled - Whether to fetch context automatically (default: true)
 * @returns User context data and control functions
 *
 * @example
 * ```tsx
 * const { context, contextMarkdown, isLoading, error, refresh } = useUserContext()
 *
 * // Use contextMarkdown in AI prompts
 * const systemPrompt = `${baseInstructions}\n\n${contextMarkdown}`
 *
 * // Manually refresh when needed
 * await refresh()
 * ```
 */
export function useUserContext(
  enabled: boolean = true
): UseUserContextResult {
  const { isAuthenticated } = useSalesboxAuth()
  const [context, setContext] = useState<UserContext | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isStale, setIsStale] = useState(false)

  const lastFetchTime = useRef<number>(0)
  const isFetching = useRef(false)

  /**
   * Check if cached data is still valid
   */
  const isCacheValid = useCallback(() => {
    if (!lastFetchTime.current) return false
    const age = Date.now() - lastFetchTime.current
    return age < CACHE_TTL_MS
  }, [])

  /**
   * Fetch user context from API
   */
  const fetchContext = useCallback(async (force: boolean = false) => {
    console.log('[useUserContext] fetchContext called:', { enabled, isAuthenticated, force, isCacheValid: isCacheValid() })

    // Don't fetch if already fetching
    if (isFetching.current) {
      console.log('[useUserContext] Already fetching, skipping')
      return
    }

    // Don't fetch if disabled or not authenticated
    if (!enabled || !isAuthenticated) {
      console.log('[useUserContext] Fetch skipped - enabled:', enabled, 'isAuthenticated:', isAuthenticated)
      return
    }

    // Don't fetch if cache is valid (unless forced)
    if (!force && isCacheValid()) {
      console.log('[useUserContext] Cache still valid, skipping fetch')
      return
    }

    isFetching.current = true
    setIsLoading(true)
    setError(null)

    try {
      const data = await getUserContext()

      setContext(data)
      lastFetchTime.current = Date.now()
      setIsStale(false)
      setError(data.error || null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user context'
      setError(errorMessage)
      console.error('Error fetching user context:', err)
    } finally {
      setIsLoading(false)
      isFetching.current = false
    }
  }, [isAuthenticated, enabled, isCacheValid])

  /**
   * Manual refresh function (bypasses cache)
   */
  const refresh = useCallback(async () => {
    await fetchContext(true)
  }, [fetchContext])

  /**
   * Auto-fetch on mount and when dependencies change
   */
  useEffect(() => {
    fetchContext(false)
  }, [fetchContext])

  /**
   * Set up interval to check cache staleness
   */
  useEffect(() => {
    if (!enabled || !context) return

    const interval = setInterval(() => {
      if (!isCacheValid()) {
        setIsStale(true)
        // Auto-refresh stale data in background
        fetchContext(false)
      }
    }, 60 * 1000) // Check every minute

    return () => clearInterval(interval)
  }, [enabled, context, isCacheValid, fetchContext])

  /**
   * Generate markdown representation
   */
  const contextMarkdown = context ? formatUserContextAsMarkdown(context) : ''

  return {
    context,
    contextMarkdown,
    isLoading,
    error,
    refresh,
    isStale
  }
}
