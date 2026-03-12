import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      toast.error('Veuillez saisir votre email')
      return
    }
    setSubmitting(true)
    try {
      const res = await api<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      })
      toast.success(
        res.message ||
          'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.',
      )
    } catch (err) {
      // On garde un message générique pour ne pas donner d’info sur l’existence du compte
      toast.success(
        'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Mot de passe oublié</CardTitle>
          <CardDescription>
            Indiquez votre email pour recevoir un lien de réinitialisation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <Button type="submit" className="w-full min-h-[44px] md:min-h-0" disabled={submitting}>
              {submitting ? 'Envoi…' : 'Envoyer'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

