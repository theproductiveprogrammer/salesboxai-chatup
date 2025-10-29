import { useEffect, useState } from 'react'
import { useModelSources } from './useModelSources'
import { useModelProvider } from './useModelProvider'
import { useDownloadStore } from './useDownloadStore'
import { pullModelWithMetadata } from '@/services/models'

const DEFAULT_MODEL_NAME = 'jan-nano-gguf'
const AUTO_DOWNLOAD_KEY = 'auto-download-attempted'

export function useAutoDownloadDefaultModel() {
	const { sources, fetchSources, loading: sourcesLoading } = useModelSources()
	const { providers } = useModelProvider()
	const { downloads } = useDownloadStore()
	const [isAutoDownloading, setIsAutoDownloading] = useState(false)
	const [autoDownloadComplete, setAutoDownloadComplete] = useState(false)

	// Check if user has any models ready
	const hasValidProviders = providers.some(
		(provider) =>
			provider.api_key?.length ||
			(provider.provider === 'llamacpp' && provider.models.length)
	)

	// Check if we've already successfully downloaded a model
	// Only skip if we have valid providers OR if we've completed a download
	const hasAttemptedDownload =
		localStorage.getItem(AUTO_DOWNLOAD_KEY) === 'true'

	useEffect(() => {
		console.log('🔍 Auto-download hook check:', {
			hasValidProviders,
			hasAttemptedDownload,
			isAutoDownloading,
			autoDownloadComplete,
			sourcesLoading,
			sourcesCount: sources.length,
		})

		// Don't auto-download if:
		// 1. Already have valid providers (models or API keys)
		// 2. Currently downloading
		// 3. Sources still loading
		// 4. Already completed auto-download in this session
		if (
			hasValidProviders ||
			isAutoDownloading ||
			sourcesLoading ||
			autoDownloadComplete
		) {
			console.log('⏭️  Skipping auto-download:', {
				hasValidProviders,
				isAutoDownloading,
				sourcesLoading,
				autoDownloadComplete,
			})
			return
		}

		// If we attempted before but don't have models, clear the flag and retry
		if (hasAttemptedDownload && !hasValidProviders) {
			console.log('🔄 Previous download attempt found but no models exist. Clearing flag and retrying...')
			localStorage.removeItem(AUTO_DOWNLOAD_KEY)
		}

		// Fetch sources if not loaded
		if (!sources.length) {
			console.log('📥 Fetching model sources...')
			fetchSources()
			return
		}

		// Check if Jan-Nano is already being downloaded
		const downloadsArray = Object.values(downloads)
		const existingDownload = downloadsArray.find((d) =>
			d.name.toLowerCase().includes(DEFAULT_MODEL_NAME)
		)

		if (existingDownload) {
			console.log('📦 Jan-Nano download already in progress, resuming...', {
				name: existingDownload.name,
				progress: existingDownload.progress,
			})
			// Mark as auto-downloading so we show progress screen
			setIsAutoDownloading(true)
			return
		}

		// Find Jan-Nano model in catalog
		const janNanoModel = sources.find((model) =>
			model.model_name?.toLowerCase().includes(DEFAULT_MODEL_NAME)
		)

		if (!janNanoModel) {
			console.warn('❌ Jan-Nano model not found in catalog. Available models:', sources.map(m => m.model_name))
			return
		}

		console.log('✅ Found Jan-Nano model:', janNanoModel.model_name)

		// Find the recommended quantization (q4_k_m preferred, or first available)
		const recommendedQuant =
			janNanoModel.quants.find((q) => q.model_id.includes('q4_k_m')) ||
			janNanoModel.quants[0]

		if (!recommendedQuant) {
			console.warn('❌ No quantization found for Jan-Nano')
			return
		}

		console.log('🎯 Selected quantization:', recommendedQuant.model_id)

		// Mark download as attempted (so we don't retry on refresh)
		localStorage.setItem(AUTO_DOWNLOAD_KEY, 'true')
		setIsAutoDownloading(true)

		console.log('🚀 Starting auto-download of Jan-Nano model:', recommendedQuant.model_id)

		// Start the download
		pullModelWithMetadata(
			recommendedQuant.model_id,
			recommendedQuant.path,
			janNanoModel.mmproj_models?.[0]?.path
		)
	}, [
		sources,
		downloads,
		fetchSources,
		hasValidProviders,
		hasAttemptedDownload,
		isAutoDownloading,
		autoDownloadComplete,
		sourcesLoading,
	])

	// Monitor download progress and completion
	useEffect(() => {
		if (!isAutoDownloading) return

		// Convert downloads object to array and find our download
		const downloadsArray = Object.values(downloads)
		console.log('📊 Checking downloads:', {
			downloadsCount: downloadsArray.length,
			downloadNames: downloadsArray.map((d) => d.name),
			hasValidProviders,
		})

		const janNanoDownload = downloadsArray.find((d) =>
			d.name.toLowerCase().includes(DEFAULT_MODEL_NAME)
		)

		if (janNanoDownload) {
			const calculatedProgress =
				janNanoDownload.total > 0
					? Math.round((janNanoDownload.current / janNanoDownload.total) * 100)
					: 0

			console.log('📦 Jan-Nano download found:', {
				name: janNanoDownload.name,
				current: janNanoDownload.current,
				total: janNanoDownload.total,
				calculatedProgress: calculatedProgress,
			})

			// If download completed (progress = 100%)
			if (calculatedProgress >= 100 && !autoDownloadComplete) {
				console.log('✅ Jan-Nano download complete!')
				setAutoDownloadComplete(true)
				setIsAutoDownloading(false)
			}
		} else {
			// Download not found in downloads list
			// This could mean: (1) download completed and was removed, or (2) download failed
			// Check if we now have valid providers (model registered)
			if (hasValidProviders && !autoDownloadComplete) {
				console.log('✅ Download complete - model is now available!')
				setAutoDownloadComplete(true)
				setIsAutoDownloading(false)
			}
		}
	}, [downloads, isAutoDownloading, autoDownloadComplete, hasValidProviders])

	return {
		isAutoDownloading,
		autoDownloadComplete,
		hasValidProviders,
	}
}
