import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

type SalesboxApiKeyState = {
  apiKey: string
  setApiKey: (value: string) => void
}

export const useSalesboxApiKey = create<SalesboxApiKeyState>()(
  persist(
    (set) => ({
      apiKey: '',
      setApiKey: (value) => set({ apiKey: value }),
    }),
    {
      name: 'salesbox-api-key',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
