import { useEffect, useRef, useState } from 'react'
import { ArrowUp, FileText, Paperclip, Square, X } from 'lucide-react'
import ModelPicker from '../../chats/components/ModelPicker.jsx'
import { useUploadFileMutation } from '../../files/filesApi.js'
import { validateAttachment } from '../../files/fileValidation.js'
import { getErrorMessage } from '../../../services/api/apiError.js'

const MessageComposer = ({ provider = 'GROQ', model, onModelChange, onSend, onStop, isStreaming = false, disabled = false, error = '' }) => {
  const [content, setContent] = useState('')
  const [attachments, setAttachments] = useState([])
  const [attachmentError, setAttachmentError] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadFile] = useUploadFileMutation()
  const inputRef = useRef(null)
  const canSend = content.trim().length > 0 && content.length <= 10000 && !disabled && !isStreaming && !isUploading
  const attachmentMode = provider === 'GEMINI' ? 'all' : 'none'
  const acceptsAttachments = attachmentMode !== 'none'
  const attachmentLimit = 10
  const attachmentAccept = 'image/*,.pdf,.csv,.log,.markdown,.md,.txt,.json,.xml,.yaml,.yml'
  const attachmentTitle = acceptsAttachments ? 'Attach files' : 'Choose Gemini to attach files'
  const composerMessage = error || attachmentError || (isUploading ? 'Uploading attachments...' : '')

  useEffect(() => {
    if (attachmentMode !== 'none' || !attachments.length) return
    setAttachments([])
    setAttachmentError('Attachments were removed because this model does not support them.')
  }, [attachmentMode, attachments.length])

  const handleFiles = async (event) => {
    const selectedFiles = Array.from(event.target.files || [])
    event.target.value = ''
    if (!selectedFiles.length) return

    const remaining = attachmentLimit - attachments.length
    const attachmentNoun = attachmentMode === 'images' ? 'images' : 'attachments'
    let firstError = selectedFiles.length > remaining ? `A message can have up to ${attachmentLimit} ${attachmentNoun}.` : ''
    if (remaining <= 0) {
      setAttachmentError(firstError || `A message can have up to ${attachmentLimit} ${attachmentNoun}.`)
      return
    }

    setAttachmentError('')
    setIsUploading(true)
    for (const file of selectedFiles.slice(0, remaining)) {
      const validationError = validateAttachment(file)
      if (validationError) {
        firstError ||= validationError
        continue
      }

      try {
        const uploadedFile = await uploadFile(file).unwrap()
        if (!uploadedFile?._id || uploadedFile.status !== 'READY') {
          firstError ||= `${file.name} did not finish uploading.`
          continue
        }
        setAttachments((current) => current.length < attachmentLimit && !current.some(({ _id }) => _id === uploadedFile._id)
          ? [...current, uploadedFile]
          : current)
      } catch (uploadError) {
        firstError ||= getErrorMessage(uploadError, `Could not upload ${file.name}.`)
      }
    }
    setIsUploading(false)
    setAttachmentError(firstError)
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!canSend) return
    const sentContent = content.trim()
    const succeeded = await onSend(sentContent, attachments)
    if (succeeded) {
      setContent('')
      setAttachments([])
      setAttachmentError('')
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  return (
    <div className="shrink-0 px-5 pb-5 pt-4 sm:px-8">
      <form className="mx-auto max-w-3xl" onSubmit={submit}>
        {attachments.length > 0 && <ul aria-label="Attachments" className="mb-2 flex flex-wrap gap-2">
          {attachments.map((file) => <li className="flex max-w-full items-center gap-2 border border-white/10 bg-[#191b17] px-2 py-1.5 text-xs text-[#cbc8bf]" key={file._id}>
            <FileText aria-hidden="true" className="shrink-0 text-[#d8f36a]" size={14} /><span className="max-w-48 truncate">{file.originalName || file.fileName}</span>
            <button aria-label={`Remove ${file.originalName || file.fileName}`} className="grid size-6 shrink-0 place-items-center text-[#92958c] hover:text-[#f07865]" disabled={isUploading || isStreaming} onClick={() => setAttachments((current) => current.filter(({ _id }) => _id !== file._id))} title="Remove attachment" type="button"><X size={14} /></button>
          </li>)}
        </ul>}
        {composerMessage && <p aria-live="polite" className={`mb-2 rounded-lg border px-3 py-2 text-xs leading-5 ${error || attachmentError ? 'border-[#f07865]/30 bg-[#f07865]/10 text-[#f5a89b]' : 'border-white/10 bg-white/5 text-[#92958c]'}`}>{composerMessage}</p>}
        <div className="flex items-end gap-3 border border-white/15 bg-[#191b17] p-3 focus-within:border-[#d8f36a]/70">
          <input ref={inputRef} accept={attachmentAccept} className="sr-only" disabled={!acceptsAttachments || isUploading || isStreaming} multiple onChange={handleFiles} type="file" />
          <button aria-label="Attach files" className="grid size-10 shrink-0 place-items-center text-[#92958c] hover:bg-white/5 hover:text-[#d8f36a] disabled:cursor-not-allowed disabled:opacity-40" disabled={!acceptsAttachments || disabled || isStreaming || isUploading || attachments.length >= attachmentLimit} onClick={() => inputRef.current?.click()} title={attachmentTitle} type="button"><Paperclip size={18} /></button>
          <textarea aria-label="Message" className="max-h-48 min-h-12 min-w-0 flex-1 resize-y bg-transparent px-1 py-2 text-[15px] leading-6 text-[#f4f0e8] outline-none placeholder:text-[#777a72] disabled:opacity-60" disabled={disabled || isStreaming} maxLength={10000} onChange={(event) => setContent(event.target.value)} onKeyDown={handleKeyDown} placeholder="Write a message..." value={content} />
          <ModelPicker disabled={disabled || isStreaming} onChange={onModelChange} value={model} />
          {isStreaming ? <button aria-label="Stop response" className="grid size-10 shrink-0 place-items-center bg-[#f07865] text-[#171310] transition hover:bg-[#ff9582]" onClick={onStop} title="Stop response" type="button"><Square size={15} fill="currentColor" /></button> : <button aria-label="Send message" className="grid size-10 shrink-0 place-items-center bg-[#d8f36a] text-[#111310] transition hover:bg-[#e5ff85] disabled:bg-white/10 disabled:text-[#777a72]" disabled={!canSend} title="Send message" type="submit"><ArrowUp size={18} /></button>}
        </div>
        <footer className="mt-2 text-center font-mono text-[10px] uppercase tracking-wider text-[#777a72]">© {new Date().getFullYear()} AIRA AI. All rights reserved.</footer>
      </form>
    </div>
  )
}

export default MessageComposer
