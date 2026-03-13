import { Link, Navigate, Outlet } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

export function AdminLayout() {
  const { user } = useAuth()
  if (user?.role.slug !== 'admin') {
    return <Navigate to="/" replace />
  }
  return (
    <div className="space-y-6">
      <nav className="flex gap-2">
        <Link to="/admin">
          <Button variant="ghost" size="sm">Tableau de bord</Button>
        </Link>
        <Link to="/admin/membres">
          <Button variant="ghost" size="sm">Membres</Button>
        </Link>
        <Link to="/admin/espaces">
          <Button variant="ghost" size="sm">Espaces</Button>
        </Link>
      </nav>
      <Outlet />
    </div>
  )
}
