// Visitor conversation data structure (decoded from conversation.data field)
export interface VisitorConversationData {
  role: 'assistant' | 'user'
  content: string // Markdown content
  when: number // Unix timestamp in milliseconds
  salesbox_channel?: string
  type?: 'alert' | 'message' | string
}

// Conversation from backend API
export interface VisitorConversation {
  id: number
  created: string // ISO date string
  createdBy_id?: number
  modified?: string
  modifiedBy_id?: number
  owner_id: number
  tenant_id: number
  data: string // JSON string (already decoded from base64 by backend)
  senderID: string // Format: "agentic1:salesbot_id-user_id"
  channel: string // "AI1" for visitor conversations
  salesbot_id: number
  leadID?: number | null
  incoming_message?: boolean
  inputText?: string
}

// Parsed visitor conversation for display
export interface ParsedVisitorConversation {
  id: number
  timestamp: Date
  data: VisitorConversationData
  senderID: string
  raw: VisitorConversation
}
