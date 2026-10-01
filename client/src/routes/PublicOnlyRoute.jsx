import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom'
import { ROUTES } from '../constants/routes.js'

const PublicOnlyRoute = () => {
  const status = useSelector((state) => state.auth.status)

  if (status === 'restoring') {
    return <div className="grid min-h-screen place-items-center text-sm text-[#92958c]">Restoring your space...</div>
  }

  return status === 'authenticated' ? <Navigate to={ROUTES.chats} replace /> : <Outlet />
}

export default PublicOnlyRoute