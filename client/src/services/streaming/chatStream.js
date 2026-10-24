import { parseSseFrame } from '../../utils/parseSseFrame.js'

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '')

const createRequest = (path, body, accessToken, signal) => fetch(`${apiBaseUrl}${path}`, {
  method: 'POST',
  credentials: 'include',
  headers: {
    accept: 'text/event-stream',
    authorization: `Bearer ${accessToken}`,
    'content-type': 'application/json',
  },
  body: body ? JSON.stringify(body) : undefined,
  signal,
})

const getResponseError = async (response) => {
  let body
  try {
    body = await response.json()
  } catch {
    body = null
  }

  if (response.status === 409) {
    return 'Another message action is running in this conversation. Wait for it to finish and try again.'
  }

  return body?.message || body?.data?.message || `The response could not be started (${response.status}).`
}

const consumeMessageStream = async ({ path, body, accessToken, signal, refreshAccessToken, onChunk }) => {
  let response = await createRequest(path, body, accessToken, signal)

  if (response.status === 401 && refreshAccessToken) {
    const refreshedToken = await refreshAccessToken()
    if (!refreshedToken) throw new Error('Your session has expired. Sign in again.')
    response = await createRequest(path, body, refreshedToken, signal)
  }

  if (!response.ok) throw new Error(await getResponseError(response))
  if (!response.body) throw new Error('The response stream is unavailable. Please try again.')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let completed = false

  const consumeFrame = (frame) => {
    const event = parseSseFrame(frame)
    if (!event) return

    if (event.type === 'chunk') onChunk(event.content || '')
    if (event.type === 'done') completed = true
    if (event.type === 'error') throw new Error(event.message || 'The assistant could not complete this response.')
  }

  while (true) {
    const { value, done } = await reader.read()
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done })

    let separator = buffer.search(/\r?\n\r?\n/)
    while (separator !== -1) {
      const frame = buffer.slice(0, separator)
      const separatorLength = buffer.slice(separator).match(/^\r?\n\r?\n/)[0].length
      buffer = buffer.slice(separator + separatorLength)
      consumeFrame(frame)
      separator = buffer.search(/\r?\n\r?\n/)
    }

    if (done) break
  }

  if (buffer.trim()) consumeFrame(buffer)
  if (!completed) throw new Error('The response ended before it was complete. Try again.')
}

export const streamChatMessage = ({ chatId, content, attachments = [], ...options }) => consumeMessageStream({
  ...options,
  path: '/messages/stream',
  body: { chatId, content, attachments },
})

export const retryChatMessage = ({ messageId, ...options }) => consumeMessageStream({
  ...options,
  path: `/messages/${messageId}/retry/stream`,
})