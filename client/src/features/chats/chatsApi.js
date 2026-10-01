import { apiSlice } from '../../services/api/apiSlice.js'

export const chatsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getChats: builder.query({
      query: (params = {}) => ({ url: '/chats', params: { page: 1, limit: 30, ...params } }),
      providesTags: (result) => [
        { type: 'ChatList', id: 'ACTIVE' },
        ...(result?.items || []).map(({ _id }) => ({ type: 'Chat', id: _id })),
      ],
    }),
    getChat: builder.query({
      query: (chatId) => `/chats/${chatId}`,
      providesTags: (_, __, chatId) => [{ type: 'Chat', id: chatId }],
    }),
    getArchivedChats: builder.query({
      query: (params = {}) => ({ url: '/chats/archived', params: { page: 1, limit: 30, ...params } }),
      providesTags: (result) => [
        { type: 'ChatList', id: 'ARCHIVED' },
        ...(result?.items || []).map(({ _id }) => ({ type: 'Chat', id: _id })),
      ],
    }),
    createChat: builder.mutation({
      query: (body = {}) => ({ url: '/chats', method: 'POST', body }),
      invalidatesTags: [{ type: 'ChatList', id: 'ACTIVE' }],
    }),
    updateChat: builder.mutation({
      query: ({ chatId, ...body }) => ({ url: `/chats/${chatId}`, method: 'PATCH', body }),
      invalidatesTags: (_, __, { chatId }) => [
        { type: 'ChatList', id: 'ACTIVE' },
        { type: 'ChatList', id: 'ARCHIVED' },
        { type: 'Chat', id: chatId },
      ],
    }),
    renameChat: builder.mutation({
      query: ({ chatId, title }) => ({ url: `/chats/${chatId}/rename`, method: 'PATCH', body: { title } }),
      invalidatesTags: (_, __, { chatId }) => [
        { type: 'ChatList', id: 'ACTIVE' },
        { type: 'ChatList', id: 'ARCHIVED' },
        { type: 'Chat', id: chatId },
      ],
    }),
    togglePinChat: builder.mutation({
      query: (chatId) => ({ url: `/chats/${chatId}/pin`, method: 'PATCH' }),
      invalidatesTags: (_, __, chatId) => [{ type: 'ChatList', id: 'ACTIVE' }, { type: 'Chat', id: chatId }],
    }),
    toggleArchiveChat: builder.mutation({
      query: (chatId) => ({ url: `/chats/${chatId}/archive`, method: 'PATCH' }),
      invalidatesTags: (_, __, chatId) => [
        { type: 'ChatList', id: 'ACTIVE' },
        { type: 'ChatList', id: 'ARCHIVED' },
        { type: 'Chat', id: chatId },
      ],
    }),
    deleteChat: builder.mutation({
      query: (chatId) => ({ url: `/chats/${chatId}`, method: 'DELETE' }),
      invalidatesTags: (_, __, chatId) => [
        { type: 'ChatList', id: 'ACTIVE' },
        { type: 'ChatList', id: 'ARCHIVED' },
        { type: 'Chat', id: chatId },
      ],
    }),
  }),
})

export const {
  useGetChatsQuery,
  useGetChatQuery,
  useGetArchivedChatsQuery,
  useCreateChatMutation,
  useUpdateChatMutation,
  useRenameChatMutation,
  useTogglePinChatMutation,
  useToggleArchiveChatMutation,
  useDeleteChatMutation,
} = chatsApi