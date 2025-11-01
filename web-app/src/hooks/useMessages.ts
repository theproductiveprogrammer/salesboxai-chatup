import { create } from 'zustand'
import { ThreadMessage } from '@janhq/core'
import {
  createMessage,
  deleteMessage as deleteMessageExt,
} from '@/services/messages'
import { useAssistant } from './useAssistant'

type MessageState = {
  messages: Record<string, ThreadMessage[]>
  getMessages: (threadId: string) => ThreadMessage[]
  setMessages: (threadId: string, messages: ThreadMessage[]) => void
  addMessage: (message: ThreadMessage) => void
  deleteMessage: (threadId: string, messageId: string) => void
}

export const useMessages = create<MessageState>()((set, get) => ({
  messages: {},
  getMessages: (threadId) => {
    return get().messages[threadId] || []
  },
  setMessages: (threadId, messages) => {
    console.log('[useMessages] setMessages called:', {
      threadId,
      count: messages.length,
      messageIds: messages.map((m) => m.id),
    })
    set((state) => ({
      messages: {
        ...state.messages,
        [threadId]: messages,
      },
    }))
  },
  addMessage: (message) => {
    const assistants = useAssistant.getState().assistants
    const currentAssistant = useAssistant.getState().currentAssistant

    const selectedAssistant =
      assistants.find((a) => a.id === currentAssistant.id) || assistants[0]

    const newMessage = {
      ...message,
      created_at: message.created_at || Date.now(),
      metadata: {
        ...message.metadata,
        assistant: selectedAssistant,
      },
    }

    console.log('[useMessages] Adding message to state:', {
      threadId: message.thread_id,
      messageId: newMessage.id,
      role: newMessage.role,
    })

    // Update state immediately to avoid race conditions with navigation
    set((state) => ({
      messages: {
        ...state.messages,
        [message.thread_id]: [
          ...(state.messages[message.thread_id] || []),
          newMessage,
        ],
      },
    }))

    // Persist to disk asynchronously
    createMessage(newMessage)
      .then(() => {
        console.log('[useMessages] Message persisted to disk:', newMessage.id)
      })
      .catch((error) => {
        console.error('[useMessages] Failed to persist message to disk:', error)
      })
  },
  deleteMessage: (threadId, messageId) => {
    deleteMessageExt(threadId, messageId)
    set((state) => ({
      messages: {
        ...state.messages,
        [threadId]:
          state.messages[threadId]?.filter(
            (message) => message.id !== messageId
          ) || [],
      },
    }))
  },
}))
