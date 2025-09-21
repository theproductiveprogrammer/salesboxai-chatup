import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

type SalesboxEndpointState = {
  endpoint: string
  setEndpoint: (value: string) => void
}

export const useSalesboxEndpoint = create<SalesboxEndpointState>()(
  persist(
    (set) => ({
      endpoint: 'https://agent-job.salesbox.ai',
      setEndpoint: (value) => set({ endpoint: value }),
    }),
    {
      name: 'salesbox-endpoint',
      storage: createJSONStorage(() => localStorage),
    }
  )
)