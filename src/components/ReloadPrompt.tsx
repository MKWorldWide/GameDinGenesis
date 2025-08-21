import React from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // eslint-disable-next-line prefer-template
      console.log('SW Registered: ' + r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  if (offlineReady || needRefresh) {
    return (
      <div className="fixed right-0 bottom-0 m-4 p-4 rounded-md shadow-lg bg-secondary border border-primary z-50 animate-fade-in">
        <div className="flex items-start gap-4">
            <div className="flex-1">
                { offlineReady && <p className="text-sm text-primary">App ready to work offline.</p> }
                { needRefresh && <p className="text-sm text-primary">New content available, click on reload button to update.</p> }
            </div>
            <div className="flex gap-2">
                { needRefresh && <button className="px-3 py-1 text-xs font-semibold rounded-md bg-accent text-on-accent hover:bg-accent-hover transition-colors" onClick={() => updateServiceWorker(true)}>Reload</button> }
                <button className="px-3 py-1 text-xs font-semibold rounded-md bg-tertiary text-primary hover:bg-border-primary transition-colors" onClick={() => close()}>Close</button>
            </div>
        </div>
      </div>
    )
  }

  return null
}

export default ReloadPrompt
