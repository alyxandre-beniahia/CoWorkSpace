import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export function ProfilePage() {
  const { user, token, setToken } = useAuth()
  const [firstname, setFirstname] = useState(user?.firstname ?? '')
  const [lastname, setLastname] = useState(user?.lastname ?? '')
  const [phone, setPhone] = useState((user as any)?.phone ?? '')
  const [submitting, setSubmitting] = useState(false)

  if (!user || !token) {
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api<{
        id: string
        email: string
        firstname: string
        lastname: string
        phone?: string | null
        role: { slug: string }
      }>('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({
          firstname: firstname.trim(),
          lastname: lastname.trim(),
          phone: phone.trim() || undefined,
        }),
        token,
      })
      // On met à jour le user dans le contexte en rechargeant /auth/me
      // via un changement de token forcé (setToken déclenchera le useEffect).
      setToken(token)
      toast.success('Profil mis à jour')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Impossible de mettre à jour le profil')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>Mettre à jour vos informations personnelles</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="firstname">Prénom</Label>
              <Input
                id="firstname"
                value={firstname}
                onChange={(e) => setFirstname(e.target.value)}
                className="min-h-[44px] md:min-h-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastname">Nom</Label>
              <Input
                id="lastname"
                value={lastname}
                onChange={(e) => setLastname(e.target.value)}
                className="min-h-[44px] md:min-h-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="min-h-[44px] md:min-h-0"
              />
            </div>
            <Button type="submit" className="min-h-[44px] md:min-h-0" disabled={submitting}>
              {submitting ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

