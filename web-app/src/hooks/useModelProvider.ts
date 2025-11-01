import { create } from 'zustand'
import { useSalesboxEndpoint } from './useSalesboxEndpoint'
import { useSalesboxAuth } from './useSalesboxAuth'

/**
 * Simplified model provider hook.
 * Always uses the Salesbox provider with gpt-4o-mini model.
 * Provider configuration is dynamically constructed from useSalesboxEndpoint and useSalesboxAuth.
 * No localStorage persistence - configuration comes from those hooks instead.
 */

type ModelProviderState = {
  providers: ModelProvider[]
  selectedModel: Model
  selectedProvider: string
  getModelBy: (modelId: string) => Model | undefined
  getProvider: () => ModelProvider
  getProviderByName: (providerName?: string) => ModelProvider
  selectModelProvider: (
    providerName?: string,
    modelName?: string
  ) => Model
  // Legacy methods kept for compatibility (no-ops or simple returns)
  setProviders: (providers: ModelProvider[]) => void
  updateProvider: (providerName: string, data: Partial<ModelProvider>) => void
  deleteModel: (modelId: string) => void
  addProvider: (provider: ModelProvider) => void
  deleteProvider: (providerName: string) => void
}

// Hardcoded gpt-4o-mini model
const GPT_4O_MINI_MODEL: Model = {
  id: 'gpt-4o-mini',
  name: 'GPT-4o Mini',
  version: '1.0',
  description: 'OpenAI GPT-4o Mini via Salesbox.AI proxy',
  capabilities: ['completion', 'tools'],
}

// Helper to construct provider dynamically
const constructProvider = (): ModelProvider => {
  const endpoint = useSalesboxEndpoint.getState().endpoint
  const token = useSalesboxAuth.getState().token

  return {
    active: true,
    api_key: token || '',
    base_url: `${endpoint}/api/openai/v1`,
    provider: 'salesbox',
    explore_models_url: 'https://platform.openai.com/docs/models',
    settings: [
      {
        key: 'api-key',
        title: 'JWT Token',
        description:
          'Authentication token automatically managed from your Salesbox.AI session.',
        controller_type: 'input',
        controller_props: {
          placeholder: 'Auto-filled from login',
          value: token || '',
          type: 'password',
          input_actions: ['unobscure', 'copy'],
        },
      },
      {
        key: 'base-url',
        title: 'Base URL',
        description: 'Salesbox.AI OpenAI-compatible API endpoint.',
        controller_type: 'input',
        controller_props: {
          placeholder: endpoint,
          value: endpoint,
        },
      },
    ],
    models: [GPT_4O_MINI_MODEL],
  } as ModelProvider
}

export const useModelProvider = create<ModelProviderState>((set, get) => ({
  providers: [constructProvider()],  // Initialize with salesbox provider
  selectedModel: GPT_4O_MINI_MODEL,
  selectedProvider: 'salesbox',

  getModelBy: (modelId: string) => {
    // We only have one model - gpt-4o-mini
    return modelId === 'gpt-4o-mini' ? GPT_4O_MINI_MODEL : undefined
  },

  getProvider: () => {
    // Dynamically construct provider from current endpoint and auth state
    const endpoint = useSalesboxEndpoint.getState().endpoint
    const token = useSalesboxAuth.getState().token

    const provider = {
      active: true,
      api_key: token || '',
      base_url: `${endpoint}/api/openai/v1`,
      provider: 'salesbox',
      explore_models_url: 'https://platform.openai.com/docs/models',
      settings: [
        {
          key: 'api-key',
          title: 'JWT Token',
          description:
            'Authentication token automatically managed from your Salesbox.AI session.',
          controller_type: 'input',
          controller_props: {
            placeholder: 'Auto-filled from login',
            value: token || '',
            type: 'password',
            input_actions: ['unobscure', 'copy'],
          },
        },
        {
          key: 'base-url',
          title: 'Base URL',
          description: 'Salesbox.AI OpenAI-compatible API endpoint.',
          controller_type: 'input',
          controller_props: {
            placeholder: endpoint,
            value: endpoint,
          },
        },
      ],
      models: [GPT_4O_MINI_MODEL],
    } as ModelProvider

    return provider
  },

  getProviderByName: (_providerName?: string) => {
    // Always return salesbox provider, ignore providerName
    return get().getProvider()
  },

  selectModelProvider: (_providerName?: string, _modelName?: string) => {
    // Always return gpt-4o-mini, ignore parameters
    set({ selectedModel: GPT_4O_MINI_MODEL })
    return GPT_4O_MINI_MODEL
  },

  // Legacy methods - no-ops for compatibility
  setProviders: (_providers: ModelProvider[]) => {
    // No-op: we don't store providers anymore
  },

  updateProvider: (_providerName: string, _data: Partial<ModelProvider>) => {
    // No-op: provider is dynamically constructed
  },

  deleteModel: (_modelId: string) => {
    // No-op: we only have one model
  },

  addProvider: (_provider: ModelProvider) => {
    // No-op: we only have salesbox provider
  },

  deleteProvider: (_providerName: string) => {
    // No-op: we only have salesbox provider
  },
}))
