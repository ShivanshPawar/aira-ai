export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (!error) return fallback
  if (typeof error === 'string') return error
  return error.data?.message || error.message || fallback
}

export const normalizeApiError = (error) => {
  if (typeof error.status !== 'number') return error

  return {
    ...error,
    data: {
      message: error.data?.message || 'The request could not be completed.',
      errors: error.data?.errors || null,
    },
  }
}