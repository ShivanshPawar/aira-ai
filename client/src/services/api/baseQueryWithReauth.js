import { fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { setAccessToken, setSignedOut } from '../../features/auth/authSlice.js'
import { normalizeApiError } from './apiError.js'

const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'
const publicEndpoints = new Set(['login', 'register', 'refreshSession', 'logout'])

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  credentials: 'include',
  prepareHeaders: (headers, { getState, endpoint }) => {
    const token = getState().auth.accessToken
    if (token && !publicEndpoints.has(endpoint)) {
      headers.set('authorization', `Bearer ${token}`)
    }
    return headers
  },
})

let refreshPromise

const refreshAccessToken = (api) => {
  if (!refreshPromise) {
    refreshPromise = rawBaseQuery({ url: '/auth/refresh', method: 'POST' }, api, {})
      .then((result) => {
        const token = result.data?.data?.accessToken
        if (token) api.dispatch(setAccessToken(token))
        else api.dispatch(setSignedOut())
        return token ? result : null
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

const unwrapEnvelope = (result) => {
  if (result.error) return { error: normalizeApiError(result.error) }
  if (result.data && typeof result.data === 'object' && 'success' in result.data) {
    return { ...result, data: result.data.data }
  }
  return result
}

export const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions)

  if (result.error?.status === 401 && !publicEndpoints.has(api.endpoint)) {
    const refreshResult = await refreshAccessToken(api)

    if (refreshResult) result = await rawBaseQuery(args, api, extraOptions)
    else api.dispatch(setSignedOut())
  }

  return unwrapEnvelope(result)
}