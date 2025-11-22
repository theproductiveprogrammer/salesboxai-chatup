import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { localStorageKey } from '@/constants/localStorage'
import type { SBAgentContext } from '@/types/agent'

/**
 * Per-thread agent context store
 * Each thread maintains its own agent context (lead, account, opportunity)
 */
type SBAgentContextStore = {
  // Map of threadId -> agent context
  contexts: Record<string, SBAgentContext>

  // Get context for a specific thread
  getContext: (threadId: string) => SBAgentContext | null

  // Set context for a specific thread
  setContext: (threadId: string, context: SBAgentContext) => void

  // Update context for a specific thread (merge with existing)
  updateContext: (threadId: string, contextUpdate: Partial<SBAgentContext>) => void

  // Clear context for a specific thread
  clearContext: (threadId: string) => void

  // Clear all contexts
  clearAllContexts: () => void
}

export const useSBAgentContext = create<SBAgentContextStore>()(
  persist(
    (set, get) => ({
      contexts: {},

      getContext: (threadId: string) => {
        return get().contexts[threadId] || null
      },

      setContext: (threadId: string, context: SBAgentContext) => {
        set((state) => ({
          contexts: {
            ...state.contexts,
            [threadId]: context,
          },
        }))
      },

      updateContext: (threadId: string, contextUpdate: Partial<SBAgentContext>) => {
        set((state) => {
          const existingContext = state.contexts[threadId] || {}
          return {
            contexts: {
              ...state.contexts,
              [threadId]: {
                ...existingContext,
                ...contextUpdate,
              },
            },
          }
        })
      },

      clearContext: (threadId: string) => {
        set((state) => {
          const newContexts = { ...state.contexts }
          delete newContexts[threadId]
          return { contexts: newContexts }
        })
      },

      clearAllContexts: () => {
        set({ contexts: {} })
      },
    }),
    {
      name: localStorageKey.agentContext,
      storage: createJSONStorage(() => localStorage),
    }
  )
)
