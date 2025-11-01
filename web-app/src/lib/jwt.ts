// JWT token utilities for client-side token handling
// Note: We only decode/validate on client side; server does cryptographic verification

import type { JWTPayload, AuthUser } from '../types/auth'

/**
 * Decode a JWT token to extract the payload
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.error('Invalid JWT format: expected 3 parts')
      return null
    }

    // Decode the payload (second part)
    const payload = parts[1]
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded) as JWTPayload
  } catch (error) {
    console.error('Failed to decode JWT:', error)
    return null
  }
}

/**
 * Extract user information from JWT payload
 */
export function extractUserFromJWT(payload: JWTPayload): AuthUser {
  return {
    id: payload.id,
    tenantId: payload.tenant_id,
    name: payload.name,
    username: payload.username,
    channels: payload.channels,
  }
}

/**
 * Check if a JWT token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token)
  if (!payload || !payload.exp) {
    return true
  }

  // exp is in seconds, Date.now() is in milliseconds
  const now = Date.now() / 1000
  return payload.exp < now
}

/**
 * Get the expiry timestamp of a JWT token
 */
export function getTokenExpiry(token: string): number | null {
  const payload = decodeJWT(token)
  return payload?.exp ?? null
}

/**
 * Check if token will expire within the specified minutes
 */
export function isTokenExpiringSoon(token: string, minutesThreshold = 60): boolean {
  const payload = decodeJWT(token)
  if (!payload || !payload.exp) {
    return true
  }

  const now = Date.now() / 1000
  const timeUntilExpiry = payload.exp - now
  const thresholdInSeconds = minutesThreshold * 60

  return timeUntilExpiry < thresholdInSeconds
}

/**
 * Get time remaining until token expires (in seconds)
 */
export function getTimeUntilExpiry(token: string): number | null {
  const payload = decodeJWT(token)
  if (!payload || !payload.exp) {
    return null
  }

  const now = Date.now() / 1000
  const timeRemaining = payload.exp - now
  return Math.max(0, timeRemaining)
}

/**
 * Format the token expiry time as a human-readable string
 */
export function formatTokenExpiry(token: string): string {
  const expiryTimestamp = getTokenExpiry(token)
  if (!expiryTimestamp) {
    return 'Invalid token'
  }

  const expiryDate = new Date(expiryTimestamp * 1000)
  return expiryDate.toLocaleString()
}

/**
 * Validate token structure (basic client-side validation)
 */
export function isValidTokenStructure(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false
  }

  // JWT should have 3 parts separated by dots
  const parts = token.split('.')
  if (parts.length !== 3) {
    return false
  }

  // Try to decode the payload
  const payload = decodeJWT(token)
  if (!payload) {
    return false
  }

  // Check for required fields
  const requiredFields: (keyof JWTPayload)[] = ['id', 'tenant_id', 'username', 'exp']
  for (const field of requiredFields) {
    if (!(field in payload)) {
      console.error(`Missing required field in JWT: ${String(field)}`)
      return false
    }
  }

  return true
}
