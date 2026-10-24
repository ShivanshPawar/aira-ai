import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { apiSlice } from '../../../services/api/apiSlice.js'
import { retryChatMessage, streamChatMessage } from '../../../services/streaming/chatStream.js'
import { authApi } from '../../auth/authApi.js'
import { startStream, startRetryStream, appendStreamChunk, clearStream } from '../streamSlice.js'
import { messagesApi } from '../messagesApi.js'

export const useChatStream = (chatId) => {
  const dispatch = useDispatch()
  const accessToken = useSelector((state) => state.auth.accessToken)
  const stream = useSelector((state) => state.messageStream)
  const controllerRef = useRef(null)
  const [error, setError] = useState('')
  const isStreaming = stream.status === 'streaming' && stream.chatId === chatId

  useEffect(() => {
    setError('')
    return () => controllerRef.current?.abort()
  }, [chatId])

  const runStream = (startAction, send) => {
    if (!chatId || !accessToken || controllerRef.current) return false

    setError('')
    const controller = new AbortController()
    controllerRef.current = controller
    dispatch(startAction)

    const reconcile = async () => {
      dispatch(apiSlice.util.invalidateTags([
        { type: 'Messages', id: chatId },
        { type: 'Chat', id: chatId },
        { type: 'ChatList', id: 'ACTIVE' },
      ]))

      try {
        await dispatch(messagesApi.endpoints.getMessages.initiate(chatId, { forceRefetch: true })).unwrap()
      } catch {
        // The query exposes reconciliation failures in its own state.
      }
    }

    const run = async () => {
      try {
        await send({
          accessToken,
          signal: controller.signal,
          refreshAccessToken: async () => {
            const session = await dispatch(authApi.endpoints.refreshSession.initiate()).unwrap()
            return session.accessToken
          },
          onChunk: (chunk) => dispatch(appendStreamChunk({ chatId, content: chunk })),
        })
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(requestError.message || 'The response could not be completed. Please try again.')
        }
      } finally {
        controllerRef.current = null
        await reconcile()
        dispatch(clearStream({ chatId }))
      }
    }

    run()
    return true
  }

  const start = (content, attachments = []) => runStream(
    startStream({ chatId, content, attachments }),
    (options) => streamChatMessage({
      ...options,
      chatId,
      content,
      attachments: attachments.map(({ _id }) => _id),
    }),
  )

  const retry = (messageId) => runStream(
    startRetryStream({ chatId }),
    (options) => retryChatMessage({ ...options, messageId }),
  )

  const stop = () => controllerRef.current?.abort()

  return {
    start,
    retry,
    stop,
    isStreaming,
    streamingPrompt: isStreaming ? stream.prompt : '',
    streamingAttachments: isStreaming ? stream.attachments : [],
    streamingText: isStreaming ? stream.content : '',
    error,
  }
}