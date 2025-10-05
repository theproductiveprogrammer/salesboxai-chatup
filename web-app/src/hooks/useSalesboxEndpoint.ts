import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { invoke } from '@tauri-apps/api/core'

type SalesboxEndpointState = {
  endpoint: string
  setEndpoint: (value: string) => void
}

// Sync to Tauri store so Rust can access it
const syncToTauriStore = async (endpoint: string) => {
  try {
    await invoke('sync_salesbox_endpoint', { endpoint })
  } catch (error) {
    console.error('Failed to sync endpoint to Tauri store:', error)
  }
}

export const useSalesboxEndpoint = create<SalesboxEndpointState>()(
  persist(
    (set) => ({
      endpoint: 'https://agent-job.salesbox.ai',
      setEndpoint: (value) => {
        set({ endpoint: value })
        // Sync to Tauri store for Rust to read
        syncToTauriStore(value)
      },
    }),
    {
      name: 'salesbox-endpoint',
      storage: createJSONStorage(() => localStorage),
    }
  )
)