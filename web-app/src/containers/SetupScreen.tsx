import { Card } from './Card'
import { useModelProvider } from '@/hooks/useModelProvider'
import { Link } from '@tanstack/react-router'
import { route } from '@/constants/routes'
import HeaderPage from './HeaderPage'
import { isProd } from '@/lib/version'
import { useTranslation } from '@/i18n/react-i18next-compat'
import { localStorageKey } from '@/constants/localStorage'
import { useEffect, useState } from 'react'

interface SetupScreenProps {
	onProceed?: () => void
}

function SetupScreen({ onProceed }: SetupScreenProps) {
	const { t } = useTranslation()
	const { providers } = useModelProvider()
	const [isVisible, setIsVisible] = useState(false)
	const firstItemRemoteProvider =
		providers.length > 0 ? providers[1].provider : 'openai'

	// Check if setup tour has been completed
	const isSetupCompleted =
		localStorage.getItem(localStorageKey.setupCompleted) === 'true'

	// Conditional to check if there are any valid providers
	const hasValidProviders = providers.some(
		(provider) =>
			provider.api_key?.length ||
			(provider.provider === 'llamacpp' && provider.models.length)
	)

	// Add entrance animation
	useEffect(() => {
		const timer = setTimeout(() => setIsVisible(true), 100)
		return () => clearTimeout(timer)
	}, [])

	return (
		<div className="flex h-full flex-col relative overflow-hidden">
			{/* Subtle background pattern */}
			<div className="absolute inset-0 opacity-5">
				<div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400"></div>
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px]"></div>
			</div>

			<HeaderPage></HeaderPage>
			<div className="relative z-10 h-full px-8 overflow-y-auto flex flex-col gap-8 justify-center">
				<div
					className={`w-full max-w-3xl mx-auto text-center transition-all duration-1000 ease-out ${
						isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
					}`}
				>
					{/* App Icon with subtle animation */}
					<div className="mb-12 flex justify-center">
						<div className="relative group">
							<img
								src="/salesbox-logo-icon.svg"
								alt="SalesboxAI Agent"
								className="w-16 h-16 md:w-20 md:h-20 drop-shadow-lg transition-all duration-500"
							/>
							{/* Subtle glow effect */}
							<div className="absolute inset-0 w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-xl opacity-50 animate-pulse"></div>
						</div>
					</div>

					{/* Welcome Message */}
					<div className="mb-16">
						<h1 className="text-3xl md:text-4xl mb-6 font-bold bg-gradient-to-r from-main-view-fg to-main-view-fg/80 bg-clip-text text-transparent">
							{t('setup:welcome')}
						</h1>
						<p className="text-main-view-fg/70 text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed">
							{hasValidProviders
								? t('setup:descriptionConfigured')
								: t('setup:description')}
						</p>
					</div>

					{/* Proceed Button (if has valid providers and onProceed is provided) */}
					{hasValidProviders && onProceed && (
						<div className="mb-12">
							<button
								onClick={onProceed}
								className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-10 py-4 rounded-xl font-semibold transition-all duration-300 text-xl shadow-lg hover:shadow-xl transform cursor-pointer"
							>
								🚀 Continue to Chat
							</button>
							<p className="text-main-view-fg/50 text-sm mt-3">
								Click to start chatting with your AI assistant
							</p>
						</div>
					)}

					{/* Setup Options */}
					<div className="space-y-4">
						<h3 className="text-main-view-fg/60 text-lg mb-6 font-medium">
							{hasValidProviders
								? 'Or configure additional options:'
								: 'Get started by configuring:'}
						</h3>
						<div className="flex gap-6 flex-col md:flex-row justify-center">
							<Card
								header={
									<Link
										to={route.hub.index}
										search={{
											...(!isProd ? { step: 'setup_local_provider' } : {}),
										}}
									>
										<div className="p-6 text-center hover:bg-main-view-fg/5 transition-all duration-300 rounded-lg group hover:scale-105">
											<div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
												🖥️
											</div>
											<h1 className="text-main-view-fg font-semibold text-lg">
												{t('setup:localModel')}
											</h1>
											<p className="text-main-view-fg/60 text-sm mt-2">
												Download and run AI models locally
											</p>
										</div>
									</Link>
								}
							></Card>
							<Card
								header={
									<Link
										to={route.settings.providers}
										params={{
											providerName: firstItemRemoteProvider,
										}}
										search={{
											...(!isSetupCompleted
												? { step: 'setup_remote_provider' }
												: {}),
										}}
									>
										<div className="p-6 text-center hover:bg-main-view-fg/5 transition-all duration-300 rounded-lg group hover:scale-105">
											<div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
												☁️
											</div>
											<h1 className="text-main-view-fg font-semibold text-lg">
												{t('setup:remoteProvider')}
											</h1>
											<p className="text-main-view-fg/60 text-sm mt-2">
												Connect to cloud AI services
											</p>
										</div>
									</Link>
								}
							></Card>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default SetupScreen
