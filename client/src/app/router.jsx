import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout.jsx'
import ChatLayout from '../layouts/ChatLayout.jsx'
import AuthPage from '../features/auth/pages/AuthPage.jsx'
import ChatWorkspacePage from '../features/chats/pages/ChatWorkspacePage.jsx'
import ArchivedChatsPage from '../features/chats/pages/ArchivedChatsPage.jsx'
import SettingsPage from '../features/chats/pages/SettingsPage.jsx'
import ProfilePage from '../features/auth/pages/ProfilePage.jsx'
import NotFoundPage from '../pages/NotFoundPage.jsx'
import ProtectedRoute from '../routes/ProtectedRoute.jsx'
import PublicOnlyRoute from '../routes/PublicOnlyRoute.jsx'
import { ROUTES } from '../constants/routes.js'

const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.login} element={<AuthPage mode="login" />} />
          <Route path={ROUTES.register} element={<AuthPage mode="register" />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<ChatLayout />}>
          <Route path={ROUTES.chats} element={<ChatWorkspacePage />} />
          <Route path={`${ROUTES.chats}/archived`} element={<ArchivedChatsPage />} />
          <Route path={`${ROUTES.chats}/:chatId`} element={<ChatWorkspacePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path={ROUTES.profile} element={<ProfilePage />} />
        </Route>
      </Route>
      <Route path="/" element={<Navigate to={ROUTES.chats} replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </BrowserRouter>
)

export default AppRouter
