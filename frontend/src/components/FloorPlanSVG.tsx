import { useCallback, useRef, useState } from 'react'
import { SPACE_STATUS_CLASS, SPACE_STATUS_LABELS } from '@/types/space'
import type { SpaceType, SpaceStatus } from '@/types/space'

export type SpaceForPlan = {
  id: string
  name: string
  code: string | null
  type: SpaceType
  capacity: number
  status: SpaceStatus
  positionX: number | null
  positionY: number | null
  description?: string | null
}

type FloorPlanSVGProps = {
  spaces: SpaceForPlan[]
  mode: 'admin' | 'public'
  onPositionChange?: (spaceId: string, x: number, y: number) => void
  onSelectSpace?: (space: SpaceForPlan) => void
  onPlacementClick?: (x: number, y: number) => void
}

const PLAN_WIDTH = 1200
const PLAN_HEIGHT = 900

function getSpaceDimensions(space: SpaceForPlan): { w: number; h: number } {
  if (space.type === 'OPEN_SPACE') return { w: 1080, h: 430 }
  if (space.type === 'MEETING_ROOM' || space.type === 'HOT_DESK') return { w: 224, h: 144 }
  if (space.code === 'RECEPTION') return { w: 288, h: 144 }
  return { w: 224, h: 144 }
}

function getSpaceStyle(type: SpaceType, status: SpaceStatus) {
  const statusClass = SPACE_STATUS_CLASS[status]
  const isOccupied = statusClass === 'bg-status-occupied'
  const isUnavailable = statusClass === 'bg-status-unavailable'
  if (type === 'MEETING_ROOM' || type === 'HOT_DESK') {
    return {
      fill: isOccupied ? '#f97316' : isUnavailable ? '#94a3b8' : '#c084fc',
      stroke: '#9333ea',
    }
  }
  if (type === 'OPEN_SPACE') {
    return {
      fill: isOccupied ? '#f97316' : isUnavailable ? '#94a3b8' : '#60a5fa',
      stroke: '#2563eb',
    }
  }
  return {
    fill: isOccupied ? '#f97316' : isUnavailable ? '#94a3b8' : '#4ade80',
    stroke: '#16a34a',
  }
}

export function FloorPlanSVG({
  spaces,
  mode,
  onPositionChange,
  onSelectSpace,
  onPlacementClick,
}: FloorPlanSVGProps) {
  const positionedSpaces = spaces.filter((s) => s.positionX != null && s.positionY != null)
  const svgRef = useRef<SVGSVGElement>(null)

  const getSvgPointFromEvent = useCallback((e: React.MouseEvent) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse())
    return { x: svgP.x, y: svgP.y }
  }, [])

  const handlePlacementRectClick = useCallback(
    (e: React.MouseEvent) => {
      if (!onPlacementClick) return
      e.stopPropagation()
      const { x, y } = getSvgPointFromEvent(e)
      onPlacementClick(x, y)
    },
    [onPlacementClick, getSvgPointFromEvent]
  )

  return (
    <div className="w-full overflow-auto rounded-xl border border-border/60 bg-muted/10">
      <svg
        ref={svgRef}
        width={PLAN_WIDTH}
        height={PLAN_HEIGHT}
        viewBox={`0 0 ${PLAN_WIDTH} ${PLAN_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        className="max-w-full"
        style={{ cursor: onPlacementClick ? 'crosshair' : undefined }}
      >
        {/* Partie statique */}
        <rect width={PLAN_WIDTH} height={PLAN_HEIGHT} fill="#f9fafb" />
        <rect
          x={40}
          y={50}
          width={1100}
          height={800}
          fill="#e5e7eb"
          stroke="#1f2937"
          strokeWidth={4}
          rx={8}
        />
        {/* Zone ENTRÉE */}
        <rect x={568} y={848} width={128} height={16} fill="#1f2937" rx={0} />
        <rect x={568} y={856} width={128} height={8} fill="#1f2937" rx={0} />
        <text x={632} y={860} fontSize={10} fontWeight="bold" fill="white" textAnchor="middle">
          ENTRÉE
        </text>

        {/* Zone cliquable pour placement (sous les espaces) */}
        {onPlacementClick && (
          <rect
            x={50}
            y={50}
            width={1100}
            height={800}
            fill="transparent"
            onClick={handlePlacementRectClick}
            style={{ cursor: 'crosshair' }}
          />
        )}

        {/* Espaces dynamiques depuis la DB */}
        {positionedSpaces.map((space) => (
          <DraggableSpace
            key={space.id}
            space={space}
            mode={mode}
            onPositionChange={onPositionChange}
            onSelectSpace={onSelectSpace}
            svgRef={svgRef}
          />
        ))}
      </svg>
    </div>
  )
}

type DraggableSpaceProps = {
  space: SpaceForPlan
  mode: 'admin' | 'public'
  onPositionChange?: (spaceId: string, x: number, y: number) => void
  onSelectSpace?: (space: SpaceForPlan) => void
  svgRef: React.RefObject<SVGSVGElement | null>
}

function DraggableSpace({
  space,
  mode,
  onPositionChange,
  onSelectSpace,
  svgRef,
}: DraggableSpaceProps) {
  const x = space.positionX ?? 0
  const y = space.positionY ?? 0
  const { w, h } = getSpaceDimensions(space)
  const style = getSpaceStyle(space.type, space.status)

  const [dragState, setDragState] = useState<{
    isDragging: boolean
    startX: number
    startY: number
    startPosX: number
    startPosY: number
  } | null>(null)

  const getSvgPoint = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current
      if (!svg) return { x: 0, y: 0 }
      const pt = svg.createSVGPoint()
      pt.x = clientX
      pt.y = clientY
      const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse())
      return { x: svgP.x, y: svgP.y }
    },
    [svgRef]
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (mode !== 'admin' || !onPositionChange) return
      e.preventDefault()
      const pt = getSvgPoint(e.clientX, e.clientY)
      setDragState({
        isDragging: true,
        startX: pt.x,
        startY: pt.y,
        startPosX: x,
        startPosY: y,
      })
      ;(e.target as SVGElement).setPointerCapture(e.pointerId)
    },
    [mode, onPositionChange, x, y, getSvgPoint]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragState) return
      const pt = getSvgPoint(e.clientX, e.clientY)
      setDragState((prev) =>
        prev
          ? {
              ...prev,
              startPosX: prev.startPosX + (pt.x - prev.startX),
              startPosY: prev.startPosY + (pt.y - prev.startY),
              startX: pt.x,
              startY: pt.y,
            }
          : null
      )
    },
    [dragState, getSvgPoint]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (mode !== 'admin' || !onPositionChange) return
      ;(e.target as SVGElement).releasePointerCapture(e.pointerId)
      if (dragState) {
        const newX = Math.max(50, Math.min(1100 - w, dragState.startPosX))
        const newY = Math.max(50, Math.min(850 - h, dragState.startPosY))
        const moved = Math.abs(newX - x) > 2 || Math.abs(newY - y) > 2
        if (moved) {
          onPositionChange(space.id, newX, newY)
        }
        setDragState(null)
      }
    },
    [mode, onPositionChange, dragState, space.id, w, h, x, y]
  )

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (mode === 'public' && onSelectSpace) {
        e.stopPropagation()
        onSelectSpace(space)
      }
    },
    [mode, onSelectSpace, space]
  )

  const displayX = dragState ? dragState.startPosX : x
  const displayY = dragState ? dragState.startPosY : y

  return (
    <g
      transform={`translate(${displayX}, ${displayY})`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={handleClick}
      style={{
        cursor: mode === 'admin' ? 'grab' : mode === 'public' ? 'pointer' : 'default',
      }}
    >
      <rect
        x={0}
        y={0}
        width={w}
        height={h}
        fill={style.fill}
        stroke={style.stroke}
        strokeWidth={2}
        rx={8}
      />
      <text
        x={w / 2}
        y={h / 2 - 12}
        fontSize={space.type === 'OPEN_SPACE' ? 24 : 16}
        fontWeight="bold"
        fill="white"
        textAnchor="middle"
      >
        {space.name}
      </text>
      <text
        x={w / 2}
        y={h / 2 + 8}
        fontSize={14}
        fill="white"
        fillOpacity={0.9}
        textAnchor="middle"
      >
        {space.type === 'OPEN_SPACE'
          ? `${space.capacity} postes`
          : `${space.capacity} personne${space.capacity > 1 ? 's' : ''}`}
      </text>
      <text
        x={w / 2}
        y={h / 2 + 28}
        fontSize={12}
        fill="white"
        fillOpacity={0.8}
        textAnchor="middle"
      >
        {SPACE_STATUS_LABELS[space.status]}
      </text>
    </g>
  )
}
