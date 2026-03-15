import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { toast } from 'sonner'

type MemberItem = {
  id: string
  email: string
  firstname: string
  lastname: string
  isActive: boolean
  emailVerifiedAt: string | null
  approvedAt: string | null
  role: { slug: string }
}

export function AdminMembresPage() {
  const { token } = useAuth()
  const [pending, setPending] = useState<MemberItem[]>([])
  const [members, setMembers] = useState<MemberItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)

  async function load() {
    if (!token) return
    setLoading(true)
    try {
      const [pendingRes, membersRes] = await Promise.all([
        api<MemberItem[]>('/admin/membres?filter=pending', { token }),
        api<MemberItem[]>('/admin/membres?filter=members', { token }),
      ])
      setPending(Array.isArray(pendingRes) ? pendingRes : [])
      setMembers(Array.isArray(membersRes) ? membersRes : [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur chargement')
      setPending([])
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [token])

  async function handleValidate(id: string) {
    if (!token) return
    setActingId(id)
    try {
      await api(`/admin/membres/${id}/valider`, { token, method: 'PATCH' })
      toast.success('Inscription validée')
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setActingId(null)
    }
  }

  async function handleReject(id: string) {
    if (!token) return
    setActingId(id)
    try {
      await api(`/admin/membres/${id}/refuser`, { token, method: 'PATCH' })
      toast.success('Inscription refusée')
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setActingId(null)
    }
  }

  async function handleSetActive(id: string, isActive: boolean) {
    if (!token) return
    setActingId(id)
    try {
      await api(`/admin/membres/${id}/actif?actif=${isActive}`, { token, method: 'PATCH' })
      toast.success(isActive ? 'Membre activé' : 'Membre désactivé')
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setActingId(null)
    }
  }

  if (!token) return null

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Inscriptions en attente</CardTitle>
          <CardDescription>
            Utilisateurs ayant vérifié leur email, en attente de validation par un administrateur.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Chargement…</p>
          ) : pending.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucune inscription en attente.</p>
          ) : (
            <ul className="space-y-2">
              {pending.map((u) => (
                <li
                  key={u.id}
                  className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
                >
                  <span className="font-medium">{u.firstname} {u.lastname}</span>
                  <span className="text-muted-foreground text-sm">{u.email}</span>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleValidate(u.id)}
                      disabled={actingId !== null}
                    >
                      Valider
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(u.id)}
                      disabled={actingId !== null}
                    >
                      Refuser
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Membres</CardTitle>
          <CardDescription>Liste des membres validés. Vous pouvez activer ou désactiver un compte.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Chargement…</p>
          ) : members.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucun membre.</p>
          ) : (
            <ul className="space-y-2">
              {members.map((u) => (
                <li
                  key={u.id}
                  className="flex flex-col gap-2 rounded-md border p-3 sm:grid sm:grid-cols-[1fr_1fr_5rem_auto] sm:items-center sm:gap-3"
                >
                  <span className="font-medium min-w-0 truncate">{u.firstname} {u.lastname}</span>
                  <span className="text-muted-foreground text-sm min-w-0 truncate">{u.email}</span>
                  <Badge
                    variant={u.isActive ? 'default' : 'secondary'}
                    className="w-fit shrink-0 justify-center sm:w-16"
                  >
                    {u.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                  <Button
                    size="sm"
                    variant={u.isActive ? 'outline' : 'default'}
                    onClick={() => handleSetActive(u.id, !u.isActive)}
                    disabled={actingId !== null}
                    className="shrink-0 sm:justify-self-end"
                  >
                    {u.isActive ? 'Désactiver' : 'Activer'}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
