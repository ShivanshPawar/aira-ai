import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ChevronDown, Settings2 } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useGetChatQuery, useUpdateChatMutation } from '../chatsApi.js'
import { modelDefaults, setModel, setProvider } from '../chatUiSlice.js'
import { getErrorMessage } from '../../../services/api/apiError.js'

const providers = {
  GROQ: ['openai/gpt-oss-20b', 'openai/gpt-oss-120b'],
  GEMINI: [
    'gemini-3.6-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-3-flash-preview',
    'gemini-2.5-flash',
  ],
}
const providerOptions = ['GROQ', 'GEMINI']
const providerLabels = { GROQ: 'Groq', GEMINI: 'Gemini' }
const modelLabels = {
  'openai/gpt-oss-20b': 'GPT OSS 20B',
  'openai/gpt-oss-120b': 'GPT OSS 120B',
  'gemini-3.6-flash': 'Gemini 3.6 Flash',
  'gemini-3.5-flash-lite': 'Gemini 3.5 Flash-Lite',
  'gemini-3.1-flash-lite': 'Gemini 3.1 Flash-Lite',
  'gemini-3-flash-preview': 'Gemini 3 Flash',
  'gemini-2.5-flash': 'Gemini 2.5 Flash',
}

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
      <button aria-controls={listboxId} aria-expanded={open} aria-haspopup="listbox" aria-label={label} className="flex h-9 w-full items-center justify-between border border-white/15 bg-[#191b17] px-2.5 text-left text-xs text-[#f4f0e8] outline-none hover:border-[#d8f36a]/60 focus:border-[#d8f36a] disabled:opacity-60" disabled={disabled} onClick={() => setOpen((current) => !current)} onKeyDown={(event) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault()
          setOpen(true)
        }
      }} ref={triggerRef} type="button">
        <span>{labels[value] || value}</span><ChevronDown aria-hidden="true" className={`transition-transform ${open ? 'rotate-180' : ''}`} size={13} />
      </button>
      {open && <div aria-label={label} className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden border border-white/10 bg-[#191b17] shadow-xl" id={listboxId} role="listbox">
        {options.map((option, index) => <button aria-selected={option === value} className={`flex min-h-6 w-full items-center justify-between border-l-2 px-2.5 text-left text-[9px] outline-none transition-colors ${option === value ? 'border-[#d8f36a] bg-white/5 text-[#f4f0e8]' : 'border-transparent text-[#92958c]'} hover:bg-white/5 hover:text-[#f4f0e8] focus:bg-white/5 focus:text-[#f4f0e8]`} key={option} onClick={() => selectOption(option)} onKeyDown={(event) => {
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
        }} ref={(element) => { optionRefs.current[index] = element }} role="option" type="button">
          <span className="whitespace-nowrap">{labels[option] || option}</span>
        </button>)}
      </div>}
    </div>
  )
}

const SettingsPage = () => {
  const dispatch = useDispatch()
  const location = useLocation()
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
    <section className="scrollbar-hidden mx-auto min-h-0 w-full max-w-3xl flex-1 overflow-y-auto overscroll-contain px-5 py-10 pb-12 sm:px-10">
      <p className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#70b9ed]"><Settings2 size={13} /> Preferences</p>
      <h1 className="text-4xl font-semibold">Make AIRA yours</h1>
      <p className="mt-2 text-sm text-[#92958c]">{activeChatId ? 'Provider and model changes update this conversation and your defaults for new conversations.' : 'Choose how you want AIRA to work with you.'}</p>
      <div className="mt-10 grid gap-8 border-t border-white/10 py-7 sm:grid-cols-[1fr_208px] sm:items-center">
        <div>
          <h2 className="text-sm font-semibold">AI provider</h2>
          <p className="mt-1 text-xs leading-5 text-[#92958c]">Choose the AI that powers your conversations.</p>
        </div>
        <PreferenceSelect disabled={isChatLoading || updateState.isLoading} label={activeChatId ? 'Conversation AI provider' : 'Default AI provider'} labels={providerLabels} onChange={changeProvider} options={providerOptions} value={provider} />
      </div>
      <p aria-live="polite" className="mt-3 border-l-2 border-[#d8f36a] pl-3 text-xs leading-5 text-[#92958c] mb-10">Use Gemini for file attachments, Groq for fast text conversations.</p>
      <div className="grid gap-8 border-t border-white/10 py-7 sm:grid-cols-[1fr_208px] sm:items-center">
        <div>
          <h2 className="text-sm font-semibold">Default model</h2>
          <p className="mt-1 text-xs leading-5 text-[#92958c]">Available models are limited to the selected provider.</p>
        </div>
        <PreferenceSelect disabled={isChatLoading || updateState.isLoading} label={activeChatId ? 'Conversation model' : 'Default model'} labels={modelLabels} onChange={changeModel} options={providers[provider]} value={model} />
      </div>
      {settingsError && <p aria-live="polite" className="mt-3 border-l-2 border-[#f07865] pl-3 text-xs leading-5 text-[#f5a89b]">{settingsError}</p>}
      <p aria-live="polite" className="mt-3 border-l-2 border-[#d8f36a] pl-3 text-xs leading-5 text-[#92958c]">Defaults are held in memory and reset when you close or reload the app.</p>
    </section>
  )
}

export default SettingsPage
