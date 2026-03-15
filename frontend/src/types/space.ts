export type SpaceType = 'MEETING_ROOM' | 'HOT_DESK' | 'OPEN_SPACE' | 'OTHER'
export type SpaceStatus = 'AVAILABLE' | 'MAINTENANCE' | 'OCCUPIED'

export type SpaceListItem = {
  id: string
  name: string
  code: string | null
  type: SpaceType
  capacity: number
  status: SpaceStatus
  positionX: number | null
  positionY: number | null
  equipements: string[]
}

export type SpaceDetail = Omit<SpaceListItem, 'equipements'> & {
  description: string | null
  positionX: number | null
  positionY: number | null
  equipements: { name: string; quantity?: number }[]
}

export type EquipementItem = { id: string; name: string }

export const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  MEETING_ROOM: 'Salle de réunion',
  HOT_DESK: 'Bureau',
  OPEN_SPACE: 'Open space',
  OTHER: 'Autre',
}

export const SPACE_STATUS_LABELS: Record<SpaceStatus, string> = {
  AVAILABLE: 'Disponible',
  MAINTENANCE: 'Indisponible',
  OCCUPIED: 'Occupé',
}

export const SPACE_STATUS_CLASS: Record<SpaceStatus, string> = {
  AVAILABLE: 'bg-status-available',
  MAINTENANCE: 'bg-status-unavailable',
  OCCUPIED: 'bg-status-occupied',
}
