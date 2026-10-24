import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  chatId: null,
  prompt: '',
  attachments: [],
  content: '',
  status: 'idle',
}

const streamSlice = createSlice({
  name: 'messageStream',
  initialState,
  reducers: {
    startStream(state, action) {
      state.chatId = action.payload.chatId
      state.prompt = action.payload.content
      state.attachments = action.payload.attachments || []
      state.content = ''
      state.status = 'streaming'
    },
    startRetryStream(state, action) {
      state.chatId = action.payload.chatId
      state.prompt = ''
      state.attachments = []
      state.content = ''
      state.status = 'streaming'
    },
    appendStreamChunk(state, action) {
      if (state.chatId === action.payload.chatId && state.status === 'streaming') {
        state.content += action.payload.content
      }
    },
    clearStream(state, action) {
      if (!action.payload?.chatId || state.chatId === action.payload.chatId) {
        return initialState
      }
    },
  },
})

export const { startStream, startRetryStream, appendStreamChunk, clearStream } = streamSlice.actions
export default streamSlice.reducer