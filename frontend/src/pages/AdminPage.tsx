import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function AdminPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Administration</CardTitle>
          <CardDescription>Tableau de bord admin – à venir (admin/dashboard)</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Vous êtes connecté en tant qu’administrateur. Les fonctionnalités admin (membres, espaces, dashboard) seront ajoutées dans les prochaines features.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
