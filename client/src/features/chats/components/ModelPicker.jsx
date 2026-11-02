import { useEffect, useRef, useState } from 'react'
import { BrainCircuit } from 'lucide-react'

const modelOptions = [
  { provider: 'GROQ', value: 'openai/gpt-oss-20b', label: 'GPT OSS 20B' },
  { provider: 'GROQ', value: 'openai/gpt-oss-120b', label: 'GPT OSS 120B' },
  { provider: 'GEMINI', value: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash' },
  { provider: 'GEMINI', value: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite' },
  { provider: 'GEMINI', value: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash-Lite' },
  { provider: 'GEMINI', value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash' },
  { provider: 'GEMINI', value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
]

const ModelPicker = ({ value, disabled = false, onChange, placement = 'above' }) => {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const triggerRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const close = (event) => {
      if (event.type === 'keydown' && event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
      if (event.type === 'pointerdown' && !rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('keydown', close)
    document.addEventListener('pointerdown', close)
    return () => {
      document.removeEventListener('keydown', close)
      document.removeEventListener('pointerdown', close)
    }
  }, [open])

  const chooseModel = (option) => {
    setOpen(false)
    triggerRef.current?.focus()
    if (option.value !== value) onChange(option)
  }

  return (
    <div className="relative" ref={rootRef}>
      <button aria-expanded={open} aria-haspopup="listbox" aria-label="Choose AI model" className="grid size-10 place-items-center border border-white/15 bg-[#191b17] text-[#b9bdb4] outline-none transition hover:border-[#d8f36a]/60 hover:text-[#d8f36a] focus:border-[#d8f36a] disabled:opacity-50" disabled={disabled} onClick={() => setOpen((current) => !current)} ref={triggerRef} title="Choose AI model" type="button"><BrainCircuit size={18} /></button>
      {open && <div aria-label="AI model" className={`absolute right-0 z-40 w-44 overflow-hidden border border-white/10 bg-[#191b17] shadow-xl ${placement === 'below' ? 'top-full mt-1' : 'bottom-full mb-1'}`} role="listbox">
        {modelOptions.map((option) => <button aria-selected={option.value === value} className={`flex min-h-6 w-full items-center border-l-2 px-2 text-left text-[8px] outline-none transition ${option.value === value ? 'border-[#d8f36a] bg-white/5 font-semibold text-[#f4f0e8]' : 'border-transparent text-[#92958c] hover:bg-white/7 hover:text-[#f4f0e8] focus:bg-white/7 focus:text-[#f4f0e8]'}`} key={option.value} onClick={() => chooseModel(option)} role="option" type="button"><span className="whitespace-nowrap">{option.label}</span></button>)}
      </div>}
    </div>
  )
}

export default ModelPicker
