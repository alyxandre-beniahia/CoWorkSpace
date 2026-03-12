import { Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function HomePage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-muted-foreground">Chargement…</p>
      </div>
    )
  }

  if (user) {
    const target = user.role.slug === 'admin' ? '/admin' : '/espaces'
    return <Navigate to={target} replace />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">CoWork'Space</h1>
        <p className="text-muted-foreground">Réservation d’espaces de travail</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Bienvenue</CardTitle>
          <CardDescription>Consultez les espaces ou connectez-vous pour réserver</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link to="/espaces">
            <Button>Voir les espaces</Button>
          </Link>
          <Link to="/login">
            <Button variant="outline">Se connecter</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
