import { apiSlice } from '../../services/api/apiSlice.js'

export const filesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    uploadFile: builder.mutation({
      query: (file) => {
        const body = new FormData()
        body.append('file', file)
        return { url: '/files/upload', method: 'POST', body }
      },
      invalidatesTags: ['File'],
    }),
  }),
})

export const { useUploadFileMutation } = filesApi