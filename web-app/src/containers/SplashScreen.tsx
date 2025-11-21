import { useState } from 'react'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useSalesboxAuth } from '@/hooks/useSalesboxAuth'
import { useSalesboxEndpoint } from '@/hooks/useSalesboxEndpoint'

interface SplashScreenProps {
	onSuccess?: () => void
}

export function SplashScreen({ onSuccess }: SplashScreenProps) {
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const { login, isLoading, error: authError } = useSalesboxAuth()
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

			// Call success callback if provided
			onSuccess?.()
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary via-primary to-primary animate-in fade-in duration-500">
			<div className="w-full max-w-6xl mx-auto px-8 py-12">
				<div className="grid md:grid-cols-2 gap-12 items-center">
					{/* Left side - Branding and Image */}
					<div className="flex flex-col items-center md:items-start space-y-8 text-center md:text-left">
						<div className="space-y-4">
							<h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
								Welcome to your<br />
								<span className="text-accent">SalesboxAI</span> Assistant
							</h1>
							<p className="text-2xl md:text-3xl text-white/90 font-medium">
								Let's get Prospecting
							</p>
						</div>

						{/* Assistant Image */}
						<div className="w-full max-w-md mx-auto md:mx-0 animate-in slide-in-from-left duration-700">
							<img
								src="/images/splash.png"
								alt="SalesboxAI Assistant"
								className="w-full h-auto drop-shadow-2xl"
							/>
						</div>
					</div>

					{/* Right side - Login Form */}
					<div className="flex items-center justify-center animate-in slide-in-from-right duration-700">
						<div className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
							<div className="mb-6">
								<h2 className="text-2xl font-bold text-primary mb-2">Sign In</h2>
								<p className="text-main-view-fg/70">
									Enter your credentials to get started
								</p>
							</div>

							<form onSubmit={handleSubmit} className="space-y-5">
								<div className="space-y-2">
									<label htmlFor="endpoint" className="text-sm font-medium text-main-view-fg">
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
									<label htmlFor="username" className="text-sm font-medium text-main-view-fg">
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
									<label htmlFor="password" className="text-sm font-medium text-main-view-fg">
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

								<Button
									type="submit"
									disabled={isLoading || !username.trim() || !password.trim()}
									className="w-full h-12 text-base"
								>
									{isLoading ? (
										<>
											<span className="animate-spin mr-2">⏳</span>
											Signing in...
										</>
									) : (
										<>
											<LogIn size={18} className="mr-2" />
											Sign In
										</>
									)}
								</Button>
							</form>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
