import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import type { User } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { toast } from 'sonner'

/** Formulaire profil : champs pré-remplis depuis le contexte, sauvegarde via PATCH /auth/me. */
export function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [firstname, setFirstname] = useState(user?.firstname ?? '')
  const [lastname, setLastname] = useState(user?.lastname ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submittingPassword, setSubmittingPassword] = useState(false)

  if (!user) {
    return null
  }

  const avatarUrl = user.avatarUrl ?? `https://api.dicebear.com/9.x/bottts/svg?seed=${user.id}`

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const updated = await api<User>('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({
          firstname: firstname.trim(),
          lastname: lastname.trim(),
          phone: phone.trim() || undefined,
        })
      })
      updateUser(updated)
      toast.success('Profil mis à jour')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Impossible de mettre à jour le profil')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('Le nouveau mot de passe et la confirmation ne correspondent pas')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Le nouveau mot de passe doit contenir au moins 8 caractères')
      return
    }
    setSubmittingPassword(true)
    try {
      await api<{ message: string }>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        })
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Mot de passe mis à jour')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Impossible de changer le mot de passe')
    } finally {
      setSubmittingPassword(false)
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
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <Avatar size="lg" className="size-16 shrink-0">
              <AvatarImage src={avatarUrl} alt={`${user.firstname} ${user.lastname}`} />
              <AvatarFallback>
                {user.firstname[0]}
                {user.lastname[0]}
              </AvatarFallback>
            </Avatar>
            <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 flex-1">
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Changer le mot de passe</CardTitle>
          <CardDescription>
            Saisissez votre mot de passe actuel et le nouveau mot de passe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mot de passe actuel</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="min-h-[44px] md:min-h-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="min-h-[44px] md:min-h-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmation du mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="min-h-[44px] md:min-h-0"
              />
            </div>
            <Button
              type="submit"
              className="min-h-[44px] md:min-h-0"
              disabled={submittingPassword}
            >
              {submittingPassword ? 'En cours…' : 'Changer le mot de passe'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
