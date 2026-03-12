import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function AdminPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Administration</CardTitle>
          <CardDescription>Tableau de bord admin – statistiques à venir (admin/dashboard)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Vous êtes connecté en tant qu'administrateur.
          </p>
          <Link to="/admin/membres">
            <Button>Gérer les membres</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
