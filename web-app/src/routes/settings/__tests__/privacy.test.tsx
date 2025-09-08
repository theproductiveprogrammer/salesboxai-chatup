import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Route as PrivacyRoute } from '../privacy'

// Mock dependencies
vi.mock('@/containers/SettingsMenu', () => ({
  default: () => <div data-testid="settings-menu">Settings Menu</div>,
}))

vi.mock('@/containers/HeaderPage', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="header-page">{children}</div>
  ),
}))

vi.mock('@/containers/Card', () => ({
  Card: ({ header, children }: { header?: React.ReactNode; children: React.ReactNode }) => (
    <div data-testid="card">
      {header && <div data-testid="card-header">{header}</div>}
      {children}
    </div>
  ),
  CardItem: ({ title, description, actions }: { title?: string; description?: string; actions?: React.ReactNode }) => (
    <div data-testid="card-item" data-title={title}>
      {title && <div data-testid="card-item-title">{title}</div>}
      {description && <div data-testid="card-item-description">{description}</div>}
      {actions && <div data-testid="card-item-actions">{actions}</div>}
    </div>
  ),
}))

vi.mock('@/containers/ApiKeyInput', () => ({
  ApiKeyInput: () => <div data-testid="api-key-input">API Key Input</div>,
}))

vi.mock('@/i18n/react-i18next-compat', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))


vi.mock('@/constants/routes', () => ({
  route: {
    settings: {
      privacy: '/settings/privacy',
    },
  },
}))

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: (path: string) => (config: any) => ({
    ...config,
    component: config.component,
  }),
}))

describe('Privacy Settings Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the privacy settings page', () => {
    const Component = PrivacyRoute.component as React.ComponentType
    render(<Component />)

    expect(screen.getByTestId('header-page')).toBeInTheDocument()
    expect(screen.getByTestId('settings-menu')).toBeInTheDocument()
    expect(screen.getByText('common:settings')).toBeInTheDocument()
  })

  it('should render security card with header', () => {
    const Component = PrivacyRoute.component as React.ComponentType
    render(<Component />)

    expect(screen.getByTestId('card')).toBeInTheDocument()
    expect(screen.getByTestId('card-header')).toBeInTheDocument()
    expect(screen.getByText('settings:privacy.security')).toBeInTheDocument()
  })

  it('should render API key input', () => {
    const Component = PrivacyRoute.component as React.ComponentType
    render(<Component />)

    const apiKeyInput = screen.getByTestId('api-key-input')
    expect(apiKeyInput).toBeInTheDocument()
  })

  it('should render API key card item with title and description', () => {
    const Component = PrivacyRoute.component as React.ComponentType
    render(<Component />)

    expect(screen.getByText('settings:privacy.apiKey')).toBeInTheDocument()
    expect(screen.getByText('settings:privacy.apiKeyDesc')).toBeInTheDocument()
  })

  it('should have proper layout structure', () => {
    const Component = PrivacyRoute.component as React.ComponentType
    render(<Component />)

    const headerPage = screen.getByTestId('header-page')
    expect(headerPage).toBeInTheDocument()
    
    const settingsMenu = screen.getByTestId('settings-menu')
    expect(settingsMenu).toBeInTheDocument()
  })

  it('should call translation function with correct keys', () => {
    const Component = PrivacyRoute.component as React.ComponentType
    render(<Component />)

    // Test that translations are rendered
    expect(screen.getByText('common:settings')).toBeInTheDocument()
    expect(screen.getByText('settings:privacy.security')).toBeInTheDocument()
    expect(screen.getByText('settings:privacy.apiKey')).toBeInTheDocument()
    expect(screen.getByText('settings:privacy.apiKeyDesc')).toBeInTheDocument()
  })
})