import { useState } from 'react'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useSalesboxAuth } from '@/hooks/useSalesboxAuth'
import { useSalesboxEndpoint } from '@/hooks/useSalesboxEndpoint'

interface LoginDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onSuccess?: () => void
}

export function LoginDialog({
	open,
	onOpenChange,
	onSuccess,
}: LoginDialogProps) {
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const { login, isLoading, error: authError, clearError } = useSalesboxAuth()
	const { endpoint, setEndpoint } = useSalesboxEndpoint()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!username.trim() || !password.trim()) {
			return
		}

		const success = await login(username, password)

		if (success) {
			// Clear form
			setUsername('')
			setPassword('')
			setShowPassword(false)

			// Close dialog
			onOpenChange(false)

			// Call success callback if provided
			onSuccess?.()
		}
	}

	const handleOpenChange = (newOpen: boolean) => {
		if (!newOpen) {
			// Clear error when closing
			clearError()
			// Clear form
			setUsername('')
			setPassword('')
			setShowPassword(false)
		}
		onOpenChange(newOpen)
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-[425px]" showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>Sign In to SalesboxAI</DialogTitle>
					<DialogDescription>
						Enter your credentials to access the platform
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<label htmlFor="endpoint" className="text-sm font-medium">
							API Endpoint
						</label>
						<Input
							id="endpoint"
							type="text"
							value={endpoint}
							onChange={(e) => setEndpoint(e.target.value)}
							placeholder="https://agent.salesbox.ai"
							disabled={isLoading}
							className="font-mono text-sm"
						/>
						<p className="text-xs text-main-view-fg/50">
							Use http://localhost:6625/core for local development
						</p>
					</div>

					<div className="space-y-2">
						<label htmlFor="username" className="text-sm font-medium">
							Username
						</label>
						<Input
							id="username"
							type="text"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder="Enter your username or email"
							disabled={isLoading}
							autoComplete="username"
							autoFocus
						/>
					</div>

					<div className="space-y-2">
						<label htmlFor="password" className="text-sm font-medium">
							Password
						</label>
						<div className="relative w-full">
							<Input
								id="password"
								type={showPassword ? 'text' : 'password'}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Enter your password"
								disabled={isLoading}
								autoComplete="current-password"
								className="pr-10"
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-main-view-fg/5 text-main-view-fg/70"
								disabled={isLoading}
								tabIndex={-1}
							>
								{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
							</button>
						</div>
					</div>

					{authError && (
						<div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md p-3">
							{authError}
						</div>
					)}

					<DialogFooter>
						<Button
							type="submit"
							disabled={isLoading || !username.trim() || !password.trim()}
							className="w-full"
						>
							{isLoading ? (
								<>
									<span className="animate-spin mr-2">⏳</span>
									Signing in...
								</>
							) : (
								<>
									<LogIn size={16} />
									Sign In
								</>
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
