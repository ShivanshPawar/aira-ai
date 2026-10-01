import { useSessionRestore } from './features/auth/useSessionRestore.js'
import AppRouter from './app/router.jsx'

const App = () => {
  useSessionRestore()

  return <AppRouter />
}

export default App