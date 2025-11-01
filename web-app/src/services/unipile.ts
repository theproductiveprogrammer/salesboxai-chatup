import { callSalesboxApi } from './salesboxApi'

export interface SetUnipileAccountIdRequest {
  unipileAccountId: string
}

export interface SetUnipileAccountIdResponse {
  success: boolean
  message?: string
  error?: string
}

export async function setUnipileAccountId(
  accountId: string
): Promise<SetUnipileAccountIdResponse> {
  const response = await callSalesboxApi<SetUnipileAccountIdResponse>(
    '/mcp/set-unipile-account-id',
    {
      method: 'POST',
      body: JSON.stringify({ unipileAccountId: accountId }),
    }
  )

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data || { success: false, error: 'Unknown error' }
}
