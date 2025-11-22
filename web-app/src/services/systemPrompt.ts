import { callSalesboxApi } from './salesboxApi'

export interface TextSummaryResDTO {
  text?: string
  error?: string
}

export interface SystemPromptResponse {
  systemPrompt: string
}

/**
 * Fetches the system prompt from the backend
 * Agent context is automatically included via X-SBAgent-Context header if threadId is provided
 * @param threadId - Thread ID for agent context
 * @param userMsg - Optional user message for context resolution
 * @returns Object containing the system prompt
 */
export async function getSystemPrompt(
  threadId: string,
  userMsg?: string
): Promise<SystemPromptResponse> {
  const response = await callSalesboxApi<TextSummaryResDTO>(
    '/mcp/agent-system-prompt',
    {
      method: 'POST',
      body: JSON.stringify({
        userMsg: userMsg || '',
      }),
    },
    threadId // Pass threadId for automatic agent context handling
  )

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
  }
}
