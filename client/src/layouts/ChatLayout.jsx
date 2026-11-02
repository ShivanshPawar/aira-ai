import { useEffect, useRef, useState } from 'react'
import { Archive, Menu, MessageSquarePlus, PanelLeft, Search, Settings2, X } from 'lucide-react'
import { Link, Outlet, useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useGetChatsQuery, useCreateChatMutation } from '../features/chats/chatsApi.js'
import { useGetCurrentUserQuery } from '../features/auth/authApi.js'
import ChatListItem from '../features/chats/components/ChatListItem.jsx'
import { getErrorMessage } from '../services/api/apiError.js'
import { ROUTES } from '../constants/routes.js'

const ChatLayout = () => {
  const [search, setSearch] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const searchInputRef = useRef(null)
  const { provider, model } = useSelector((state) => state.chatUi)
  const { data: user } = useGetCurrentUserQuery()
  const { chatId } = useParams()
  const { data, isLoading, error } = useGetChatsQuery({ page, limit: 30, search: searchTerm || undefined })
  const [createChat, createState] = useCreateChatMutation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [actionError, setActionError] = useState('')
  const touchStartRef = useRef(null)
  const navigate = useNavigate()
  const chats = data?.items || []
  const sidebarCollapsed = !sidebarExpanded && !sidebarOpen

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1)
      setSearchTerm(search.trim())
    }, 250)
    return () => window.clearTimeout(timer)
  }, [search])

  const startChat = async () => {
    setActionError('')
    try {
      const chat = await createChat({ provider, model }).unwrap()
      navigate(`${ROUTES.chats}/${chat._id}`)
      setSidebarOpen(false)
    } catch (requestError) {
      setActionError(getErrorMessage(requestError, 'Could not create a conversation.'))
    }
  }

  const trackDrawerSwipe = (event) => {
    const touch = event.touches[0]
    // An opening swipe must start at the screen edge so ordinary timeline swipes
    // never unexpectedly open navigation.
    if (!touch || event.touches.length !== 1 || (!sidebarOpen && touch.clientX > 36)) {
      touchStartRef.current = null
      return
    }
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleDrawerSwipe = (event) => {
    const start = touchStartRef.current
    const touch = event.changedTouches[0]
    touchStartRef.current = null
    if (!start || !touch) return

    const horizontalDistance = touch.clientX - start.x
    const verticalDistance = touch.clientY - start.y
    const isHorizontalGesture = Math.abs(horizontalDistance) >= 52 && Math.abs(horizontalDistance) > Math.abs(verticalDistance) * 1.5
    if (!isHorizontalGesture) return

    if (!sidebarOpen && horizontalDistance > 0) setSidebarOpen(true)
    if (sidebarOpen && horizontalDistance < 0) setSidebarOpen(false)
  }

  return (
    <div className="flex h-dvh min-h-0 w-full overflow-hidden bg-[#111310]" onTouchEnd={handleDrawerSwipe} onTouchStart={trackDrawerSwipe}>
      {sidebarOpen && <button aria-label="Close navigation" className="fixed inset-0 z-20 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-71.5 shrink-0 flex-col overflow-hidden border-r border-white/10 bg-[#191b17] transition-transform lg:relative lg:inset-auto lg:z-auto lg:h-full lg:translate-x-0 lg:transition-[width] lg:duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${sidebarCollapsed ? 'sidebar-compact' : 'sidebar-expanded'}`} onMouseEnter={() => setSidebarExpanded(true)}>
        <div className={`flex h-18 min-h-18 shrink-0 items-center border-b border-white/10 ${sidebarCollapsed ? 'justify-center gap-0 px-1' : 'justify-between px-5'}`}>
          {sidebarCollapsed ? <Link aria-label="Aira AI home" className="grid size-9 place-items-center" to={ROUTES.chats}><img alt="" aria-hidden="true" className="size-6 object-contain" src="/logo.png" /></Link> : <>
            <Link aria-label="Aira AI home" className="text-sm font-extrabold tracking-[0.16em]" to={ROUTES.chats}>AIRA AI</Link>
            <button aria-label="Collapse sidebar" className="hidden size-8 shrink-0 place-items-center text-[#92958c] hover:bg-white/5 hover:text-[#f4f0e8] lg:grid" onClick={() => setSidebarExpanded(false)} title="Collapse sidebar" type="button"><PanelLeft size={17} /></button>
          </>}
          <button aria-label="Close navigation" className="text-[#92958c] lg:hidden" onClick={() => setSidebarOpen(false)}><X size={18} /></button>
        </div>
        <div className={`shrink-0 ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
          <button aria-label="New conversation" className={`flex h-11 items-center border border-white/15 text-left text-xs font-semibold hover:border-[#d8f36a]/70 hover:text-[#d8f36a] disabled:opacity-50 ${sidebarCollapsed ? 'mx-auto size-11 justify-center p-0' : 'w-full justify-between px-3'}`} disabled={createState.isLoading} onClick={startChat} title={sidebarCollapsed ? 'New conversation' : undefined}>
            <span className={`flex items-center gap-2 ${sidebarCollapsed ? 'lg:justify-center' : ''}`}><MessageSquarePlus size={16} /><span className={sidebarCollapsed ? 'lg:sr-only' : ''}>New conversation</span></span>
          </button>
          {actionError && !sidebarCollapsed && <p className="mt-3 text-xs leading-5 text-[#f07865]">{actionError}</p>}
        </div>
        {!sidebarCollapsed && <div className="flex items-center justify-between px-5 pb-2 pt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#777a72]"><span>Recent</span><span>{chats.length.toString().padStart(2, '0')}</span></div>}
        {sidebarCollapsed ? <button aria-label="Search conversations" className="mx-auto mb-2 grid size-9 shrink-0 place-items-center text-[#777a72] hover:bg-white/5 hover:text-[#f4f0e8]" onClick={() => {
          setSidebarExpanded(true)
          window.requestAnimationFrame(() => searchInputRef.current?.focus())
        }} title="Search conversations" type="button"><Search size={15} /></button> : <label className="mx-4 mb-2 flex h-9 shrink-0 items-center gap-2 border-b border-white/10 px-1 text-[#777a72] focus-within:border-[#d8f36a]">
          <Search size={14} /><span className="sr-only">Search conversations</span><input className="min-w-0 flex-1 bg-transparent text-xs text-[#f4f0e8] outline-none placeholder:text-[#777a72]" onChange={(event) => setSearch(event.target.value)} placeholder="Search conversations" ref={searchInputRef} value={search} />
        </label>}
        <nav aria-label="Recent conversations" className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          {!sidebarCollapsed && isLoading && <p className="px-3 py-4 text-xs text-[#92958c]">Loading conversations...</p>}
          {!sidebarCollapsed && error && <p className="px-3 py-4 text-xs leading-5 text-[#f07865]">{getErrorMessage(error, 'Could not load conversations.')}</p>}
          {!sidebarCollapsed && !isLoading && !error && chats.length === 0 && <p className="px-3 py-4 text-xs leading-5 text-[#777a72]">Your conversations will appear here.</p>}
          {!sidebarCollapsed && chats.map((chat) => <ChatListItem key={chat._id} chat={chat} onNavigate={() => setSidebarOpen(false)} />)}
          {!sidebarCollapsed && data?.pagination?.hasPreviousPage && <button aria-label="Previous chat page" className="w-full py-2 text-xs text-[#92958c] hover:text-[#f4f0e8]" onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous page</button>}
          {!sidebarCollapsed && data?.pagination?.hasNextPage && <button aria-label="Next chat page" className="w-full py-2 text-xs text-[#92958c] hover:text-[#f4f0e8]" onClick={() => setPage((current) => current + 1)}>Next page</button>}
        </nav>
        <div className={`shrink-0 border-t border-white/10 ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
          <Link aria-label="Archive" className={`flex h-9 items-center gap-2 text-xs text-[#92958c] hover:text-[#f4f0e8] ${sidebarCollapsed ? 'justify-center px-0' : 'px-2'}`} onClick={() => setSidebarOpen(false)} title={sidebarCollapsed ? 'Archive' : undefined} to={`${ROUTES.chats}/archived`}><Archive size={15} /><span className={sidebarCollapsed ? 'lg:sr-only' : ''}>Archive</span></Link>
          <Link aria-label="Preferences" className={`flex h-9 items-center gap-2 text-xs text-[#92958c] hover:text-[#f4f0e8] ${sidebarCollapsed ? 'justify-center px-0' : 'px-2'}`} onClick={() => setSidebarOpen(false)} state={{ chatId }} title={sidebarCollapsed ? 'Preferences' : undefined} to="/settings"><Settings2 size={15} /><span className={sidebarCollapsed ? 'lg:sr-only' : ''}>Preferences</span></Link>
        </div>
      </aside>
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-18 min-h-18 shrink-0 items-center justify-between border-b border-white/10 px-5 sm:px-8">
          <button aria-label="Open navigation" className="text-[#92958c] hover:text-[#f4f0e8] lg:hidden" onClick={() => setSidebarOpen(true)} type="button"><Menu size={20} /></button>
          <div className="ml-auto flex items-center gap-3">
            <Link aria-label="Open profile" className="grid size-8 overflow-hidden rounded-full border border-white/15 bg-[#191b17] text-xs font-semibold text-[#d8f36a] hover:border-[#d8f36a]" to={ROUTES.profile}>{user?.avatar?.url ? <img alt="" aria-hidden="true" className="size-full object-cover" src={user.avatar.url} /> : user?.name?.slice(0, 1).toUpperCase()}</Link>
          </div>
        </header>
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden"><Outlet /></main>
      </div>
    </div>
  )
}

export default ChatLayout
