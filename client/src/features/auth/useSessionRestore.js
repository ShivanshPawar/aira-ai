import { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { authApi } from './authApi.js'
import { setRestoreFailed, setRestoring, setSignedOut } from './authSlice.js'

export const restoreSession = async (dispatch) => {
  dispatch(setRestoring())
  try {
    await dispatch(authApi.endpoints.refreshSession.initiate()).unwrap()
    await dispatch(authApi.endpoints.getCurrentUser.initiate(undefined, { forceRefetch: true })).unwrap()
  } catch (error) {
    dispatch(error?.status === 401 ? setSignedOut() : setRestoreFailed())
  }
}

export const useSessionRestore = () => {
  const dispatch = useDispatch()
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    restoreSession(dispatch)
  }, [dispatch])
}