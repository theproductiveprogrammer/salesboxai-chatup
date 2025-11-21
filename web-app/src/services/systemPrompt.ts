import { callSalesboxApi } from './salesboxApi'
import type { LeadContext } from '@/hooks/useLeadContext'

export interface SystemPromptRequest {
  leadContext?: LeadContext | null
}

export interface AgentSystemPromptResDTO {
  text?: string
  error?: string
  leadContext?: LeadContext | null
}

export interface SystemPromptResponse {
  systemPrompt: string
  leadContext?: LeadContext | null
}

/**
 * Fetches the system prompt from the backend
 * @param leadContext - Optional lead context to include in the prompt
 * @returns Object containing the system prompt and resolved lead context
 */
export async function getSystemPrompt(
  leadContext?: LeadContext | null
): Promise<SystemPromptResponse> {
  const response = await callSalesboxApi<AgentSystemPromptResDTO>('/mcp/agent-system-prompt', {
    method: 'POST',
    body: JSON.stringify({
      leadContext: leadContext || null,
    }),
  })

  if (response.error) {
    console.error('Failed to fetch system prompt:', response.error)
    throw new Error(response.error)
  }

  if (response.data?.error) {
    console.error('Backend error fetching system prompt:', response.data.error)
    throw new Error(response.data.error)
  }

  return {
    systemPrompt: response.data?.text || '',
    leadContext: response.data?.leadContext || null
  }
}
