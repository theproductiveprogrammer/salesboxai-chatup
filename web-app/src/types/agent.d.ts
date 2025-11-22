/**
 * Agent context types for SalesBox.AI
 * This context is passed via X-SBAgent-Context header and maintained per thread
 */

export interface SBAgentContext {
  // Lead context
  lead_id?: number | null
  lead_name?: string | null
  lead_title?: string | null
  lead_linkedin?: string | null
  lead_email?: string | null
  lead_company?: string | null

  // Account context (for future use)
  account_id?: number | null
  account_name?: string | null

  // Opportunity context (for future use)
  opportunity_id?: number | null
}

/**
 * Creates an empty agent context
 */
export function createEmptyAgentContext(): SBAgentContext {
  return {
    lead_id: null,
    lead_name: null,
    lead_title: null,
    lead_linkedin: null,
    lead_email: null,
    lead_company: null,
    account_id: null,
    account_name: null,
    opportunity_id: null,
  }
}

