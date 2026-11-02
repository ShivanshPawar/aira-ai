import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Check, Copy, FileText, Pencil, RotateCcw, RotateCw, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import MessageEditForm from './MessageEditForm.jsx'
const CodeHighlighter = lazy(() => import('./CodeHighlighter.jsx'))

const CodeBlock = ({ language, code }) => {
  const [copied, setCopied] = useState(false)

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="relative my-4 min-w-0 max-w-full overflow-hidden border border-white/10 bg-[#161815] shadow-[0_12px_30px_rgb(0_0_0/18%)]">
      <div className="flex h-10 items-center justify-between border-b border-white/10 bg-[#20231e] pl-3 pr-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#a9aca3]">{language || 'Code'}</span>
        <button aria-label={copied ? 'Code copied' : 'Copy code'} className="flex h-7 items-center gap-1.5 px-2 text-[11px] text-[#d7d9ce] transition hover:bg-white/10 hover:text-white" onClick={copyCode} title={copied ? 'Copied' : 'Copy code'} type="button">
        {copied ? <Check size={15} /> : <Copy size={15} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <Suspense fallback={<pre className="overflow-x-auto p-4 font-mono text-[13px] leading-6 text-[#d7d9ce]"><code>{code}</code></pre>}>
        <CodeHighlighter code={code} language={language} />
      </Suspense>
    </div>
  )
}

const normalizeMarkdownTables = (content) => content.split('\n').map((line) => (
  /\|\s*:?-{3,}:?\s*\|/.test(line) ? line.replace(/\|\|/g, '|\n|') : line
)).join('\n')

const Markdown = ({ content }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      code({ className, children, ...props }) {
        const language = /language-(\w+)/.exec(className || '')?.[1]
        const content = String(children).replace(/\n$/, '')
        if (language || String(children).includes('\n')) {
          return <CodeBlock code={content} language={language} />
        }
        return <code className="message-inline-code bg-white/10 px-1 py-0.5 font-mono text-[0.92em] text-[#d8f36a]" {...props}>{children}</code>
      },
      a({ children, ...props }) {
        return <a className="text-[#70b9ed] underline underline-offset-4" rel="noreferrer" target="_blank" {...props}>{children}</a>
      },
    }}
  >
    {normalizeMarkdownTables(content)}
  </ReactMarkdown>
)

const useStreamedText = (text) => {
  const [displayedText, setDisplayedText] = useState('')
  const displayedTextRef = useRef('')
  const targetTextRef = useRef('')
  const animationFrameRef = useRef(null)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false)

  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mediaQuery) return undefined
    const updatePreference = () => setReducedMotion(mediaQuery.matches)
    mediaQuery.addEventListener('change', updatePreference)
    return () => mediaQuery.removeEventListener('change', updatePreference)
  }, [])

  useEffect(() => {
    targetTextRef.current = text
    if (reducedMotion) {
      displayedTextRef.current = text
      setDisplayedText(text)
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
      return undefined
    }

    if (!text.startsWith(displayedTextRef.current)) {
      displayedTextRef.current = ''
      setDisplayedText('')
    }

    const reveal = () => {
      animationFrameRef.current = null
      const target = targetTextRef.current
      const visible = displayedTextRef.current
      const remaining = target.length - visible.length
      if (remaining <= 0) return

      const step = Math.min(remaining, Math.max(1, Math.ceil(remaining / 16)))
      const nextText = visible + target.slice(visible.length, visible.length + step)
      displayedTextRef.current = nextText
      setDisplayedText(nextText)
      animationFrameRef.current = requestAnimationFrame(reveal)
    }

    if (!animationFrameRef.current && text.length > displayedTextRef.current.length) {
      animationFrameRef.current = requestAnimationFrame(reveal)
    }
    return undefined
  }, [reducedMotion, text])

  useEffect(() => () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
  }, [])

  return displayedText
}

const AttachmentList = ({ attachments = [] }) => attachments.length > 0 && (
  <ul aria-label="Message attachments" className="mt-3 flex flex-wrap gap-2">
    {attachments.map((file) => <li key={file._id || file.url}>
      <a className="flex max-w-64 items-center gap-2 border border-white/10 bg-[#191b17] px-2 py-1.5 text-xs text-[#cbc8bf] hover:border-[#70b9ed]/50 hover:text-white" href={file.url || undefined} rel="noreferrer" target={file.url ? '_blank' : undefined}>
        <FileText aria-hidden="true" className="shrink-0 text-[#d8f36a]" size={14} /><span className="truncate">{file.originalName || file.fileName || 'Attachment'}</span>
      </a>
    </li>)}
  </ul>
)

const MessageTimeline = ({ messages, isLoading, isStreaming = false, streamingPrompt = '', streamingAttachments = [], streamingText = '', actionError = '', onEditMessage, onRegenerate, onRetry, onDelete }) => {
  const scrollRegionRef = useRef(null)
  const shouldFollowStreamRef = useRef(true)
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [copiedMessageId, setCopiedMessageId] = useState(null)
  const copyTimeoutRef = useRef(null)
  const actionsUnavailable = Boolean(editingMessageId)
  const displayedStreamingText = useStreamedText(streamingText)

  useLayoutEffect(() => {
    const scrollRegion = scrollRegionRef.current
    if (scrollRegion && shouldFollowStreamRef.current) scrollRegion.scrollTop = scrollRegion.scrollHeight
  }, [displayedStreamingText, isStreaming, messages])

  const trackScrollPosition = () => {
    const scrollRegion = scrollRegionRef.current
    if (!scrollRegion) return
    shouldFollowStreamRef.current = scrollRegion.scrollHeight - scrollRegion.scrollTop - scrollRegion.clientHeight < 96
  }

  useEffect(() => () => window.clearTimeout(copyTimeoutRef.current), [])

  const copyMessage = async (messageId, content) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessageId(messageId)
      window.clearTimeout(copyTimeoutRef.current)
      copyTimeoutRef.current = window.setTimeout(() => setCopiedMessageId(null), 1400)
    } catch {
      const fallback = document.createElement('textarea')
      fallback.value = content
      fallback.setAttribute('readonly', '')
      fallback.style.cssText = 'position:fixed;opacity:0;pointer-events:none'
      document.body.appendChild(fallback)
      fallback.select()
      const copied = document.execCommand('copy')
      fallback.remove()
      if (!copied) return
      setCopiedMessageId(messageId)
      window.clearTimeout(copyTimeoutRef.current)
      copyTimeoutRef.current = window.setTimeout(() => setCopiedMessageId(null), 1400)
    }
  }

  if (isLoading) return <div className="grid flex-1 place-items-center text-sm text-[#92958c]">Loading conversation...</div>

  return (
    <div className="message-scroll-region scrollbar-hidden min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-5 py-8 sm:px-8" onScroll={trackScrollPosition} ref={scrollRegionRef}>
      <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-9">
        {actionError && <p aria-live="polite" className="border-l-2 border-[#f07865] bg-[#f07865]/10 px-3 py-2 text-sm leading-6 text-[#f5a89b]">{actionError}</p>}
        {messages.length === 0 && <div className="py-16 text-center"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#d8f36a]">Let's go buddy</p><p className="mt-3 text-2xl font-semibold text-[#f4f0e8]">Start wherever your mind is.</p></div>}
        {messages.map((message, index) => {
          const isUser = message.role === 'USER'
          const isLatest = index === messages.length - 1
          const canRegenerate = isLatest && message.role === 'ASSISTANT' && message.status === 'COMPLETED'
          const canRetry = isLatest && message.role === 'ASSISTANT' && ['FAILED', 'CANCELLED'].includes(message.status)
          const isEditing = editingMessageId === message._id

          return <article className={`group flex w-full min-w-0 flex-col ${isUser ? 'items-end' : 'items-start'}`} key={message._id}>
            <div className={`min-w-0 ${isUser ? `${isEditing ? 'w-full max-w-none' : 'max-w-[min(100%,680px)]'} border border-white/10 bg-[#1c1e1a] px-4 py-3` : 'w-full max-w-none bg-[#191b17]/35 px-4 py-4 sm:px-5'}`}>
              {!isUser && <div className="mb-3 font-mono text-[9px] uppercase tracking-[0.16em] text-[#9fa39a]">Aira{message.status && message.status !== 'COMPLETED' && <span className="ml-2 text-[#f07865]">{message.status.toLowerCase()}</span>}</div>}
              {isEditing ? <MessageEditForm disabled={isStreaming} message={message} onCancel={() => setEditingMessageId(null)} onSave={onEditMessage} /> : <div className="message-markdown min-w-0 max-w-full wrap-break-word text-[15px] leading-7 text-[#e8e5dc]">
                {message.content?.trim() && <Markdown content={message.content} />}
              </div>}
              <AttachmentList attachments={message.attachments} />
              {message.metadata?.error?.message && <p className="mt-3 border-l-2 border-[#f07865] pl-3 text-xs leading-5 text-[#f5a89b]">{message.metadata.error.message}</p>}
            </div>
            {!isEditing && <div className={`mt-1 flex items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 ${isUser ? 'justify-end' : 'justify-start'}`}>
              <button aria-label={copiedMessageId === message._id ? 'Message copied' : `Copy ${isUser ? 'message' : 'response'}`} className="grid size-8 place-items-center text-[#92958c] hover:bg-white/5 hover:text-[#f4f0e8] disabled:opacity-40" disabled={!message.content} onClick={() => copyMessage(message._id, message.content)} title={copiedMessageId === message._id ? 'Copied' : 'Copy'} type="button">{copiedMessageId === message._id ? <Check size={15} /> : <Copy size={15} />}</button>
              {isUser && <button aria-label="Edit and resend message" className="grid size-8 cursor-pointer place-items-center text-[#92958c] hover:bg-white/5 hover:text-[#f4f0e8] disabled:opacity-40" disabled={actionsUnavailable} onClick={() => setEditingMessageId(message._id)} title="Edit and resend" type="button"><Pencil size={15} /></button>}
              {canRegenerate && <button aria-label="Regenerate response" className="grid size-8 cursor-pointer place-items-center text-[#92958c] hover:bg-white/5 hover:text-[#f4f0e8] disabled:opacity-40" disabled={actionsUnavailable} onClick={() => onRegenerate(message._id)} title="Regenerate response" type="button"><RotateCw size={15} /></button>}
              {canRetry && <button aria-label="Retry response" className="grid size-8 cursor-pointer place-items-center text-[#92958c] hover:bg-white/5 hover:text-[#f4f0e8] disabled:opacity-40" disabled={actionsUnavailable} onClick={() => onRetry(message._id)} title="Retry response" type="button"><RotateCcw size={15} /></button>}
              <button aria-label={`Delete ${isUser ? 'message' : 'response'}`} className="grid size-8 cursor-pointer place-items-center text-[#92958c] hover:bg-[#f07865]/10 hover:text-[#f07865] disabled:opacity-40" disabled={actionsUnavailable} onClick={() => onDelete(message._id)} title="Delete message" type="button"><Trash2 size={15} /></button>
            </div>}
          </article>
        })}
        {isStreaming && streamingPrompt && <article className="flex w-full min-w-0 justify-end">
          <div className="min-w-0 max-w-[min(100%,680px)] border border-white/10 bg-[#1c1e1a] px-4 py-3">
            <div className="whitespace-pre-wrap text-sm leading-7 text-[#e8e5dc]">{streamingPrompt}</div>
            <AttachmentList attachments={streamingAttachments} />
          </div>
        </article>}
        {isStreaming && <article className="flex w-full min-w-0 justify-start">
          <div className="w-full min-w-0 bg-[#191b17]/35 px-4 py-4 sm:px-5">
            <div className="message-markdown min-w-0 max-w-full wrap-break-word text-[15px] leading-7 text-[#e8e5dc]">{displayedStreamingText ? <Markdown content={displayedStreamingText} /> : <span aria-label="Aira is thinking" className="inline-flex items-center gap-1 text-[#92958c]"><span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.2s]" /><span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.1s]" /><span className="size-1.5 animate-bounce rounded-full bg-current" /></span>}</div>
          </div>
        </article>}
      </div>
    </div>
  )
}

export default MessageTimeline
