import { useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FloorPlanSVG, type SpaceForPlan } from '@/components/FloorPlanSVG'
import type { SpaceType, SpaceStatus } from '@/types/space'

type AdminSpaceForPlan = {
  id: string
  name: string
  code: string | null
  type: SpaceType
  capacity: number
  status: SpaceStatus
  positionX: number | null
  positionY: number | null
}

type AdminSpacesPlanProps = {
  spaces: AdminSpaceForPlan[]
  onPositionChange: (spaceId: string, x: number, y: number) => void
}

export function AdminSpacesPlan({ spaces, onPositionChange }: AdminSpacesPlanProps) {
  const [placementSpace, setPlacementSpace] = useState<AdminSpaceForPlan | null>(null)
  const [pendingPosition, setPendingPosition] = useState<{ x: number; y: number } | null>(null)

  const pendingSpaces = useMemo(
    () => spaces.filter((s) => s.positionX == null && s.positionY == null),
    [spaces]
  )

  const spacesForPlan: SpaceForPlan[] = useMemo(
    () => spaces.map((s) => ({ ...s, description: null })),
    [spaces]
  )

  function handlePlacementClick(x: number, y: number) {
    if (!placementSpace) return
    setPendingPosition({ x, y })
  }

  function handleConfirmPlacement() {
    if (!placementSpace || !pendingPosition) return
    onPositionChange(placementSpace.id, pendingPosition.x, pendingPosition.y)
    setPlacementSpace(null)
    setPendingPosition(null)
  }

  function handleCancelPlacement() {
    setPlacementSpace(null)
    setPendingPosition(null)
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Disposition sur le plan</h2>
        <p className="text-muted-foreground text-sm">
          {placementSpace
            ? `Cliquez sur le plan pour placer « ${placementSpace.name} »`
            : 'Placez les espaces sur le plan ou déplacez-les pour ajuster leur position.'}
        </p>
      </div>

      {pendingSpaces.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-muted/20 p-4 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">En attente de placement</h3>
          <div className="flex flex-wrap gap-2">
            {pendingSpaces.map((s) => (
              <div
                key={s.id}
                className="inline-flex flex-col gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm shadow-sm hover:border-primary/30 transition-colors sm:flex-row sm:items-center"
              >
                <span className="font-medium">{s.name}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPlacementSpace(s)}
                  disabled={!!placementSpace}
                  className="shrink-0"
                >
                  Placer sur le plan
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border/60 bg-gradient-to-br from-muted/30 to-muted/10 shadow-sm overflow-hidden">
        <FloorPlanSVG
          spaces={spacesForPlan}
          mode="admin"
          onPositionChange={onPositionChange}
          onPlacementClick={placementSpace ? handlePlacementClick : undefined}
        />
      </div>

      <Dialog open={!!placementSpace && !!pendingPosition} onOpenChange={(open) => !open && handleCancelPlacement()}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>
              Enregistrer la position de {placementSpace?.name} ?
            </DialogTitle>
          </DialogHeader>
          <DialogFooter showCloseButton={false}>
            <Button onClick={handleConfirmPlacement}>Oui</Button>
            <Button variant="outline" onClick={handleCancelPlacement}>
              Non
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
