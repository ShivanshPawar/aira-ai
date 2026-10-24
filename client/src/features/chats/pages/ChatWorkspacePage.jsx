import { ArrowUpRight, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useCreateChatMutation, useGetChatQuery } from '../chatsApi.js'
import { ROUTES } from '../../../constants/routes.js'
import {
  useDeleteMessageMutation,
  useEditMessageMutation,
  useGetMessagesQuery,
  useRegenerateMessageMutation,
} from '../../messages/messagesApi.js'
import MessageTimeline from '../../messages/components/MessageTimeline.jsx'
import MessageComposer from '../../messages/components/MessageComposer.jsx'
import { useChatStream } from '../../messages/hooks/useChatStream.js'
import { getErrorMessage } from '../../../services/api/apiError.js'

const ChatWorkspacePage = () => {
  const { chatId } = useParams()
  const navigate = useNavigate()
  const { provider, model } = useSelector((state) => state.chatUi)
  const { data: chat, isLoading, isError } = useGetChatQuery(chatId, { skip: !chatId })
  const { data: messages = [], isLoading: messagesLoading } = useGetMessagesQuery(chatId, { skip: !chatId })
  const [createChat, { isLoading: isCreating }] = useCreateChatMutation()
  const [editMessage, editState] = useEditMessageMutation()
  const [regenerateMessage, regenerateState] = useRegenerateMessageMutation()
  const [deleteMessage, deleteState] = useDeleteMessageMutation()
  const [messageActionError, setMessageActionError] = useState('')
  const chatStream = useChatStream(chatId)
  const actionsDisabled = editState.isLoading || regenerateState.isLoading || deleteState.isLoading || chatStream.isStreaming

  const createConversation = async () => {
    const result = await createChat({ provider, model }).unwrap()
    navigate(`${ROUTES.chats}/${result._id}`)
  }

  const submitMessage = (content, attachments) => chatStream.start(content, attachments)

  const runMessageAction = async (request, fallback) => {
    setMessageActionError('')
    try {
      await request.unwrap()
      return true
    } catch (error) {
      setMessageActionError(getErrorMessage(error, fallback))
      return false
    }
  }

  const handleEditMessage = (message) => runMessageAction(
    editMessage({ chatId, ...message }),
    'Could not edit that message.',
  )

  const handleRegenerateMessage = (messageId) => runMessageAction(
    regenerateMessage({ chatId, messageId }),
    'Could not regenerate that response.',
  )

  const handleDeleteMessage = (messageId) => runMessageAction(
    deleteMessage({ chatId, messageId }),
    'Could not delete that message.',
  )

  const handleRetryMessage = (messageId) => {
    setMessageActionError('')
    return chatStream.retry(messageId)
  }

  if (chatId && isLoading) return <div className="grid flex-1 place-items-center text-sm text-[#92958c]">Opening conversation...</div>
  if (chatId && (isError || !chat)) return <div className="grid flex-1 place-items-center text-sm text-[#f07865]">This conversation is unavailable.</div>

  if (chat) return <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
    <MessageTimeline
      actionError={messageActionError || chatStream.error}
      actionsDisabled={actionsDisabled}
      isLoading={messagesLoading}
      isStreaming={chatStream.isStreaming}
      messages={messages}
      onDelete={handleDeleteMessage}
      onEditMessage={handleEditMessage}
      onRegenerate={handleRegenerateMessage}
      onRetry={handleRetryMessage}
      streamingAttachments={chatStream.streamingAttachments}
      streamingPrompt={chatStream.streamingPrompt}
      streamingText={chatStream.streamingText}
    />
    <MessageComposer disabled={chatStream.isStreaming} error={chatStream.error} isStreaming={chatStream.isStreaming} onSend={submitMessage} onStop={chatStream.stop} provider={chat.provider} />
  </div>

  return (
    <section className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-6 py-12 text-center">
      <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-linear-to-r from-transparent via-[#d8f36a]/30 to-transparent" />
      <div className="mb-7 grid size-14 place-items-center border border-[#d8f36a]/30 text-[#d8f36a]"><Sparkles size={22} strokeWidth={1.5} /></div>
      <p className="mb-8 font-mono text-xs uppercase tracking-[0.2em] text-(--color-lime)">Your thinking space</p>
      <h1 className="max-w-2xl text-4xl font-semibold leading-tight text-[#f4f0e8] sm:text-5xl">
        {chat ? chat.title : "Hey buddy, what's in your mind?"}
      </h1>
      <p className="mt-4 max-w-md text-sm leading-6 text-[#92958c]">
        {chat ? 'Your conversation is ready. The message workspace is arriving in the next build iteration.' : 'Ask a question, follow a thought, or share a fresh idea.'}
      </p>
      {!chat && <button className="mt-9 flex h-12 items-center gap-3 bg-[#d8f36a] px-5 text-sm font-bold text-[#171912] transition hover:bg-[#e5ff85] disabled:opacity-60" disabled={isCreating} onClick={createConversation}><Sparkles aria-hidden="true" size={17} />{isCreating ? 'Opening a new space...' : 'Start  conversation'}<ArrowUpRight size={16} /></button>}
    </section>
  )
}

export default ChatWorkspacePage