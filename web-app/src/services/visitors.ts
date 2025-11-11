import type {
  VisitorConversation,
  ParsedVisitorConversation,
  VisitorConversationData,
} from '@/types/visitors'
import { callSalesboxApi } from './salesboxApi'

/**
 * Fetch visitor conversations from the backend
 */
export async function getVisitorConversations(): Promise<ParsedVisitorConversation[]> {
  const response = await callSalesboxApi<VisitorConversation[]>('/mcp/visitor-conversations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  })

  if (response.error || !response.data) {
    console.error('Failed to fetch visitor conversations:', response.error)
    throw new Error(response.error || 'Failed to fetch visitor conversations')
  }

  // Parse and transform conversations
  return response.data
    .map((conv) => parseVisitorConversation(conv))
    .filter((conv): conv is ParsedVisitorConversation => conv !== null)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()) // Sort by newest first
}

/**
 * Parse a visitor conversation from backend format
 */
function parseVisitorConversation(
  conv: VisitorConversation
): ParsedVisitorConversation | null {
  try {
    // The backend already decodes base64, so data is a JSON string
    const data: VisitorConversationData = JSON.parse(conv.data)

    return {
      id: conv.id,
      timestamp: new Date(conv.created),
      data,
      senderID: conv.senderID,
      raw: conv,
    }
  } catch (error) {
    console.error('Failed to parse visitor conversation:', conv.id, error)
    return null
  }
}

/**
 * Extract visitor information from conversation content
 * Looks for patterns like [**Name**](/lead?id=xxx) and [**Company**](/account?id=xxx)
 */
export function extractVisitorInfo(content: string): {
  visitorName?: string
  companyName?: string
  leadId?: string
  accountId?: string
  linkedinUrl?: string
} {
  const result: {
    visitorName?: string
    companyName?: string
    leadId?: string
    accountId?: string
    linkedinUrl?: string
  } = {}

  // Extract visitor name and lead ID
  const visitorMatch = content.match(/\[\*\*([^*]+)\*\*\]\(\/lead\?id=(\d+)\)/)
  if (visitorMatch) {
    result.visitorName = visitorMatch[1]
    result.leadId = visitorMatch[2]
  }

  // Extract company name and account ID
  const companyMatch = content.match(/\[\*\*([^*]+)\*\*\]\(\/account\?id=(\d+)\)/)
  if (companyMatch) {
    result.companyName = companyMatch[1]
    result.accountId = companyMatch[2]
  }

  // Extract LinkedIn URL - look for linkedin.com/in/ URLs
  const linkedinMatch = content.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[^\s)]+/)
  if (linkedinMatch) {
    result.linkedinUrl = linkedinMatch[0]
  }

  return result
}

/**
 * Check if visitor matches ICP
 */
export function isICPMatch(content: string): boolean {
  // Look for "ICP Fit: ✓" or similar positive indicator
  return content.includes('ICP Fit: ✓') || content.includes('ICP Fit: ✔')
}
