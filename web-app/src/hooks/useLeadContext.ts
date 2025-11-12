import { create } from 'zustand'

export type LeadContext = {
  name?: string
  linkedin?: string
  email?: string
  id?: string | number
  company?: string
  title?: string
}

type LeadContextStoreState = {
  leadContext: LeadContext | null
  setLeadContext: (context: LeadContext) => void
  clearLeadContext: () => void
  getLeadContext: () => LeadContext | null
}

export const useLeadContext = create<LeadContextStoreState>((set, get) => ({
  leadContext: null,
  setLeadContext: (context) => set({ leadContext: context }),
  clearLeadContext: () => set({ leadContext: null }),
  getLeadContext: () => get().leadContext,
}))
