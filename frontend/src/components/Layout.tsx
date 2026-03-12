import { Link, Outlet } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

export function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-4 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="text-xl font-bold tracking-tight">
          CoWork'Space
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/espaces">
            <Button variant="ghost" size="sm">Espaces</Button>
          </Link>
          {user && (
            <Link to="/profil">
              <Button variant="ghost" size="sm">Profil</Button>
            </Link>
          )}
          {user?.role.slug === 'admin' && (
            <Link to="/admin">
              <Button variant="ghost" size="sm">Admin</Button>
            </Link>
          )}
          {user ? (
            <Button variant="outline" size="sm" onClick={logout}>
              Déconnexion
            </Button>
          ) : (
            <Link to="/login">
              <Button size="sm">Connexion</Button>
            </Link>
          )}
        </nav>
      </header>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}
