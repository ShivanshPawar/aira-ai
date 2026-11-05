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
    <form className="space-y-3" onSubmit={submit}>
      <textarea
        aria-label="Edit message"
        autoFocus
        className="aira-scrollbar min-h-10 w-full resize-y border border-white/15 bg-[#111310] p-4 text-[15px] leading-7 text-[#f4f0e8] outline-none transition focus:border-[#d8f36a]"
        maxLength={10000}
        onChange={(event) => setContent(event.target.value)}
        value={content}
      />
      <div className="flex justify-end gap-2">
        <button aria-label="Cancel edit" className="grid size-10 place-items-center text-[#92958c] transition hover:bg-white/5 hover:text-[#f4f0e8] disabled:opacity-50" disabled={disabled} onClick={onCancel} title="Cancel edit" type="button"><X size={18} /></button>
        <button aria-label="Save and resend" className="grid size-10 place-items-center bg-[#d8f36a] text-[#171912] transition hover:bg-[#e5ff85] disabled:opacity-50" disabled={!canSave} title="Save and resend" type="submit"><Check size={18} /></button>
      </div>
    </form>
  )
}

export default MessageEditForm
