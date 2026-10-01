import { useEffect, useRef, useState } from 'react'
import { Check, Copy, FileText } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash'
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css'
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript'
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json'
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python'
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

SyntaxHighlighter.registerLanguage('bash', bash)
SyntaxHighlighter.registerLanguage('css', css)
SyntaxHighlighter.registerLanguage('javascript', javascript)
SyntaxHighlighter.registerLanguage('json', json)
SyntaxHighlighter.registerLanguage('python', python)
SyntaxHighlighter.registerLanguage('typescript', typescript)

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
    <div className="relative my-3 min-w-0 max-w-full overflow-hidden">
      <button aria-label={copied ? 'Code copied' : 'Copy code'} className="absolute right-2 top-2 z-10 grid size-8 place-items-center bg-[#30342b] text-[#d7d9ce] hover:bg-[#41463a] hover:text-white" onClick={copyCode} title={copied ? 'Copied' : 'Copy code'} type="button">
        {copied ? <Check size={15} /> : <Copy size={15} />}
      </button>
      <SyntaxHighlighter customStyle={{ maxWidth: '100%', margin: 0, overflowX: 'hidden', overflowWrap: 'anywhere', padding: '2.8rem 1rem 1rem', whiteSpace: 'pre-wrap', fontSize: '13px', lineHeight: 1.6 }} language={language} style={oneDark} PreTag="div" wrapLongLines>
        {code}
      </SyntaxHighlighter>
    </div>
  )
}

const Markdown = ({ content }) => (
  <ReactMarkdown
    components={{
      code({ className, children, ...props }) {
        const language = /language-(\w+)/.exec(className || '')?.[1]
        if (language) {
          return <CodeBlock code={String(children).replace(/\n$/, '')} language={language} />
        }
        return <code className="message-inline-code rounded-sm bg-white/10 px-1 py-0.5 font-mono text-[0.92em] text-[#d8f36a]" {...props}>{children}</code>
      },
      a({ children, ...props }) {
        return <a className="text-[#70b9ed] underline underline-offset-4" rel="noreferrer" target="_blank" {...props}>{children}</a>
      },
    }}
  >
    {content}
  </ReactMarkdown>
)

const AttachmentList = ({ attachments = [] }) => attachments.length > 0 && (
  <ul aria-label="Message attachments" className="mt-3 flex flex-wrap gap-2">
    {attachments.map((file) => <li key={file._id || file.url}>
      <a className="flex max-w-64 items-center gap-2 border border-white/10 bg-[#191b17] px-2 py-1.5 text-xs text-[#cbc8bf] hover:border-[#70b9ed]/50 hover:text-white" href={file.url || undefined} rel="noreferrer" target={file.url ? '_blank' : undefined}>
        <FileText aria-hidden="true" className="shrink-0 text-[#d8f36a]" size={14} /><span className="truncate">{file.originalName || file.fileName || 'Attachment'}</span>
      </a>
    </li>)}
  </ul>
)

const MessageTimeline = ({ messages, isLoading, isStreaming = false, streamingPrompt = '', streamingAttachments = [], streamingText = '' }) => {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
  }, [messages, streamingText, isStreaming])

  if (isLoading) return <div className="grid flex-1 place-items-center text-sm text-[#92958c]">Loading conversation...</div>

  return (
    <div className="message-scroll-region scrollbar-hidden min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-5 py-8 sm:px-8">
      <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-9">
        {messages.length === 0 && <div className="py-16 text-center"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#d8f36a]">A fresh page</p><p className="mt-3 text-2xl font-semibold text-[#f4f0e8]">Start wherever your mind is.</p></div>}
        {messages.map((message) => {
          const isUser = message.role === 'USER'
          return <article className={`flex w-full min-w-0 ${isUser ? 'justify-end' : 'justify-start'}`} key={message._id}>
            <div className={`min-w-0 max-w-[min(100%,680px)] ${isUser ? 'border border-white/10 bg-[#1c1e1a] px-4 py-3' : 'w-full'}`}>
              <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.16em] text-[#777a72]">{isUser ? 'You' : 'Aira'}{message.status && message.status !== 'COMPLETED' && <span className="ml-2 text-[#f07865]">{message.status.toLowerCase()}</span>}</div>
              <div className="message-markdown min-w-0 max-w-full wrap-break-word text-[15px] leading-7 text-[#e8e5dc]">
                {message.content ? <Markdown content={message.content} /> : <span className="text-[#777a72]">No response text.</span>}
              </div>
              <AttachmentList attachments={message.attachments} />
              {message.metadata?.error?.message && <p className="mt-3 border-l-2 border-[#f07865] pl-3 text-xs leading-5 text-[#f5a89b]">{message.metadata.error.message}</p>}
            </div>
          </article>
        })}
        {isStreaming && streamingPrompt && <article className="flex w-full min-w-0 justify-end">
          <div className="min-w-0 max-w-[min(100%,680px)] border border-white/10 bg-[#1c1e1a] px-4 py-3">
            <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.16em] text-[#777a72]">You</div>
            <div className="whitespace-pre-wrap text-sm leading-7 text-[#e8e5dc]">{streamingPrompt}</div>
            <AttachmentList attachments={streamingAttachments} />
          </div>
        </article>}
        {isStreaming && <article aria-live="polite" className="flex w-full min-w-0 justify-start">
          <div className="w-full min-w-0">
            <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.16em] text-[#d8f36a]">Aira / responding</div>
            <div className="message-markdown min-w-0 max-w-full wrap-break-word text-[15px] leading-7 text-[#e8e5dc]">{streamingText ? <Markdown content={streamingText} /> : <span className="text-[#777a72]">Thinking...</span>}</div>
          </div>
        </article>}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

export default MessageTimeline