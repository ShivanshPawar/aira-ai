import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RefreshCw } from 'lucide-react'
import { restoreSession } from '../features/auth/useSessionRestore.js'

const SessionRestoreFailure = () => {
  const dispatch = useDispatch()
  const status = useSelector((state) => state.auth.status)
  const [retrying, setRetrying] = useState(false)

  const retryRestore = async () => {
    setRetrying(true)
    await restoreSession(dispatch)
    setRetrying(false)
  }

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <section aria-live="polite" className="max-w-sm text-center">
        <h1 className="text-lg font-semibold">Couldn't restore your session</h1>
        <p className="mt-2 text-sm leading-6 text-[#92958c]">Check your connection and try again. Your saved sign-in session has not been cleared.</p>
        <button className="mt-5 inline-flex h-10 items-center gap-2 border border-[#d8f36a] bg-[#d8f36a] px-4 text-sm font-semibold text-[#171912] transition hover:bg-[#e5ff85] disabled:cursor-wait disabled:opacity-60" disabled={retrying || status === 'restoring'} onClick={retryRestore} type="button">
          <RefreshCw aria-hidden="true" className={retrying ? 'animate-spin' : ''} size={15} />
          {retrying ? 'Retrying...' : 'Retry'}
        </button>
      </section>
    </main>
  )
}

export default SessionRestoreFailure
