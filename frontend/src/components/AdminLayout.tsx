import { useState } from 'react'
import { Link, Navigate, Outlet } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { Menu } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetHeader,
} from '@/components/ui/sheet'

export function AdminLayout() {
  const { user } = useAuth()
  const [sheetOpen, setSheetOpen] = useState(false)

  if (user?.role.slug !== 'admin') {
    return <Navigate to="/" replace />
  }

  const adminNav = (
    <>
      <Link to="/admin" onClick={() => setSheetOpen(false)}>
        <Button variant="ghost" size="sm">Tableau de bord</Button>
      </Link>
      <Link to="/admin/membres" onClick={() => setSheetOpen(false)}>
        <Button variant="ghost" size="sm">Membres</Button>
      </Link>
      <Link to="/admin/espaces" onClick={() => setSheetOpen(false)}>
        <Button variant="ghost" size="sm">Espaces</Button>
      </Link>
      <Link to="/admin/equipements" onClick={() => setSheetOpen(false)}>
        <Button variant="ghost" size="sm">Équipements</Button>
      </Link>
    </>
  )

  return (
    <div className="space-y-6">
      <nav className="flex flex-col sm:flex-row gap-2">
        <div className="hidden sm:flex gap-2">
          {adminNav}
        </div>
        <div className="sm:hidden flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSheetOpen(true)}
            aria-label="Ouvrir le menu admin"
          >
            <Menu className="size-4 mr-1" />
            Menu admin
          </Button>
        </div>
      </nav>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent showCloseButton className="pt-12">
          <SheetHeader>
            <SheetTitle>Admin</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-2">
            {adminNav}
          </nav>
        </SheetContent>
      </Sheet>
      <Outlet />
    </div>
  )
}
