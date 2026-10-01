import { Link } from 'react-router-dom'
import { ROUTES } from '../constants/routes.js'

const NotFoundPage = () => (
  <main className="grid min-h-screen place-items-center px-6 text-center">
    <div>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-(--color-lime)">404 // lost in thoughts</p>
      <h1 className="mt-4 text-5xl font-semibold">This page isn't here.</h1>
      <Link className="mt-7 inline-block border-b border-(--color-lime) pb-1 text-sm" to={ROUTES.chats}>Return to your workspace</Link>
    </div>
  </main>
)

export default NotFoundPage