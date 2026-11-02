import { createSlice } from '@reduxjs/toolkit'

const defaults = {
  GROQ: 'openai/gpt-oss-20b',
  GEMINI: 'gemini-3.6-flash',
}

const chatUiSlice = createSlice({
  name: 'chatUi',
  initialState: {
    provider: 'GROQ',
    model: defaults.GROQ,
  },
  reducers: {
    setProvider(state, action) {
      state.provider = action.payload
      state.model = defaults[action.payload]
    },
    setModel(state, action) {
      state.model = action.payload
    },
  },
})

export const { setProvider, setModel } = chatUiSlice.actions
export const modelDefaults = defaults
export default chatUiSlice.reducer
