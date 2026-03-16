import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import type { SpaceListItem, SpaceType } from '@/types/space'
import { SPACE_TYPE_LABELS } from '@/types/space'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

type ReservationSearchItem = {
  id: string
  title: string | null
  spaceName: string
  startDatetime: string
  endDatetime: string
}

const DEBOUNCE_MS = 280
const MIN_QUERY = 2

type HeaderSearchProps = {
  /** Appelé après sélection d’un résultat (ex. pour fermer le menu burger). */
  onResultSelect?: () => void
}

export function HeaderSearch({ onResultSelect }: HeaderSearchProps) {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [spaces, setSpaces] = useState<SpaceListItem[]>([])
  const [reservations, setReservations] = useState<ReservationSearchItem[]>([])
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchResults = useCallback(async (q: string) => {
    const trimmed = q.trim()
    if (trimmed.length < MIN_QUERY) {
      setSpaces([])
      setReservations([])
      return
    }
    setLoading(true)
    try {
      const [spacesRes, reservationsRes] = await Promise.all([
        api<SpaceListItem[]>(`/spaces?name=${encodeURIComponent(trimmed)}`),
        token
          ? api<ReservationSearchItem[]>(
              `/reservations?title=${encodeURIComponent(trimmed)}`,
              { token }
            ).catch(() => [] as ReservationSearchItem[])
          : Promise.resolve([] as ReservationSearchItem[]),
      ])
      setSpaces(spacesRes ?? [])
      setReservations(reservationsRes ?? [])
    } catch {
      setSpaces([])
      setReservations([])
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    const t = setTimeout(() => {
      fetchResults(query)
    }, DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [query, fetchResults])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const hasResults = spaces.length > 0 || reservations.length > 0
  const showDropdown = open && (query.trim().length >= MIN_QUERY || loading)

  const handleSelectSpace = (space: SpaceListItem) => {
    setOpen(false)
    setQuery('')
    onResultSelect?.()
    navigate(`/espaces/${space.id}`)
  }

  const handleSelectReservation = (r: ReservationSearchItem) => {
    setOpen(false)
    setQuery('')
    onResultSelect?.()
    navigate(`/reservations/${r.id}`)
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Rechercher un espace ou une réservation…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false)
          }}
          className="pl-8 h-8 bg-muted/50 border-0 focus-visible:ring-2"
          autoComplete="off"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          role="combobox"
        />
      </div>
      {showDropdown && (
        <div
          className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-border bg-card shadow-lg max-h-[min(70vh,320px)] overflow-y-auto"
          role="listbox"
        >
          {loading ? (
            <div className="p-3 text-sm text-muted-foreground">
              Recherche…
            </div>
          ) : !hasResults ? (
            <div className="p-3 text-sm text-muted-foreground">
              Aucun résultat pour &quot;{query.trim()}&quot;
            </div>
          ) : (
            <>
              {spaces.length > 0 && (
                <div className="p-1.5">
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Espaces
                  </div>
                  {spaces.slice(0, 6).map((space) => (
                    <button
                      key={space.id}
                      type="button"
                      role="option"
                      className={cn(
                        "w-full flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted focus:bg-muted focus:outline-none"
                      )}
                      onClick={() => handleSelectSpace(space)}
                    >
                      <span className="font-medium truncate">{space.name}</span>
                      <span className="shrink-0 text-muted-foreground text-xs">
                        {SPACE_TYPE_LABELS[space.type as SpaceType]}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {reservations.length > 0 && (
                <div className="p-1.5 border-t border-border">
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Réservations
                  </div>
                  {reservations.slice(0, 6).map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      role="option"
                      className={cn(
                        "w-full flex flex-col gap-0.5 rounded-md px-2 py-2 text-left text-sm hover:bg-muted focus:bg-muted focus:outline-none"
                      )}
                      onClick={() => handleSelectReservation(r)}
                    >
                      <span className="font-medium truncate">
                        {r.title || 'Sans titre'}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {r.spaceName} · {new Date(r.startDatetime).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
