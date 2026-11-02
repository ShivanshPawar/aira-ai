import { apiSlice } from '../../services/api/apiSlice.js'
import { setAccessToken, setSignedOut } from './authSlice.js'

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(setAccessToken(data.accessToken))
        } catch {
          // The mutation result exposes its error to the form.
        }
      },
    }),
    register: builder.mutation({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(setAccessToken(data.accessToken))
        } catch {
          // The mutation result exposes its error to the form.
        }
      },
    }),
    refreshSession: builder.mutation({
      query: () => ({ url: '/auth/refresh', method: 'POST' }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(setAccessToken(data.accessToken))
        } catch {
          dispatch(setSignedOut())
        }
      },
    }),
    logout: builder.mutation({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
        } finally {
          dispatch(setSignedOut())
          dispatch(apiSlice.util.resetApiState())
        }
      },
    }),
    getCurrentUser: builder.query({
      query: () => '/users/me',
      providesTags: ['CurrentUser'],
    }),
    updateProfile: builder.mutation({
      query: (body) => ({ url: '/users/me', method: 'PATCH', body }),
      invalidatesTags: ['CurrentUser'],
    }),
    changePassword: builder.mutation({
      query: (body) => ({ url: '/users/me/password', method: 'PATCH', body }),
    }),
  }),
})

export const {
  useLoginMutation,
  useRegisterMutation,
  useRefreshSessionMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} = authApi
