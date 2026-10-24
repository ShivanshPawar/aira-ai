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
    editMessage: builder.mutation({
      query: ({ messageId, content, attachments = [] }) => ({
        url: `/messages/${messageId}`,
        method: 'PUT',
        body: { content, attachments },
      }),
      invalidatesTags: (_, __, { chatId }) => [
        { type: 'Messages', id: chatId },
        { type: 'Chat', id: chatId },
        { type: 'ChatList', id: 'ACTIVE' },
      ],
    }),
    regenerateMessage: builder.mutation({
      query: ({ messageId }) => ({ url: `/messages/${messageId}/regenerate`, method: 'POST' }),
      invalidatesTags: (_, __, { messageId, chatId }) => [
        { type: 'Messages', id: chatId },
        { type: 'Chat', id: chatId },
        { type: 'ChatList', id: 'ACTIVE' },
        { type: 'Message', id: messageId },
      ],
    }),
    deleteMessage: builder.mutation({
      query: ({ messageId }) => ({ url: `/messages/${messageId}`, method: 'DELETE' }),
      invalidatesTags: (_, __, { messageId, chatId }) => [
        { type: 'Messages', id: chatId },
        { type: 'Chat', id: chatId },
        { type: 'ChatList', id: 'ACTIVE' },
        { type: 'Message', id: messageId },
      ],
    }),
  }),
})

export const {
  useGetMessagesQuery,
  useSendMessageMutation,
  useEditMessageMutation,
  useRegenerateMessageMutation,
  useDeleteMessageMutation,
} = messagesApi