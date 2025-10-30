// Authentication-related type definitions

// JWT token payload structure based on TokenProviderLogic.java
interface JWTPayload {
  iat: number // Issued at timestamp
  exp: number // Expiry timestamp
  sub: string // Subject (user_<id>)
  id: number // User ID
  tenant_id: number // Tenant ID
  name: string // Full name
  username: string // Username/email
  channels: string[] // User channels
}

// User credentials for login
interface LoginCredentials {
  username: string
  password: string
}

// Response from /user-token/login endpoint
interface TokenResponse {
  access_token: string | null
  error: string | null
}

// User information extracted from JWT
interface AuthUser {
  id: number
  tenantId: number
  name: string
  username: string
  channels: string[]
}

// Authentication state
interface AuthState {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  credentials: {
    username: string
    password: string
  } | null
}

// Authentication actions
interface AuthActions {
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  setToken: (token: string) => void
  clearError: () => void
  loadStoredCredentials: () => Promise<void>
  refreshToken: () => Promise<boolean>
}

// Combined auth store type
type AuthStore = AuthState & AuthActions
