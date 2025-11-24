import { useState } from 'react'
import { Save, CheckCircle, XCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { setUnipileAccountId } from '@/services/unipile'
import { useSalesboxAuth } from '@/hooks/useSalesboxAuth'

export function UnipileAccountIdInput() {
  const { isAuthenticated } = useSalesboxAuth()
  const [accountId, setAccountId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSave = async () => {
    if (!accountId.trim()) {
      setStatus('error')
      setMessage('Please enter a Linkedin Account ID')
      return
    }

    setIsLoading(true)
    setStatus('idle')
    setMessage('')

    try {
      const response = await setUnipileAccountId(accountId.trim())

      if (response.success) {
        setStatus('success')
        setMessage(response.message || 'Account ID saved successfully')
        // Clear input after successful save
        setTimeout(() => {
          setAccountId('')
          setStatus('idle')
          setMessage('')
        }, 3000)
      } else {
        setStatus('error')
        setMessage(response.error || 'Failed to save Account ID')
      }
    } catch (error) {
      setStatus('error')
      setMessage(
        error instanceof Error ? error.message : 'Failed to save Account ID'
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="text-sm text-main-view-fg/70">
        Please sign in to configure Linkedin Account ID
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex gap-2">
        <Input
          type="text"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="flex-1 text-sm"
          placeholder="Enter your Linkedin Account ID"
          disabled={isLoading}
        />
        <Button
          onClick={handleSave}
          size="sm"
          disabled={isLoading || !accountId.trim()}
        >
          <Save size={16} />
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
      </div>

      {status !== 'idle' && message && (
        <div
          className={`flex items-center gap-2 text-sm ${
            status === 'success' ? 'text-green-600' : 'text-destructive'
          }`}
        >
          {status === 'success' ? (
            <CheckCircle size={14} />
          ) : (
            <XCircle size={14} />
          )}
          <span>{message}</span>
        </div>
      )}
    </div>
  )
}
