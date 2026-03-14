import { Stage, Layer, Group, Rect, Text } from 'react-konva'
import { useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SPACE_STATUS_CLASS, SPACE_STATUS_LABELS, SPACE_TYPE_LABELS } from '@/types/space'
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

const PLAN_WIDTH = 900
const PLAN_HEIGHT = 500

export function AdminSpacesPlan({ spaces, onPositionChange }: AdminSpacesPlanProps) {
  const [placementSpace, setPlacementSpace] = useState<AdminSpaceForPlan | null>(null)
  const [pendingPosition, setPendingPosition] = useState<{ x: number; y: number } | null>(null)

  const pendingSpaces = useMemo(
    () => spaces.filter((s) => s.positionX == null && s.positionY == null),
    [spaces]
  )

  const positionedSpaces = useMemo(() => {
    const withPosition = spaces.filter((s) => s.positionX != null && s.positionY != null)
    const cols = Math.ceil(Math.sqrt(Math.max(withPosition.length, 1)))
    const rows = Math.ceil(withPosition.length / cols)
    const cellWidth = PLAN_WIDTH / cols
    const cellHeight = PLAN_HEIGHT / rows

    return withPosition.map((space, index) => {
      const row = Math.floor(index / cols)
      const col = index % cols
      const defaultX = col * cellWidth + 16
      const defaultY = row * cellHeight + 16
      const x = space.positionX ?? defaultX
      const y = space.positionY ?? defaultY
      const w = cellWidth - 32
      const h = cellHeight - 32
      return { space, x, y, w, h }
    })
  }, [spaces])

  const getBgColor = (status: SpaceStatus) => {
    const c = SPACE_STATUS_CLASS[status]
    return c === 'bg-status-available' ? '#22c55e' : c === 'bg-status-unavailable' ? '#94a3b8' : '#f97316'
  }

  function handleStageClick(evt: { target: { getStage: () => { getPointerPosition: () => { x: number; y: number } | null } | null } }) {
    if (!placementSpace) return
    const stage = evt.target?.getStage?.()
    if (!stage) return
    const pos = stage.getPointerPosition?.()
    if (!pos) return
    setPendingPosition({ x: pos.x, y: pos.y })
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
                className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm shadow-sm hover:border-primary/30 transition-colors"
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
        <Stage
          width={PLAN_WIDTH}
          height={PLAN_HEIGHT}
          onClick={handleStageClick}
          style={{ cursor: placementSpace ? 'crosshair' : undefined }}
        >
          <Layer>
            <Rect x={0} y={0} width={PLAN_WIDTH} height={PLAN_HEIGHT} fill="#f8fafc" listening={false} />
            {Array.from({ length: Math.ceil(PLAN_WIDTH / 40) }).map((_, i) => (
              <Rect key={`v-${i}`} x={i * 40} y={0} width={1} height={PLAN_HEIGHT} fill="#e2e8f0" opacity={0.3} listening={false} />
            ))}
            {Array.from({ length: Math.ceil(PLAN_HEIGHT / 40) }).map((_, i) => (
              <Rect key={`h-${i}`} x={0} y={i * 40} width={PLAN_WIDTH} height={1} fill="#e2e8f0" opacity={0.3} listening={false} />
            ))}
            {positionedSpaces.map(({ space, x, y, w, h }) => (
              <AdminSpaceRect
                key={space.id}
                space={space}
                x={x}
                y={y}
                width={w}
                height={h}
                bgColor={getBgColor(space.status)}
                onPositionChange={onPositionChange}
              />
            ))}
          </Layer>
        </Stage>
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

type AdminSpaceRectProps = {
  space: AdminSpaceForPlan
  x: number
  y: number
  width: number
  height: number
  bgColor: string
  onPositionChange: (spaceId: string, x: number, y: number) => void
}

function AdminSpaceRect({
  space,
  x,
  y,
  width,
  height,
  bgColor,
  onPositionChange,
}: AdminSpaceRectProps) {
  return (
    <Group
      x={x}
      y={y}
      draggable
      onDragEnd={(evt) => {
        const node = evt.target
        onPositionChange(space.id, node.x(), node.y())
      }}
    >
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill={bgColor}
        cornerRadius={12}
        shadowColor="#0f172a"
        shadowBlur={8}
        shadowOffset={{ x: 0, y: 2 }}
        shadowOpacity={0.15}
      />
      <Text
        x={12}
        y={10}
        text={space.name}
        fontSize={15}
        fontStyle="bold"
        fill="#0f172a"
        listening={false}
      />
      <Text
        x={12}
        y={32}
        text={`${SPACE_TYPE_LABELS[space.type]} · ${space.capacity}p`}
        fontSize={12}
        fill="#475569"
        listening={false}
      />
      <Text
        x={12}
        y={height - 22}
        text={SPACE_STATUS_LABELS[space.status]}
        fontSize={11}
        fill="#64748b"
        listening={false}
      />
    </Group>
  )
}
