import { useState } from 'react'
import { Check, X } from 'lucide-react'

const MessageEditForm = ({ message, disabled = false, onCancel, onSave }) => {
  const [content, setContent] = useState(message.content || '')
  const canSave = content.trim().length > 0 && content.length <= 10000 && !disabled

  const submit = async (event) => {
    event.preventDefault()
    if (!canSave) return
    const attachments = (message.attachments || [])
      .map((file) => typeof file === 'string' ? file : file._id)
      .filter(Boolean)
    const saved = await onSave({
      messageId: message._id,
      content: content.trim(),
      attachments,
    })

    if (saved) onCancel()
  }

  return (
    <form className="space-y-2" onSubmit={submit}>
      <textarea
        aria-label="Edit message"
        autoFocus
        className="min-h-28 w-full resize-y border border-white/20 bg-[#111310] p-3 text-sm leading-6 text-[#f4f0e8] outline-none focus:border-[#d8f36a]"
        maxLength={10000}
        onChange={(event) => setContent(event.target.value)}
        value={content}
      />
      <p className="text-xs leading-5 text-[#f5a89b]">Saving removes all later messages in this conversation.</p>
      <div className="flex justify-end gap-2">
        <button className="flex h-9 items-center gap-1.5 px-3 text-xs text-[#92958c] hover:text-[#f4f0e8]" disabled={disabled} onClick={onCancel} type="button"><X size={14} />Cancel</button>
        <button className="flex h-9 items-center gap-1.5 bg-[#d8f36a] px-3 text-xs font-semibold text-[#171912] disabled:opacity-50" disabled={!canSave} type="submit"><Check size={14} />Save and resend</button>
      </div>
    </form>
  )
}

export default MessageEditForm