import { useState } from 'react'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useLoginMutation, useRegisterMutation } from '../authApi.js'
import { getErrorMessage } from '../../../services/api/apiError.js'
import { ROUTES } from '../../../constants/routes.js'

const AuthPage = ({ mode }) => {
  const isRegister = mode === 'register'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [login, loginState] = useLoginMutation()
  const [register, registerState] = useRegisterMutation()
  const location = useLocation()
  const navigate = useNavigate()
  const request = isRegister ? register : login
  const requestState = isRegister ? registerState : loginState

  const submit = async (event) => {
    event.preventDefault()
    try {
      await request(isRegister ? { name, email, password } : { email, password }).unwrap()
      navigate(location.state?.from?.pathname || ROUTES.chats, { replace: true })
    } catch {
      // RTK Query retains the normalized error for the form below.
    }
  }

  return (
    <div>
      <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-[#d8f36a]">{isRegister ? 'Begin here' : 'Welcome back'}</p>
      <h2 className="text-4xl font-semibold leading-tight text-[#f4f0e8] sm:text-[46px]">
        {isRegister ? 'A new space to think.' : 'Pick up your thread.'}
      </h2>
      <p className="mt-3 text-sm leading-6 text-[#92958c]">
        {isRegister ? 'Create your account and make the space your own.' : 'Sign in to return to your conversations.'}
      </p>

      <form className="mt-9 space-y-5" onSubmit={submit}>
        {isRegister && <label className="block text-xs text-[#cbc8bf]">Name<input autoComplete="name" className="auth-input mt-2" maxLength={50} minLength={3} onChange={(event) => setName(event.target.value)} placeholder="Your name" required value={name} /></label>}
        <label className="block text-xs text-[#cbc8bf]">Email address<input autoComplete="email" className="auth-input mt-2" onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required type="email" value={email} /></label>
        <label className="block text-xs text-[#cbc8bf]">Password
          <span className="relative mt-2 block">
            <input autoComplete={isRegister ? 'new-password' : 'current-password'} className="auth-input pr-12" minLength={isRegister ? 8 : undefined} onChange={(event) => setPassword(event.target.value)} placeholder={isRegister ? 'At least 8 characters' : 'Your password'} required type={showPassword ? 'text' : 'password'} value={password} />
            <button aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#92958c] hover:text-[#f4f0e8]" onClick={() => setShowPassword((visible) => !visible)} type="button">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
          </span>
        </label>
        {requestState.error && <p aria-live="polite" className="border-l-2 border-[#f07865] bg-[#f07865]/10 px-3 py-2 text-xs leading-5 text-[#ffc0b6]">{getErrorMessage(requestState.error)}</p>}
        <button className="flex h-12 w-full items-center justify-between bg-[#d8f36a] px-4 text-sm font-bold text-[#171912] transition hover:bg-[#e5ff85] disabled:opacity-60" disabled={requestState.isLoading} type="submit">
          <span>{requestState.isLoading ? 'One moment...' : isRegister ? 'Create account' : 'Sign in'}</span><ArrowRight size={18} />
        </button>
      </form>
      <p className="mt-7 text-center text-xs text-[#92958c]">
        {isRegister ? 'Already have an account?' : 'New to Aira?'}{' '}
        <Link className="font-semibold text-[#f4f0e8] underline decoration-[#70b9ed] underline-offset-4 hover:text-[#d8f36a]" to={isRegister ? ROUTES.login : ROUTES.register}>
          {isRegister ? 'Sign in' : 'Create an account'}
        </Link>
      </p>
    </div>
  )
}

export default AuthPage