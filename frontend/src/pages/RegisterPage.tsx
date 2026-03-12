import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export function RegisterPage() {
  const navigate = useNavigate()
  const [firstname, setFirstname] = useState('')
  const [lastname, setLastname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!firstname.trim() || !lastname.trim() || !email.trim() || !password || !confirm) {
      toast.error('Veuillez remplir tous les champs')
      return
    }
    if (password !== confirm) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }
    setSubmitting(true)
    try {
      await api<{ message: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ firstname, lastname, email: email.trim(), password }),
      })
      toast.success(
        "Inscription réussie. Vérifiez vos emails pour valider votre compte avant de vous connecter.",
      )
      navigate('/login', { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible de créer le compte")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Inscription</CardTitle>
          <CardDescription>Créez votre compte CoWork'Space</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="min-h-[44px] md:min-h-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="min-h-[44px] md:min-h-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmation du mot de passe</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                className="min-h-[44px] md:min-h-0"
              />
            </div>
            <Button type="submit" className="w-full min-h-[44px] md:min-h-0" disabled={submitting}>
              {submitting ? 'Inscription…' : "S'inscrire"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

