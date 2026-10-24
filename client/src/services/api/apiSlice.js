import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from './baseQueryWithReauth.js'

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['CurrentUser', 'ChatList', 'Chat', 'Messages', 'Message', 'File', 'Health'],
  endpoints: () => ({}),
})