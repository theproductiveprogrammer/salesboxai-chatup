import { callSalesboxApi } from './salesboxApi'
import type { LeadContext } from '@/hooks/useLeadContext'

export interface SystemPromptRequest {
  leadContext?: LeadContext | null
}

export interface TextSummaryResDTO {
  text?: string
  error?: string
}

/**
 * Fetches the system prompt from the backend
 * @param leadContext - Optional lead context to include in the prompt
 * @returns The system prompt string
 */
export async function getSystemPrompt(
  leadContext?: LeadContext | null
): Promise<string> {
  const response = await callSalesboxApi<TextSummaryResDTO>('/mcp/system-prompt', {
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

  return response.data?.text || ''
}
