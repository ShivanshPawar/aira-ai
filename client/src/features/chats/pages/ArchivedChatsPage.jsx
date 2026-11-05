import { useState } from 'react'
import { Archive, Search } from 'lucide-react'
import { useGetArchivedChatsQuery } from '../chatsApi.js'
import ChatListItem from '../components/ChatListItem.jsx'
import { getErrorMessage } from '../../../services/api/apiError.js'

const PAGE_SIZE = 50

const ArchivedChatsPage = () => {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading, isFetching, error } = useGetArchivedChatsQuery({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
  })
  const chats = data?.items || []
  const pagination = data?.pagination

  return (
    <section className="scrollbar-hidden mx-auto min-h-0 w-full max-w-3xl flex-1 overflow-y-auto overscroll-contain px-5 py-10 sm:px-10">
      <p className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#d8f36a]"><Archive size={13} /> Archive</p>
      <h1 className="text-4xl font-semibold">Where old thoughts live</h1>
      <p className="mt-2 text-sm text-[#92958c]">Your archived conversations are kept here, ready whenever you want to revisit them.</p>
      <label className="mt-8 flex h-11 items-center gap-3 border-b border-white/15 text-[#92958c] focus-within:border-[#d8f36a]">
        <Search size={16} /><span className="sr-only">Search archive</span><input className="h-full min-w-0 flex-1 bg-transparent text-sm text-[#f4f0e8] outline-none placeholder:text-[#777a72]" onChange={(event) => {
          setSearch(event.target.value)
          setPage(1)
        }} placeholder="Search archived conversations" value={search} />
      </label>
      <div className="mt-5 divide-y divide-white/6">
        {isLoading && <p className="py-6 text-sm text-[#92958c]">Loading archive...</p>}
        {error && <p className="py-6 text-sm text-[#f07865]">{getErrorMessage(error, 'Could not load archived conversations.')}</p>}
        {!isLoading && !error && chats.length === 0 && <p className="py-6 text-sm text-[#92958c]">No archived conversations found.</p>}
        {chats.map((chat) => <ChatListItem archived key={chat._id} chat={chat} />)}
      </div>
      {pagination?.totalPages > 1 && (
        <nav aria-label="Archived conversation pages" className="mt-5 flex items-center justify-between text-xs text-[#92958c]">
          <button
            aria-label="Previous archived conversation page"
            className="py-2 hover:text-[#f4f0e8] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!pagination.hasPreviousPage || isFetching}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            type="button"
          >
            Previous page
          </button>
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <button
            aria-label="Next archived conversation page"
            className="py-2 hover:text-[#f4f0e8] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!pagination.hasNextPage || isFetching}
            onClick={() => setPage((current) => current + 1)}
            type="button"
          >
            Next page
          </button>
        </nav>
      )}
    </section>
  )
}

export default ArchivedChatsPage