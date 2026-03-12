import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

/** Page « lien cliqué » : token en query (reçu par email), appel GET /auth/verify-email pour valider le compte. */
export function EmailVerificationPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams(location.search)
    const token = params.get('token')
    if (!token) {
      if (!cancelled) {
        setStatus('error')
        setMessage('Lien invalide')
      }
      return
    }
    api<{ message: string }>(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((res) => {
        if (!cancelled) {
          setStatus('success')
          setMessage(res.message || 'Email vérifié. Vous pouvez maintenant vous connecter.')
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setStatus('error')
          setMessage(err instanceof Error ? err.message : 'Lien invalide ou expiré')
        }
      })
    return () => {
      cancelled = true
    }
  }, [location.search])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Validation de votre email</CardTitle>
          <CardDescription>
            {status === 'loading'
              ? 'Vérification en cours…'
              : "Résultat de la vérification de votre adresse email"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {status === 'loading' ? 'Merci de patienter.' : message}
          </p>
          <Button onClick={() => navigate('/login')} className="w-full min-h-[44px] md:min-h-0">
            Aller à la page de connexion
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

