import { useSelector } from 'react-redux'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ROUTES } from '../constants/routes.js'
import SessionRestoreFailure from './SessionRestoreFailure.jsx'

const ProtectedRoute = () => {
  const status = useSelector((state) => state.auth.status)
  const location = useLocation()

  if (status === 'restoring') {
    return <div className="grid min-h-screen place-items-center text-sm text-[#92958c]">Restoring your space...</div>
  }

  if (status === 'restoreFailed') return <SessionRestoreFailure />

  if (status !== 'authenticated') {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />
  }

  return <Outlet />
}

export default ProtectedRoute