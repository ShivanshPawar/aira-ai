import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ChevronDown, LogOut, Settings2 } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLogoutMutation } from '../../auth/authApi.js'
import { useGetChatQuery, useUpdateChatMutation } from '../chatsApi.js'
import { modelDefaults, setModel, setProvider } from '../chatUiSlice.js'
import { ROUTES } from '../../../constants/routes.js'
import { getErrorMessage } from '../../../services/api/apiError.js'

const providers = {
  GROQ: ['groq/compound', 'groq/compound-mini', 'openai/gpt-oss-120b'],
  GEMINI: ['gemini-2.5-flash'],
}
const providerOptions = ['GROQ', 'GEMINI']
const providerLabels = { GROQ: 'Groq', GEMINI: 'Gemini' }

const PreferenceSelect = ({ label, value, options, labels = {}, disabled = false, onChange }) => {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const triggerRef = useRef(null)
  const optionRefs = useRef([])
  const selectedIndex = Math.max(options.indexOf(value), 0)
  const listboxId = `preferences-${label.toLowerCase().replaceAll(' ', '-')}`

  useEffect(() => {
    if (!open) return undefined
    const closeOnOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [open])

  useEffect(() => {
    if (open) optionRefs.current[selectedIndex]?.focus()
  }, [open, selectedIndex])

  const selectOption = (option) => {
    onChange(option)
    setOpen(false)
    triggerRef.current?.focus()
  }

  const moveFocus = (index, direction) => {
    const nextIndex = (index + direction + options.length) % options.length
    optionRefs.current[nextIndex]?.focus()
  }

  return (
    <div className="relative" ref={containerRef}>
      <button aria-controls={listboxId} aria-expanded={open} aria-haspopup="listbox" aria-label={label} className="flex h-11 w-full items-center justify-between border border-white/15 bg-[#191b17] px-3 text-left text-sm text-[#f4f0e8] outline-none hover:border-[#d8f36a]/60 focus:border-[#d8f36a] disabled:opacity-60" disabled={disabled} onClick={() => setOpen((current) => !current)} onKeyDown={(event) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault()
          setOpen(true)
        }
      }} ref={triggerRef} type="button">
        <span>{labels[value] || value}</span><ChevronDown aria-hidden="true" className={`transition-transform ${open ? 'rotate-180' : ''}`} size={15} />
      </button>
      {open && <div aria-label={label} className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto border border-white/10 bg-[#191b17] p-1 shadow-xl" id={listboxId} role="listbox">
        {options.map((option, index) => <div aria-selected={option === value} className={`cursor-pointer px-3 py-2.5 text-sm outline-none transition-colors ${option === value ? 'bg-[#d8f36a] text-[#111310]' : 'text-[#f4f0e8]'} hover:bg-[#d8f36a] hover:text-[#111310] focus:bg-[#d8f36a] focus:text-[#111310]`} key={option} onClick={() => selectOption(option)} onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            moveFocus(index, 1)
          } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            moveFocus(index, -1)
          } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            selectOption(option)
          } else if (event.key === 'Escape') {
            event.preventDefault()
            setOpen(false)
            triggerRef.current?.focus()
          }
        }} ref={(element) => { optionRefs.current[index] = element }} role="option" tabIndex={0}>
          {labels[option] || option}
        </div>)}
      </div>}
    </div>
  )
}

const SettingsPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [logout, logoutState] = useLogoutMutation()
  const defaults = useSelector((state) => state.chatUi)
  const activeChatId = location.state?.chatId
  const { data: activeChat, isLoading: isChatLoading } = useGetChatQuery(activeChatId, { skip: !activeChatId })
  const [updateChat, updateState] = useUpdateChatMutation()
  const [chatSelection, setChatSelection] = useState(null)
  const [settingsError, setSettingsError] = useState('')
  const provider = activeChatId ? chatSelection?.provider || activeChat?.provider || defaults.provider : defaults.provider
  const model = activeChatId ? chatSelection?.model || activeChat?.model || defaults.model : defaults.model

  useEffect(() => {
    if (activeChat) {
      setChatSelection({ provider: activeChat.provider, model: activeChat.model })
    }
  }, [activeChat])

  const signOut = async () => {
    try {
      await logout().unwrap()
    } catch {
      // The logout mutation clears local session state even when the API is unavailable.
    }
    navigate(ROUTES.login, { replace: true })
  }

  const changeProvider = async (nextProvider) => {
    const nextModel = modelDefaults[nextProvider]
    dispatch(setProvider(nextProvider))
    setSettingsError('')

    if (!activeChatId) return

    setChatSelection({ provider: nextProvider, model: nextModel })
    try {
      await updateChat({ chatId: activeChatId, provider: nextProvider, model: nextModel }).unwrap()
    } catch (error) {
      setChatSelection({ provider: activeChat?.provider || defaults.provider, model: activeChat?.model || defaults.model })
      setSettingsError(getErrorMessage(error, 'Could not update this conversation.'))
    }
  }

  const changeModel = async (nextModel) => {
    dispatch(setModel(nextModel))
    setSettingsError('')

    if (!activeChatId) return

    setChatSelection({ provider, model: nextModel })
    try {
      await updateChat({ chatId: activeChatId, model: nextModel }).unwrap()
    } catch (error) {
      setChatSelection({ provider: activeChat?.provider || provider, model: activeChat?.model || model })
      setSettingsError(getErrorMessage(error, 'Could not update this conversation.'))
    }
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-10">
      <p className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#70b9ed]"><Settings2 size={13} /> Preferences</p>
      <h1 className="text-4xl font-semibold">Make AIRA yours</h1>
      <p className="mt-2 text-sm text-[#92958c]">{activeChatId ? 'Provider and model changes update this conversation and your defaults for new conversations.' : 'Choose how you want AIRA to work with you.'}</p>
      <div className="mt-10 grid gap-8 border-t border-white/10 py-7 sm:grid-cols-[1fr_240px] sm:items-center">
        <div>
          <h2 className="text-sm font-semibold">AI provider</h2>
          <p className="mt-1 text-xs leading-5 text-[#92958c]">Choose the AI that powers your conversations.</p>
        </div>
        <PreferenceSelect disabled={isChatLoading || updateState.isLoading} label={activeChatId ? 'Conversation AI provider' : 'Default AI provider'} labels={providerLabels} onChange={changeProvider} options={providerOptions} value={provider} />
      </div>
      <p aria-live="polite" className="mt-3 border-l-2 border-[#d8f36a] pl-3 text-xs leading-5 text-[#92958c] mb-10">Use Gemini for file attachments, Groq for speed.</p>
      <div className="grid gap-8 border-t border-white/10 py-7 sm:grid-cols-[1fr_240px] sm:items-center">
        <div>
          <h2 className="text-sm font-semibold">Default model</h2>
          <p className="mt-1 text-xs leading-5 text-[#92958c]">Available models are limited to the selected provider.</p>
        </div>
        <PreferenceSelect disabled={isChatLoading || updateState.isLoading} label={activeChatId ? 'Conversation model' : 'Default model'} onChange={changeModel} options={providers[provider]} value={model} />
      </div>
      {settingsError && <p aria-live="polite" className="mt-3 border-l-2 border-[#f07865] pl-3 text-xs leading-5 text-[#f5a89b]">{settingsError}</p>}
      <p aria-live="polite" className="mt-3 border-l-2 border-[#d8f36a] pl-3 text-xs leading-5 text-[#92958c]">Defaults are held in memory and reset when you close or reload the app.</p>
      <section className="mt-10 border-t border-white/10 pt-7">
        <h2 className="text-sm font-semibold">Private session</h2>
        <p className="mt-1 max-w-lg text-xs leading-5 text-[#92958c]">Your session is protected on this device. Signing out will end your current session.</p>
        <button className="mt-5 flex h-10 items-center gap-2 border border-[#f07865]/40 px-3 text-xs font-semibold text-[#f5a89b] hover:bg-[#f07865]/10 disabled:opacity-50" disabled={logoutState.isLoading} onClick={signOut} type="button"><LogOut size={15} />{logoutState.isLoading ? 'Signing out...' : 'Sign out'}</button>
      </section>
    </section>
  )
}

export default SettingsPage