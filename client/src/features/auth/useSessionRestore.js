import { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { authApi } from './authApi.js'
import { setSignedOut } from './authSlice.js'

export const useSessionRestore = () => {
  const dispatch = useDispatch()
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    const restore = async () => {
      try {
        await dispatch(authApi.endpoints.refreshSession.initiate()).unwrap()
        await dispatch(authApi.endpoints.getCurrentUser.initiate(undefined, { forceRefetch: true })).unwrap()
      } catch {
        dispatch(setSignedOut())
      }
    }

    restore()
  }, [dispatch])
}