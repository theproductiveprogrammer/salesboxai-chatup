import { formatDate } from '@/utils/formatDate'

/**
 * Options for rendering instruction templates
 */
export interface RenderInstructionsOptions {
  /** User context markdown to inject (optional) */
  userContext?: string
}

/**
 * Render assistant instructions by replacing supported placeholders.
 * Supported placeholders:
 * - {{current_date}}: Inserts today's date (UTC, long month), e.g., August 16, 2025.
 * - {{user_context}}: Inserts the user's business context (campaigns, goals, audience, etc.)
 */
export function renderInstructions(
  instructions: string,
  options?: RenderInstructionsOptions
): string
export function renderInstructions(
  instructions: string | undefined,
  options?: RenderInstructionsOptions
): string | undefined
export function renderInstructions(
  instructions?: string,
  options?: RenderInstructionsOptions
): string | undefined {
  if (!instructions) return instructions

  const currentDateStr = formatDate(new Date(), { includeTime: false })

  // Replace placeholders (allow spaces inside braces)
  let rendered = instructions

  // Replace {{current_date}}
  rendered = rendered.replace(/\{\{\s*current_date\s*\}\}/gi, currentDateStr)

  // Replace {{user_context}} if provided
  if (options?.userContext) {
    rendered = rendered.replace(/\{\{\s*user_context\s*\}\}/gi, options.userContext)
  } else {
    // If no user context provided, remove the placeholder
    rendered = rendered.replace(/\{\{\s*user_context\s*\}\}/gi, '')
  }

  return rendered
}
