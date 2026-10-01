import { apiSlice } from '../../services/api/apiSlice.js'

export const healthApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getHealth: builder.query({
      query: () => '/health',
      providesTags: ['Health'],
    }),
  }),
})

export const { useGetHealthQuery } = healthApi