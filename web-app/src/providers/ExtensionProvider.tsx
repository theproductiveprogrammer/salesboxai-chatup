import { ExtensionManager } from '@/lib/extension'
import { APIs } from '@/lib/service'
import { EventEmitter } from '@/services/events'
import { EngineManager, ModelManager } from '@janhq/core'
import { PropsWithChildren, useCallback, useEffect, useState } from 'react'

export function ExtensionProvider({ children }: PropsWithChildren) {
  const [finishedSetup, setFinishedSetup] = useState(false)
  const setupExtensions = useCallback(async () => {
    window.core = {
      api: APIs,
    }

    window.core.events = new EventEmitter()
    window.core.extensionManager = new ExtensionManager()
    window.core.engineManager = new EngineManager()
    window.core.modelManager = new ModelManager()

    // DISABLED: Don't load llamacpp or other extensions - we only use salesbox provider
    // await ExtensionManager.getInstance()
    //   .registerActive()
    //   .then(() => ExtensionManager.getInstance().load())
    //   .then(() => setFinishedSetup(true))

    // Just mark setup as finished immediately
    setFinishedSetup(true)
  }, [])

  useEffect(() => {
    setupExtensions()

    // DISABLED: No extensions to unload
    // return () => {
    //   ExtensionManager.getInstance().unload()
    // }
  }, [setupExtensions])

  return <>{finishedSetup && children}</>
}
