import { callSalesboxApi } from './salesboxApi'

/**
 * Service for fetching user context from the backend
 */

export interface CampaignInfo {
  id: number
  name: string
  status: string
  type: string
  objective: string
  startDate?: string
  endDate?: string
}

export interface TargetAudienceInfo {
  jobTitles: string[]
  industries: string[]
  companySizes: string[]
  geographies: string[]
  jobFunctions: string[]
  objectives: string[]
}

export interface PersonaInfo {
  id: number
  name: string
  titles: string[]
  industries: string[]
  companySizes: string[]
}

export interface GoalInfo {
  id: number
  name: string
  description?: string
  target?: number
  actual?: string
  progressPct?: number
  weight?: number
}

export interface FunnelInfo {
  id: number
  accountName: string
  stage: string
  type: string
  score?: number
  discovered?: number
  conversations?: number
}

export interface UserContext {
  tenantName: string
  activeCampaigns: CampaignInfo[]
  targetAudience: TargetAudienceInfo
  userPersonas: PersonaInfo[]
  userGoals: GoalInfo[]
  activeFunnels: FunnelInfo[]
  cachedAt: string
  error?: string
}

/**
 * Fetch user context from backend
 * @param apiKey - User's API key
 * @returns UserContext object with all relevant business context
 */
export async function getUserContext(apiKey: string): Promise<UserContext> {
  console.log('[UserContext] Fetching user context with API key:', apiKey ? 'present' : 'missing')
  try {
    const response = await callSalesboxApi('/mcp/user-context', {
      method: 'POST',
      body: JSON.stringify({})
    })
    console.log('[UserContext] API response:', response)

    if (response.error) {
      throw new Error(`API call failed: ${response.error}`)
    }

    const data = response.data

    // Check if backend returned an error
    if (data.error) {
      throw new Error(data.error)
    }

    return {
      tenantName: data.tenantName || '',
      activeCampaigns: data.activeCampaigns || [],
      targetAudience: data.targetAudience || {
        jobTitles: [],
        industries: [],
        companySizes: [],
        geographies: [],
        jobFunctions: [],
        objectives: []
      },
      userPersonas: data.userPersonas || [],
      userGoals: data.userGoals || [],
      activeFunnels: data.activeFunnels || [],
      cachedAt: data.cachedAt || new Date().toISOString(),
      error: data.error
    }
  } catch (error) {
    console.error('Error fetching user context:', error)
    throw new Error(error instanceof Error ? error.message : 'Unknown error occurred')
  }
}

/**
 * Format user context as markdown text for AI consumption
 */
export function formatUserContextAsMarkdown(context: UserContext): string {
  const sections: string[] = []

  // Tenant Info
  if (context.tenantName) {
    sections.push(`# Organization: ${context.tenantName}`)
  }

  // Active Campaigns
  if (context.activeCampaigns && context.activeCampaigns.length > 0) {
    sections.push('\n## Active Campaigns')
    context.activeCampaigns.forEach(campaign => {
      sections.push(`- **${campaign.name}** (${campaign.status})`)
      if (campaign.objective) {
        sections.push(`  - Objective: ${campaign.objective}`)
      }
      if (campaign.type) {
        sections.push(`  - Type: ${campaign.type}`)
      }
      if (campaign.startDate && campaign.endDate) {
        sections.push(`  - Duration: ${campaign.startDate} to ${campaign.endDate}`)
      }
    })
  }

  // Target Audience
  const ta = context.targetAudience
  if (ta && (ta.jobTitles?.length || ta.industries?.length || ta.companySizes?.length)) {
    sections.push('\n## Target Audience (ICP)')
    if (ta.jobTitles?.length) {
      sections.push(`- **Job Titles**: ${ta.jobTitles.join(', ')}`)
    }
    if (ta.industries?.length) {
      sections.push(`- **Industries**: ${ta.industries.join(', ')}`)
    }
    if (ta.companySizes?.length) {
      sections.push(`- **Company Sizes**: ${ta.companySizes.join(', ')}`)
    }
    if (ta.geographies?.length) {
      sections.push(`- **Geographies**: ${ta.geographies.join(', ')}`)
    }
    if (ta.jobFunctions?.length) {
      sections.push(`- **Job Functions**: ${ta.jobFunctions.join(', ')}`)
    }
    if (ta.objectives?.length) {
      sections.push(`- **Objectives**: ${ta.objectives.join(', ')}`)
    }
  }

  // User Personas
  if (context.userPersonas && context.userPersonas.length > 0) {
    sections.push('\n## Buyer Personas')
    context.userPersonas.forEach(persona => {
      sections.push(`- **${persona.name}**`)
      if (persona.titles?.length) {
        sections.push(`  - Titles: ${persona.titles.join(', ')}`)
      }
      if (persona.industries?.length) {
        sections.push(`  - Industries: ${persona.industries.join(', ')}`)
      }
      if (persona.companySizes?.length) {
        sections.push(`  - Company Sizes: ${persona.companySizes.join(', ')}`)
      }
    })
  }

  // User Goals
  if (context.userGoals && context.userGoals.length > 0) {
    sections.push('\n## Current Goals')
    context.userGoals.forEach(goal => {
      sections.push(`- **${goal.name}**`)
      if (goal.description) {
        sections.push(`  - ${goal.description}`)
      }
      if (goal.target !== undefined && goal.actual !== undefined) {
        sections.push(`  - Progress: ${goal.actual} / ${goal.target} (${goal.progressPct?.toFixed(1)}%)`)
      }
    })
  }

  // Active Funnels
  if (context.activeFunnels && context.activeFunnels.length > 0) {
    sections.push('\n## Active Funnels')
    const topFunnels = context.activeFunnels.slice(0, 10) // Limit to top 10
    topFunnels.forEach(funnel => {
      sections.push(`- **${funnel.accountName}** (${funnel.stage})`)
      if (funnel.score !== undefined) {
        sections.push(`  - Score: ${funnel.score.toFixed(2)}`)
      }
      if (funnel.discovered !== undefined) {
        sections.push(`  - Leads Discovered: ${funnel.discovered}`)
      }
      if (funnel.conversations !== undefined) {
        sections.push(`  - Conversations: ${funnel.conversations}`)
      }
    })
    if (context.activeFunnels.length > 10) {
      sections.push(`\n_(${context.activeFunnels.length - 10} more funnels not shown)_`)
    }
  }

  // Footer
  sections.push(`\n---\n_Context cached at: ${context.cachedAt}_`)

  return sections.join('\n')
}
