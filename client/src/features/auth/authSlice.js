import { createSlice } from '@reduxjs/toolkit'

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    accessToken: null,
    status: 'restoring',
  },
  reducers: {
    setAccessToken(state, action) {
      state.accessToken = action.payload
      state.status = 'authenticated'
    },
    setSignedOut(state) {
      state.accessToken = null
      state.status = 'signedOut'
    },
    setRestoreFailed(state) {
      state.accessToken = null
      state.status = 'restoreFailed'
    },
    setRestoring(state) {
      state.accessToken = null
      state.status = 'restoring'
    },
  },
})

export const { setAccessToken, setRestoreFailed, setSignedOut, setRestoring } = authSlice.actions
export default authSlice.reducer