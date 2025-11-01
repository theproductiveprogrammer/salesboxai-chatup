/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ContentType,
  ChatCompletionRole,
  ThreadMessage,
  MessageStatus,
  EngineManager,
  ModelManager,
  chatCompletionRequestMessage,
  chatCompletion,
  chatCompletionChunk,
  Tool,
} from '@janhq/core'
import { invoke } from '@tauri-apps/api/core'
import { fetch as fetchTauri } from '@tauri-apps/plugin-http'
import {
  ChatCompletionMessageParam,
  ChatCompletionTool,
  CompletionResponse,
  CompletionResponseChunk,
  models,
  StreamCompletionResponse,
  TokenJS,
  ConfigOptions,
} from 'token.js'
import { useSalesboxAuth } from '@/hooks/useSalesboxAuth'

// Extended config options to include custom fetch function
type ExtendedConfigOptions = ConfigOptions & {
  fetch?: typeof fetch
}
import { ulid } from 'ulidx'
import { MCPTool } from '@/types/completion'
import { CompletionMessagesBuilder } from './messages'
import { ChatCompletionMessageToolCall } from 'openai/resources'
import { callToolWithCancellation } from '@/services/mcp'
import { ExtensionManager } from './extension'
import { useAppState } from '@/hooks/useAppState'

export type ChatCompletionResponse =
  | chatCompletion
  | AsyncIterable<chatCompletionChunk>
  | StreamCompletionResponse
  | CompletionResponse

/**
 * @fileoverview Helper functions for creating thread content.
 * These functions are used to create thread content objects
 * for different types of content, such as text and image.
 * The functions return objects that conform to the `ThreadContent` type.
 * @param content - The content of the thread
 * @returns
 */
export const newUserThreadContent = (
  threadId: string,
  content: string,
  attachments?: Array<{
    name: string
    type: string
    size: number
    base64: string
    dataUrl: string
  }>
): ThreadMessage => {
  const contentParts = [
    {
      type: ContentType.Text,
      text: {
        value: content,
        annotations: [],
      },
    },
  ]

  // Add attachments to content array
  if (attachments) {
    attachments.forEach((attachment) => {
      if (attachment.type.startsWith('image/')) {
        contentParts.push({
          type: ContentType.Image,
          image_url: {
            url: `data:${attachment.type};base64,${attachment.base64}`,
            detail: 'auto',
          },
        } as any)
      }
    })
  }

  return {
    type: 'text',
    role: ChatCompletionRole.User,
    content: contentParts,
    id: ulid(),
    object: 'thread.message',
    thread_id: threadId,
    status: MessageStatus.Ready,
    created_at: 0,
    completed_at: 0,
  }
}
/**
 * @fileoverview Helper functions for creating thread content.
 * These functions are used to create thread content objects
 * for different types of content, such as text and image.
 * The functions return objects that conform to the `ThreadContent` type.
 * @param content - The content of the thread
 * @returns
 */
export const newAssistantThreadContent = (
  threadId: string,
  content: string,
  metadata: Record<string, unknown> = {}
): ThreadMessage => ({
  type: 'text',
  role: ChatCompletionRole.Assistant,
  content: [
    {
      type: ContentType.Text,
      text: {
        value: content,
        annotations: [],
      },
    },
  ],
  id: ulid(),
  object: 'thread.message',
  thread_id: threadId,
  status: MessageStatus.Ready,
  created_at: 0,
  completed_at: 0,
  metadata,
})

/**
 * Empty thread content object.
 * @returns
 */
export const emptyThreadContent: ThreadMessage = {
  type: 'text',
  role: ChatCompletionRole.Assistant,
  id: ulid(),
  object: 'thread.message',
  thread_id: '',
  content: [],
  status: MessageStatus.Ready,
  created_at: 0,
  completed_at: 0,
}

/**
 * @fileoverview Helper function to send a completion request to the model provider.
 * @param thread
 * @param provider
 * @param messages
 * @returns
 */
export const sendCompletion = async (
  thread: Thread,
  provider: ModelProvider,
  messages: ChatCompletionMessageParam[],
  abortController: AbortController,
  tools: MCPTool[] = [],
  stream: boolean = true,
  params: Record<string, object> = {}
): Promise<ChatCompletionResponse | undefined> => {
  console.log('[sendCompletion] Called with:', {
    threadId: thread?.id,
    modelId: thread?.model?.id,
    provider: provider?.provider,
    baseURL: provider?.base_url,
    messagesCount: messages?.length,
    toolsCount: tools?.length,
    stream
  })

  if (!thread?.model?.id || !provider) {
    console.log('[sendCompletion] Missing thread model or provider, returning undefined')
    return undefined
  }

  let providerName = provider.provider as unknown as keyof typeof models

  if (!Object.keys(models).some((key) => key === providerName))
    providerName = 'openai-compatible'

  console.log('[sendCompletion] Using providerName:', providerName)

  const useTauriFetch = providerName === 'openai-compatible' && provider.provider !== 'salesbox'
  console.log('[sendCompletion] Will use Tauri fetch?', useTauriFetch, 'Provider:', provider.provider)

  const tokenJS = new TokenJS({
    apiKey:
      provider.provider === 'salesbox'
        ? useSalesboxAuth.getState().token || ''
        : provider.api_key ?? (await invoke('app_token')),
    // TODO: Retrieve from extension settings
    baseURL: provider.base_url,
    // Use Tauri's fetch to avoid CORS issues ONLY for openai-compatible provider
    // DO NOT use it for salesbox because it breaks streaming
    ...(useTauriFetch && {
      fetch: fetchTauri,
    }),
    // Salesbox.AI JWT authentication and headers
    ...(provider.provider === 'salesbox' && {
      defaultHeaders: {
        Authorization: `Bearer ${useSalesboxAuth.getState().token}`,
        Accept: 'text/event-stream',
        'Content-Type': 'application/json',
      },
    }),
    // OpenRouter identification headers for Salesbox.AI Agent
    // ref: https://openrouter.ai/docs/api-reference/overview#headers
    ...(provider.provider === 'openrouter' && {
      defaultHeaders: {
        'HTTP-Referer': 'https://salesbox.ai',
        'X-Title': 'Salesbox.AI Agent',
      },
    }),
  } as ExtendedConfigOptions)

  // Skip extendModelList for llamacpp and salesbox providers
  // salesbox uses predefined models and doesn't need dynamic model extension
  if (
    thread.model.id &&
    !Object.values(models[providerName]).flat().includes(thread.model.id) &&
    !tokenJS.extendedModelExist(providerName as any, thread.model.id) &&
    provider.provider !== 'llamacpp' &&
    provider.provider !== 'salesbox'
  ) {
    try {
      tokenJS.extendModelList(
        providerName as any,
        thread.model.id,
        // This is to inherit the model capabilities from another built-in model
        // Can be anything that support all model capabilities
        models.anthropic.models[0]
      )
    } catch (error) {
      console.error(
        `Failed to extend model list for ${providerName} with model ${thread.model.id}:`,
        error
      )
    }
  }

  const engine = ExtensionManager.getInstance().getEngine(provider.provider)

  console.log('[sendCompletion] About to call API. Engine:', !!engine, 'Stream:', stream)
  console.log('[sendCompletion] Request details:', {
    model: thread.model?.id,
    provider: providerName,
    messagesCount: messages.length,
    firstMessage: messages[0],
    lastMessage: messages[messages.length - 1]
  })

  let completion
  try {
    if (engine) {
      console.log('[sendCompletion] Using engine.chat')
      completion = await engine.chat(
        {
          messages: messages as chatCompletionRequestMessage[],
          model: thread.model?.id,
          tools: normalizeTools(tools),
          tool_choice: tools.length ? 'auto' : undefined,
          stream: true,
          ...params,
        },
        abortController
      )
    } else if (stream) {
      console.log('[sendCompletion] Using tokenJS streaming API call')
      console.log('[sendCompletion] Request payload:', {
        stream: true,
        provider: providerName,
        model: thread.model?.id,
        messagesCount: messages.length,
        toolsCount: tools.length
      })

      try {
        completion = await tokenJS.chat.completions.create(
          {
            stream: true,
            provider: providerName as any,
            model: thread.model?.id,
            messages,
            tools: normalizeTools(tools),
            tool_choice: tools.length ? 'auto' : undefined,
            ...params,
          },
          {
            signal: abortController.signal,
          }
        )
        console.log('[sendCompletion] TokenJS returned:', {
          type: typeof completion,
          constructor: completion?.constructor?.name,
          isIterable: completion && typeof completion[Symbol.asyncIterator] === 'function'
        })
      } catch (error) {
        console.error('[sendCompletion] TokenJS create() threw error:', error)
        throw error
      }
    } else {
      console.log('[sendCompletion] Using tokenJS non-streaming API call')
      completion = await tokenJS.chat.completions.create({
        stream: false,
        provider: providerName,
        model: thread.model?.id,
        messages,
        tools: normalizeTools(tools),
        tool_choice: tools.length ? 'auto' : undefined,
        ...params,
      })
    }
    console.log('[sendCompletion] API call completed, received completion:', completion)
  } catch (error) {
    console.error('[sendCompletion] API call failed with error:', error)
    throw error
  }

  return completion
}

export const isCompletionResponse = (
  response: ChatCompletionResponse
): response is CompletionResponse | chatCompletion => {
  return 'choices' in response
}

/**
 * @fileoverview Helper function to stop a model.
 * This function unloads the model from the provider.
 * @param provider
 * @param model
 * @returns
 */
export const stopModel = async (
  provider: string,
  model: string
): Promise<void> => {
  const providerObj = EngineManager.instance().get(provider)
  const modelObj = ModelManager.instance().get(model)
  if (providerObj && modelObj) return providerObj?.unload(model).then(() => {})
}

/**
 * @fileoverview Helper function to normalize tools for the chat completion request.
 * This function converts the MCPTool objects to ChatCompletionTool objects.
 * @param tools
 * @returns
 */
export const normalizeTools = (
  tools: MCPTool[]
): ChatCompletionTool[] | Tool[] | undefined => {
  if (tools.length === 0) return undefined
  return tools.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description?.slice(0, 1024),
      parameters: tool.inputSchema,
      strict: false,
    },
  }))
}

/**
 * @fileoverview Helper function to extract tool calls from the completion response.
 * @param part
 * @param calls
 */
export const extractToolCall = (
  part: chatCompletionChunk | CompletionResponseChunk,
  currentCall: ChatCompletionMessageToolCall | null,
  calls: ChatCompletionMessageToolCall[]
) => {
  const deltaToolCalls = part.choices[0].delta.tool_calls
  // Handle the beginning of a new tool call
  if (deltaToolCalls?.[0]?.index !== undefined && deltaToolCalls[0]?.function) {
    const index = deltaToolCalls[0].index

    // Create new tool call if this is the first chunk for it
    if (!calls[index]) {
      calls[index] = {
        id: deltaToolCalls[0]?.id || ulid(),
        function: {
          name: deltaToolCalls[0]?.function?.name || '',
          arguments: deltaToolCalls[0]?.function?.arguments || '',
        },
        type: 'function',
      }
      currentCall = calls[index]
    } else {
      // Continuation of existing tool call
      currentCall = calls[index]

      // Append to function name or arguments if they exist in this chunk
      if (
        deltaToolCalls[0]?.function?.name &&
        currentCall!.function.name !== deltaToolCalls[0]?.function?.name
      ) {
        currentCall!.function.name += deltaToolCalls[0].function.name
      }

      if (deltaToolCalls[0]?.function?.arguments) {
        currentCall!.function.arguments += deltaToolCalls[0].function.arguments
      }
    }
  }
  return calls
}

/**
 * @fileoverview Helper function to process the completion response.
 * @param calls
 * @param builder
 * @param message
 * @param abortController
 * @param approvedTools
 * @param showModal
 * @param allowAllMCPPermissions
 */
export const postMessageProcessing = async (
  calls: ChatCompletionMessageToolCall[],
  builder: CompletionMessagesBuilder,
  message: ThreadMessage,
  abortController: AbortController,
  approvedTools: Record<string, string[]> = {},
  showModal?: (
    toolName: string,
    threadId: string,
    toolParameters?: object
  ) => Promise<boolean>,
  allowAllMCPPermissions: boolean = false
) => {
  // Handle completed tool calls
  if (calls.length) {
    for (const toolCall of calls) {
      if (abortController.signal.aborted) break
      const toolId = ulid()
      const toolCallsMetadata =
        message.metadata?.tool_calls &&
        Array.isArray(message.metadata?.tool_calls)
          ? message.metadata?.tool_calls
          : []
      message.metadata = {
        ...(message.metadata ?? {}),
        tool_calls: [
          ...toolCallsMetadata,
          {
            tool: {
              ...(toolCall as object),
              id: toolId,
            },
            response: undefined,
            state: 'pending',
          },
        ],
      }

      // Check if tool is approved or show modal for approval
      let toolParameters = {}
      if (toolCall.function.arguments.length) {
        try {
          toolParameters = JSON.parse(toolCall.function.arguments)
        } catch (error) {
          console.error('Failed to parse tool arguments:', error)
        }
      }
      const approved =
        allowAllMCPPermissions ||
        approvedTools[message.thread_id]?.includes(toolCall.function.name) ||
        (showModal
          ? await showModal(
              toolCall.function.name,
              message.thread_id,
              toolParameters
            )
          : true)

      const { promise, cancel } = callToolWithCancellation({
        toolName: toolCall.function.name,
        arguments: toolCall.function.arguments.length
          ? JSON.parse(toolCall.function.arguments)
          : {},
      })

      useAppState.getState().setCancelToolCall(cancel)

      let result = approved
        ? await promise.catch((e) => {
            console.error('Tool call failed:', e)
            return {
              content: [
                {
                  type: 'text',
                  text: `Error calling tool ${toolCall.function.name}: ${e.message ?? e}`,
                },
              ],
              error: true,
            }
          })
        : {
            content: [
              {
                type: 'text',
                text: 'The user has chosen to disallow the tool call.',
              },
            ],
          }

      if (typeof result === 'string') {
        result = {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        }
      }

      message.metadata = {
        ...(message.metadata ?? {}),
        tool_calls: [
          ...toolCallsMetadata,
          {
            tool: {
              ...toolCall,
              id: toolId,
            },
            response: result,
            state: 'ready',
          },
        ],
      }
      builder.addToolMessage(result.content[0]?.text ?? '', toolCall.id)
      // update message metadata
    }
    return message
  }
}
