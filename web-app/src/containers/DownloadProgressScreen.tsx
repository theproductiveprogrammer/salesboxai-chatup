import { useDownloadStore } from '@/hooks/useDownloadStore'
import { Progress } from '@/components/ui/progress'
import { Loader } from 'lucide-react'
import { useEffect, useState } from 'react'

interface DownloadProgressScreenProps {
  modelName?: string
}

export function DownloadProgressScreen({
  modelName = 'Jan-Nano',
}: DownloadProgressScreenProps) {
  const { downloads } = useDownloadStore()
  const [isVisible, setIsVisible] = useState(false)

  // Convert downloads object to array and find the active download
  const activeDownload = Object.values(downloads).find((d) =>
    d.name.toLowerCase().includes('jan-nano')
  )

  // Calculate progress percentage
  // If activeDownload.progress exists, it might be in 0-1 range, so convert to 0-100
  // Otherwise calculate from current/total
  // If no download found, it might have completed - show 100%
  const progress = activeDownload
    ? activeDownload.total > 0
      ? Math.round((activeDownload.current / activeDownload.total) * 100)
      : 0
    : 100 // Download completed and removed from list

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

      <div className="relative z-10 h-full px-8 overflow-y-auto flex flex-col gap-8 justify-center">
        <div
          className={`w-full max-w-2xl mx-auto text-center transition-all duration-1000 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* App Icon with animation */}
          <div className="mb-12 flex justify-center">
            <div className="relative group">
              <img
                src="/salesbox-logo-icon.svg"
                alt="SalesboxAI"
                className="w-20 h-20 drop-shadow-lg animate-pulse"
              />
              {/* Glow effect */}
              <div className="absolute inset-0 w-20 h-20 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-full blur-xl"></div>
            </div>
          </div>

          {/* Title */}
          <div className="mb-12">
            <h1 className="text-3xl md:text-4xl mb-4 font-bold bg-gradient-to-r from-main-view-fg to-main-view-fg/80 bg-clip-text text-transparent">
              Setting Up Your AI Assistant
            </h1>
            <p className="text-main-view-fg/70 text-lg max-w-lg mx-auto">
              We're downloading{' '}
              <span className="font-semibold">{modelName}</span> for you. This
              will take a few minutes depending on the speed of your internet
              connection...
            </p>
          </div>

          {/* Progress Section */}
          <div className="space-y-6 bg-main-view-fg/5 p-8 rounded-2xl backdrop-blur-sm">
            {/* Spinner */}
            <div className="flex justify-center">
              <Loader className="w-12 h-12 animate-spin text-blue-500" />
            </div>

            {/* Progress Bar */}
            <div className="space-y-3">
              <Progress value={progress} className="h-3" />
              <div className="flex justify-between text-sm text-main-view-fg/60">
                <span>
                  {progress >= 100
                    ? 'Finalizing installation...'
                    : 'Downloading model...'}
                </span>
                <span className="font-mono">{progress}%</span>
              </div>
            </div>

            {/* Download Stats */}
            {activeDownload && (
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-main-view-fg/10">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">
                    {(activeDownload.current / 1024 / 1024 / 1024).toFixed(2)}
                    <span className="text-sm text-main-view-fg/60 ml-1">
                      GB
                    </span>
                  </div>
                  <div className="text-xs text-main-view-fg/50 mt-1">
                    Downloaded
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-500">
                    {(activeDownload.total / 1024 / 1024 / 1024).toFixed(2)}
                    <span className="text-sm text-main-view-fg/60 ml-1">
                      GB
                    </span>
                  </div>
                  <div className="text-xs text-main-view-fg/50 mt-1">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-500">
                    {activeDownload && progress < 100 ? '⚡' : '✅'}
                  </div>
                  <div className="text-xs text-main-view-fg/50 mt-1">
                    {activeDownload && progress < 100
                      ? 'Downloading'
                      : 'Complete'}
                  </div>
                </div>
              </div>
            )}

            {/* Fun fact or tip */}
            <div className="pt-6 border-t border-main-view-fg/10">
              <p className="text-sm text-main-view-fg/60 italic">
                💡 Tip: {modelName} is optimized for function calling and tool
                integration, perfect for your SalesboxAI workflows!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
