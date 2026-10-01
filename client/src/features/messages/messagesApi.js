import { apiSlice } from '../../services/api/apiSlice.js'

export const messagesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMessages: builder.query({
      query: (chatId) => `/messages/${chatId}`,
      providesTags: (_, __, chatId) => [{ type: 'Messages', id: chatId }],
    }),
    sendMessage: builder.mutation({
      query: ({ chatId, content, attachments = [] }) => ({
        url: '/messages',
        method: 'POST',
        body: { chatId, content, attachments },
      }),
      invalidatesTags: (_, __, { chatId }) => [
        { type: 'Messages', id: chatId },
        { type: 'Chat', id: chatId },
        { type: 'ChatList', id: 'ACTIVE' },
      ],
    }),
  }),
})

export const { useGetMessagesQuery, useSendMessageMutation } = messagesApi