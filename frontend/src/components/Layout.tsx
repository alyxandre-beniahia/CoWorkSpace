import { useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { HeaderSearch } from '@/components/HeaderSearch'
import { Menu } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetHeader,
} from '@/components/ui/sheet'

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sheetOpen, setSheetOpen] = useState(false)

  const navLinks = (
    <>
      <Link to="/espaces" onClick={() => setSheetOpen(false)}>
        <Button variant="ghost" size="sm">Espaces</Button>
      </Link>
      {user && (
        <>
          <Link to="/mes-reservations" onClick={() => setSheetOpen(false)}>
            <Button variant="ghost" size="sm">Mes réservations</Button>
          </Link>
          <Link to="/profil" onClick={() => setSheetOpen(false)}>
            <Button variant="ghost" size="sm">Profil</Button>
          </Link>
        </>
      )}
      {user?.role.slug === 'admin' && (
        <Link to="/admin" onClick={() => setSheetOpen(false)}>
          <Button variant="ghost" size="sm">Admin</Button>
        </Link>
      )}
      {user ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSheetOpen(false)
            logout()
            navigate('/login', { replace: true })
          }}
        >
          Déconnexion
        </Button>
      ) : (
        <Link to="/login" onClick={() => setSheetOpen(false)}>
          <Button size="sm">Connexion</Button>
        </Link>
      )}
    </>
  )

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-4 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="text-xl font-bold tracking-tight shrink-0">
          CoWork'Space
        </Link>
        <div className="hidden sm:block flex-1 min-w-0 max-w-md mx-2">
          <HeaderSearch />
        </div>
        <div className="sm:hidden flex-1 min-w-0" aria-hidden="true" />
        <nav className="hidden md:flex items-center gap-2 shrink-0">
          {navLinks}
        </nav>
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSheetOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu className="size-5" />
          </Button>
        </div>
      </header>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent showCloseButton className="pt-12">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <div className="sm:hidden mt-2 mb-4">
            <HeaderSearch onResultSelect={() => setSheetOpen(false)} />
          </div>
          <nav className="flex flex-col gap-2">
            {navLinks}
          </nav>
        </SheetContent>
      </Sheet>
      <main className="flex-1 p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  )
}
