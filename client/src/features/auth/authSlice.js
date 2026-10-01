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
    setRestoring(state) {
      state.accessToken = null
      state.status = 'restoring'
    },
  },
})

export const { setAccessToken, setSignedOut, setRestoring } = authSlice.actions
export default authSlice.reducer