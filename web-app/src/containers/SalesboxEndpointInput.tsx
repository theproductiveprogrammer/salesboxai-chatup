import { Input } from '@/components/ui/input'
import { useSalesboxEndpoint } from '@/hooks/useSalesboxEndpoint'
import { useState, useEffect, useCallback } from 'react'

interface SalesboxEndpointInputProps {
  showError?: boolean
  onValidationChange?: (isValid: boolean) => void
}

export function SalesboxEndpointInput({
  showError = false,
  onValidationChange,
}: SalesboxEndpointInputProps) {
  const { endpoint, setEndpoint } = useSalesboxEndpoint()
  const [inputValue, setInputValue] = useState(endpoint)
  const [error, setError] = useState('')

  const validateEndpoint = useCallback(
    (value: string) => {
      if (!value || value.trim().length === 0) {
        setError('Endpoint is required')
        onValidationChange?.(false)
        return false
      }

      try {
        new URL(value)
        setError('')
        onValidationChange?.(true)
        return true
      } catch {
        setError(
          'Please enter a valid URL (e.g., https://agent-job.salesbox.ai)'
        )
        onValidationChange?.(false)
        return false
      }
    },
    [onValidationChange]
  )

  useEffect(() => {
    if (showError) {
      validateEndpoint(inputValue)
    }
  }, [showError, inputValue, validateEndpoint])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)

    // Clear error when user starts typing
    if (error && value.trim().length > 0) {
      setError('')
      onValidationChange?.(true)
    }
  }

  const handleBlur = () => {
    setEndpoint(inputValue)
    // Validate on blur if showError is true
    if (showError) {
      validateEndpoint(inputValue)
    }
  }

  const hasError = error && showError

  return (
    <div className="w-full">
      <Input
        type="text"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`w-full text-sm ${
          hasError
            ? 'border-1 border-destructive focus:border-destructive focus:ring-destructive'
            : ''
        }`}
        placeholder="https://agent-job.salesbox.ai"
      />
      {hasError && <p className="text-destructive text-xs mt-1">{error}</p>}
    </div>
  )
}
