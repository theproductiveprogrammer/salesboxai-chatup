import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

type SalesboxEndpointState = {
  endpoint: string
  setEndpoint: (value: string) => void
}

export const useSalesboxEndpoint = create<SalesboxEndpointState>()(
  persist(
    (set, get) => ({
      endpoint: 'https://agent-job.salesbox.ai',
      setEndpoint: (value) => {
        console.log('🔧 Setting endpoint to:', value)
        set({ endpoint: value })
        // Verify it was set correctly
        setTimeout(() => {
          console.log('🔍 Current endpoint after setting:', get().endpoint)
        }, 100)
      },
    }),
    {
      name: 'salesbox-endpoint',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
