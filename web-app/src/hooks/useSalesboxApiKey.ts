import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { invoke } from '@tauri-apps/api/core'

type SalesboxApiKeyState = {
  apiKey: string
  setApiKey: (value: string) => void
}

// Sync to Tauri store so Rust can access it
const syncToTauriStore = async (apiKey: string) => {
  try {
    await invoke('sync_salesbox_api_key', { apiKey })
  } catch (error) {
    console.error('Failed to sync API key to Tauri store:', error)
  }
}

export const useSalesboxApiKey = create<SalesboxApiKeyState>()(
  persist(
    (set) => ({
      apiKey: '',
      setApiKey: (value) => {
        set({ apiKey: value })
        // Sync to Tauri store for Rust to read
        syncToTauriStore(value)
      },
    }),
    {
      name: 'salesbox-api-key',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
