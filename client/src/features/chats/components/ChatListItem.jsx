import { useEffect, useRef, useState } from 'react'
import { Archive, Check, MessageSquare, MoreHorizontal, Pencil, Pin, RotateCcw, Trash2, X } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  useDeleteChatMutation,
  useRenameChatMutation,
  useToggleArchiveChatMutation,
  useTogglePinChatMutation,
} from '../chatsApi.js'
import { getErrorMessage } from '../../../services/api/apiError.js'
import { ROUTES } from '../../../constants/routes.js'

const ChatListItem = ({ chat, archived = false, compact = false, onNavigate = () => { } }) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [title, setTitle] = useState(chat.title || '')
  const [error, setError] = useState('')
  const rootRef = useRef(null)
  const { chatId } = useParams()
  const navigate = useNavigate()
  const [renameChat, renameState] = useRenameChatMutation()
  const [togglePin, pinState] = useTogglePinChatMutation()
  const [toggleArchive, archiveState] = useToggleArchiveChatMutation()
  const [deleteChat, deleteState] = useDeleteChatMutation()
  const busy = renameState.isLoading || pinState.isLoading || archiveState.isLoading || deleteState.isLoading

  const runAction = async (action) => {
    setError('')
    try {
      await action()
      setMenuOpen(false)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  const saveTitle = async (event) => {
    event.preventDefault()
    const nextTitle = title.trim()
    if (!nextTitle || nextTitle.length > 100) return
    await runAction(() => renameChat({ chatId: chat._id, title: nextTitle }).unwrap())
    setRenaming(false)
  }

  const removeChat = () => {
    runAction(async () => {
      await deleteChat(chat._id).unwrap()
      if (chatId === chat._id) navigate(ROUTES.chats, { replace: true })
    })
  }

  useEffect(() => {
    if (!menuOpen) return undefined
    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setMenuOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [menuOpen])

  return (
    <div className="group relative mb-1" ref={rootRef}>
      {renaming ? (
        <form className="flex items-center gap-1 px-1 py-1" onSubmit={saveTitle}>
          <input aria-label="Conversation title" autoFocus className="min-w-0 flex-1 border border-white/20 bg-[#111310] px-2 py-2 text-xs text-[#f4f0e8] outline-none focus:border-[#d8f36a]" maxLength={100} onChange={(event) => setTitle(event.target.value)} value={title} />
          <button aria-label="Save title" className="text-[#d8f36a]" type="submit"><Check size={16} /></button>
          <button aria-label="Cancel rename" className="text-[#92958c]" onClick={() => { setTitle(chat.title || ''); setRenaming(false) }} type="button"><X size={16} /></button>
        </form>
      ) : (
        <div className={`flex items-center border-l-2 ${chatId === chat._id ? 'border-[#d8f36a] bg-white/5' : 'border-transparent hover:bg-white/4'}`}>
          <Link aria-current={chatId === chat._id ? 'page' : undefined} aria-label={chat.title || 'New Chat'} className={`flex min-w-0 flex-1 items-center truncate text-xs ${compact ? 'justify-center px-0 py-3' : 'px-3 py-3'} ${chatId === chat._id ? 'text-[#f4f0e8]' : 'text-[#92958c] hover:text-[#f4f0e8]'}`} onClick={() => { setMenuOpen(false); onNavigate() }} title={compact ? chat.title || 'New Chat' : undefined} to={`${ROUTES.chats}/${chat._id}`}>
            {compact ? <MessageSquare aria-hidden="true" size={15} /> : <span className="truncate">{chat.title || 'New Chat'}</span>}
          </Link>
          {!compact && <>
            {chat.isPinned && <Pin aria-label="Pinned" className="mr-1 shrink-0 text-[#d8f36a]" size={12} />}
            <button aria-expanded={menuOpen} aria-haspopup="menu" aria-label={`Actions for ${chat.title || 'conversation'}`} className="mr-1 shrink-0 p-2 text-[#777a72] hover:text-[#f4f0e8]" onClick={() => setMenuOpen((open) => !open)} title="Conversation actions" type="button"><MoreHorizontal size={16} /></button>
          </>}
        </div>
      )}
      {menuOpen && <div className="absolute right-1 top-9 z-10 w-36 border border-white/10 bg-[#22251f] py-0.5 text-[11px] shadow-xl" role="menu">
        {!archived && <button className="menu-action" disabled={busy} onClick={() => runAction(() => togglePin(chat._id).unwrap())}><Pin size={14} />{chat.isPinned ? 'Unpin' : 'Pin'}</button>}
        <button className="menu-action" disabled={busy} onClick={() => { setRenaming(true); setMenuOpen(false) }}><Pencil size={14} />Rename</button>
        <button className="menu-action" disabled={busy} onClick={() => runAction(() => toggleArchive(chat._id).unwrap())}>{archived ? <RotateCcw size={14} /> : <Archive size={14} />}{archived ? 'Restore' : 'Archive'}</button>
        <button className="menu-action text-[#f07865] hover:bg-[#f07865]/10" disabled={busy} onClick={removeChat}><Trash2 size={14} />Delete</button>
      </div>}
      {error && <p className="px-3 py-1 text-[10px] leading-4 text-[#f07865]">{error}</p>}
    </div>
  )
}

export default ChatListItem
