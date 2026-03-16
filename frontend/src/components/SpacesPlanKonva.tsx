import { Stage, Layer, Rect, Text } from "react-konva";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { SpaceListItem, SpaceDetail } from "@/types/space";
import {
  SPACE_STATUS_CLASS,
  SPACE_STATUS_LABELS,
  SPACE_TYPE_LABELS,
} from "@/types/space";
import type { ReservationCalendarItem } from "@/types/reservation";
import { getDayRange, toIsoString } from "@/lib/date";
import { useAuth } from "@/contexts/AuthContext";

type SpacesPlanKonvaProps = {
  onSelectSpace: (space: SpaceDetail) => void;
  editable?: boolean;
  onPositionChange?: (spaceId: string, x: number, y: number) => void;
};

type SpaceWithBusy = SpaceListItem & {
  isBusyToday: boolean;
  positionX?: number | null;
  positionY?: number | null;
};

export function SpacesPlanKonva({
  onSelectSpace,
  editable = false,
  onPositionChange,
}: SpacesPlanKonvaProps) {
  const { user } = useAuth();
  const [spaces, setSpaces] = useState<SpaceWithBusy[]>([]);
  const [detailsById, setDetailsById] = useState<Record<string, SpaceDetail>>(
    {},
  );

  useEffect(() => {
    api<SpaceListItem[]>("/spaces")
      .then((items) => {
        const extended: SpaceWithBusy[] = items.map((s) => ({
          ...s,
          isBusyToday: false,
        }));
        setSpaces(extended);
      })
      .catch(() => {
        setSpaces([]);
      });
  }, []);

  useEffect(() => {
    if (!user || spaces.length === 0) return;
    const today = new Date();
    const { start, end } = getDayRange(today);
    const params = new URLSearchParams({
      start: toIsoString(start),
      end: toIsoString(end),
    });
    api<ReservationCalendarItem[]>(`/reservations?${params.toString()}`)
      .then((items) => {
        const busyBySpace = new Set(items.map((r) => r.spaceId));
        setSpaces((prev) =>
          prev.map((s) => ({
            ...s,
            isBusyToday: busyBySpace.has(s.id),
          })),
        );
      })
      .catch(() => {
        // garder les états par défaut
      });
  }, [user, spaces.length]);

  const width = 800;
  const height = 400;

  const positionedSpaces = useMemo(() => {
    if (spaces.length === 0) return [];
    const cols = Math.ceil(Math.sqrt(spaces.length));
    const rows = Math.ceil(spaces.length / cols);
    const cellWidth = width / cols;
    const cellHeight = height / rows;

    return spaces.map((space, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const defaultX = col * cellWidth + 16;
      const defaultY = row * cellHeight + 16;
      const x = space.positionX ?? defaultX;
      const y = space.positionY ?? defaultY;
      const w = cellWidth - 32;
      const h = cellHeight - 32;
      return { space, x, y, w, h };
    });
  }, [spaces, width, height]);

  async function handleClick(spaceId: string) {
    let detail = detailsById[spaceId];
    if (!detail) {
      try {
        detail = await api<SpaceDetail>(`/spaces/${spaceId}`);
        setDetailsById((prev) => ({ ...prev, [spaceId]: detail! }));
      } catch {
        return;
      }
    }
    onSelectSpace(detail);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Plan des espaces
          </h2>
          <p className="text-muted-foreground text-sm">
            Vue simplifiée des postes et salles pour aujourd&apos;hui
          </p>
        </div>
      </div>
      <div className="border rounded-lg bg-card">
        <Stage width={width} height={height}>
          <Layer>
            {positionedSpaces.map(({ space, x, y, w, h }) => {
              const statusClass = SPACE_STATUS_CLASS[space.status];
              const isBusy = space.isBusyToday;
              const fillClass = isBusy ? "bg-status-occupied" : statusClass;
              const bgColor =
                fillClass === "bg-status-available"
                  ? "#22c55e"
                  : fillClass === "bg-status-unavailable"
                    ? "#9ca3af"
                    : "#f97316";

              return (
                <GroupSpace
                  key={space.id}
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  space={space}
                  bgColor={bgColor}
                  onClick={() => handleClick(space.id)}
                  editable={editable}
                  onPositionChange={onPositionChange}
                />
              );
            })}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}

type GroupSpaceProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  space: SpaceListItem;
  bgColor: string;
  onClick: () => void;
  editable?: boolean;
  onPositionChange?: (spaceId: string, x: number, y: number) => void;
};

function GroupSpace({
  x,
  y,
  width,
  height,
  space,
  bgColor,
  onClick,
  editable = false,
  onPositionChange,
}: GroupSpaceProps) {
  return (
    <>
      <Rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={bgColor}
        cornerRadius={8}
        draggable={editable}
        onDragEnd={(evt) => {
          if (!editable || !onPositionChange) return;
          const node = evt.target;
          onPositionChange(space.id, node.x(), node.y());
        }}
        onClick={onClick}
      />
      <Text
        x={x + 8}
        y={y + 6}
        text={space.name}
        fontSize={14}
        fill="#111827"
        listening={false}
      />
      <Text
        x={x + 8}
        y={y + 26}
        text={`${SPACE_TYPE_LABELS[space.type]} · ${space.capacity}p`}
        fontSize={12}
        fill="#111827"
        listening={false}
      />
      <Text
        x={x + 8}
        y={y + height - 18}
        text={SPACE_STATUS_LABELS[space.status]}
        fontSize={11}
        fill="#111827"
        listening={false}
      />
    </>
  );
}
