import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

const providers = [
    { value: 'GROQ', label: 'Groq' },
    { value: 'GEMINI', label: 'Gemini' },
]

const ProviderSwitcher = ({ value, disabled = false, onChange }) => {
    const [open, setOpen] = useState(false)
    const rootRef = useRef(null)
    const triggerRef = useRef(null)
    const optionRefs = useRef([])
    const selectedIndex = providers.findIndex((provider) => provider.value === value)

    useEffect(() => {
        if (!open) return undefined
        const closeMenu = (event) => {
            if (event.type === 'keydown' && event.key === 'Escape') {
                setOpen(false)
                triggerRef.current?.focus()
            }
            if (event.type === 'pointerdown' && !rootRef.current?.contains(event.target)) setOpen(false)
        }
        document.addEventListener('keydown', closeMenu)
        document.addEventListener('pointerdown', closeMenu)
        return () => {
            document.removeEventListener('keydown', closeMenu)
            document.removeEventListener('pointerdown', closeMenu)
        }
    }, [open])

    const chooseProvider = (provider) => {
        setOpen(false)
        triggerRef.current?.focus()
        if (provider !== value) onChange(provider)
    }

    useEffect(() => {
        if (open) optionRefs.current[selectedIndex]?.focus()
    }, [open, selectedIndex])

    const moveFocus = (index, direction) => {
        const nextIndex = (index + direction + providers.length) % providers.length
        optionRefs.current[nextIndex]?.focus()
    }

    return (
        <div className="relative" ref={rootRef}>
            <button aria-expanded={open} aria-haspopup="listbox" className="flex h-11 min-w-35 items-center justify-between gap-3 border border-white/15 bg-[#191b17] px-3 text-left text-sm text-[#f4f0e8] outline-none transition hover:border-[#d8f36a]/60 focus:border-[#d8f36a] disabled:opacity-60" disabled={disabled} onClick={() => setOpen((current) => !current)} onKeyDown={(event) => {
                if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    event.preventDefault()
                    setOpen(true)
                }
            }} ref={triggerRef} title="Choose AI provider" type="button">
                <span aria-hidden="true" className={`size-1.5 rounded-full ${value === 'GEMINI' ? 'bg-[#70b9ed]' : 'bg-[#d8f36a]'}`} />
                <span className="mr-auto">{providers.find((provider) => provider.value === value)?.label || value}</span>
                <ChevronDown aria-hidden="true" className={`transition-transform ${open ? 'rotate-180' : ''}`} size={15} />
            </button>
            {open && <div aria-label="AI provider" className="absolute right-0 top-full z-30 mt-1 w-full min-w-35 border border-white/10 bg-[#191b17] p-1 shadow-xl" role="listbox">
                {providers.map((provider, index) => <button aria-selected={provider.value === value} className={`flex h-10 w-full items-center justify-between px-3 text-left text-sm outline-none transition ${provider.value === value ? 'bg-[#d8f36a] text-[#111310]' : 'text-[#f4f0e8] hover:bg-[#d8f36a] hover:text-[#111310] focus:bg-[#d8f36a] focus:text-[#111310]'}`} key={provider.value} onClick={() => chooseProvider(provider.value)} onKeyDown={(event) => {
                    if (event.key === 'ArrowDown') {
                        event.preventDefault()
                        moveFocus(index, 1)
                    } else if (event.key === 'ArrowUp') {
                        event.preventDefault()
                        moveFocus(index, -1)
                    } else if (event.key === 'Escape') {
                        setOpen(false)
                        triggerRef.current?.focus()
                    }
                }} ref={(element) => { optionRefs.current[index] = element }} role="option" type="button">
                    <span>{provider.label}</span>{provider.value === value && <Check aria-hidden="true" size={14} />}
                </button>)}
            </div>}
        </div>
    )
}

export default ProviderSwitcher
