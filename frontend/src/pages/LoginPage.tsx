import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export function LoginPage() {
  const { login, user, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-muted-foreground">Chargement…</p>
      </div>
    )
  }

  if (user) {
    const target = user.role.slug === 'admin' ? '/admin' : '/'
    return <Navigate to={target} replace />
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) {
      toast.error('Veuillez remplir email et mot de passe')
      return
    }
    setSubmitting(true)
    try {
      const me = await login(email.trim(), password)
      const target = me.role.slug === 'admin' ? '/admin' : '/'
      navigate(target, { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Connexion impossible')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Connexion</CardTitle>
          <CardDescription>CoWork'Space – identifiez-vous</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@exemple.com"
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
                autoComplete="current-password"
                className="min-h-[44px] md:min-h-0"
              />
            </div>
            <div className="flex justify-between items-center text-sm">
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => navigate('/mot-de-passe-oublie')}
              >
                Mot de passe oublié ?
              </button>
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => navigate('/inscription')}
              >
                Créer un compte
              </button>
            </div>
            <Button type="submit" className="w-full min-h-[44px] md:min-h-0" disabled={submitting}>
              {submitting ? 'Connexion…' : 'Se connecter'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
