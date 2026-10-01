import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice.js'
import chatUiReducer from '../features/chats/chatUiSlice.js'
import streamReducer from '../features/messages/streamSlice.js'
import { apiSlice } from '../services/api/apiSlice.js'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chatUi: chatUiReducer,
    messageStream: streamReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
})