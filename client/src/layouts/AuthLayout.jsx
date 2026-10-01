import { ArrowUpRight, Sparkles } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'
import { ROUTES } from '../constants/routes.js'

const AuthLayout = () => (
  <main className="min-h-screen bg-[#111310] lg:grid lg:grid-cols-[minmax(340px,0.9fr)_1.1fr]">
    <section className="relative hidden min-h-screen overflow-hidden border-r border-white/10 lg:block">
      <img
        alt="A quiet night sky over a mountain ridge"
        className="absolute inset-0 h-full w-full object-cover opacity-65"
        src="https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1400&q=85"
      />
      <div className="absolute inset-0 bg-linear-to-t from-[#111310] via-[#111310]/15 to-[#111310]/20" />
      <Link className="absolute left-10 top-9 flex items-center gap-3" to={ROUTES.login}>
        <span className="grid size-9 place-items-center bg-[#d8f36a] text-[#111310]"><Sparkles size={18} /></span>
        <span className="text-sm font-extrabold tracking-[0.16em]">AIRA</span>
      </Link>
      <div className="absolute bottom-12 left-10 right-10">
        <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.18em] text-[#d8f36a]">A quieter kind of intelligence</p>
        <h1 className="max-w-xl text-5xl font-semibold leading-[1.08] text-[#f4f0e8] xl:text-6xl">
          Make room for a better question.
        </h1>
        <div className="mt-8 flex items-center gap-2 text-xs text-white/60"><span className="size-1.5 rounded-full bg-[#70b9ed]" /> Aira is ready when you are <ArrowUpRight size={14} /></div>
      </div>
    </section>
    <section className="flex min-h-screen flex-col px-6 py-7 sm:px-10 lg:px-16">
      <header className="flex items-center justify-between lg:justify-end">
        <Link className="flex items-center gap-2 text-sm font-extrabold tracking-[0.16em] lg:hidden" to={ROUTES.login}>
          <span className="grid size-8 place-items-center bg-[#d8f36a] text-[#111310]"><Sparkles size={16} /></span>AIRA
        </Link>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#92958c]">Ideas, in good company</span>
      </header>
      <div className="mx-auto flex w-full max-w-102.5 flex-1 flex-col justify-center py-12"><Outlet /></div>
      <footer className="flex justify-between border-t border-white/10 pt-5 font-mono text-[10px] uppercase tracking-wider text-[#777a72]">
        <span>Private by design</span><span>Aira AI</span>
      </footer>
    </section>
  </main>
)

export default AuthLayout