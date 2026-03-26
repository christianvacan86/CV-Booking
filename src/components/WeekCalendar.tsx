import { useMemo, useState } from 'react';
import { isSameDay } from 'date-fns';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import type { Reservation, Room } from '../types';
import {
  getWeekDays,
  formatDayHeader,
  formatDateISO,
  WORK_HOURS,
  CALENDAR_START_MIN,
  CALENDAR_END_MIN,
  timeToMinutes,
  minutesToTime,
} from '../utils/dateUtils';

interface Props {
  weekReference: Date;
  reservations: Reservation[];
  rooms: Room[];
  selectedRoomId: string | null;
  onSlotClick: (date: Date, time: string) => void;
  onReservationClick: (reservation: Reservation) => void;
  onReservationUpdate: (reservation: Reservation) => void;
}

const HOUR_HEIGHT_PX = 60; // 1px = 1 minute
const TOTAL_HEIGHT_PX = WORK_HOURS.length * HOUR_HEIGHT_PX;

function darken(hex: string): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - 40);
  const g = Math.max(0, ((num >> 8) & 0xff) - 40);
  const b = Math.max(0, (num & 0xff) - 40);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export default function WeekCalendar({
  weekReference,
  reservations,
  rooms,
  selectedRoomId,
  onSlotClick,
  onReservationClick,
  onReservationUpdate,
}: Props) {
  const days = useMemo(() => getWeekDays(weekReference), [weekReference]);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const roomMap = useMemo(() => {
    const m: Record<string, Room> = {};
    rooms.forEach(r => { m[r.id] = r; });
    return m;
  }, [rooms]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function getDayReservations(day: Date): Reservation[] {
    const dateStr = formatDateISO(day);
    return reservations.filter(r => {
      if (r.date !== dateStr) return false;
      if (selectedRoomId && r.roomId !== selectedRoomId) return false;
      return true;
    });
  }

  function layoutReservations(dayRes: Reservation[]): Array<{ reservation: Reservation; col: number; total: number }> {
    if (dayRes.length === 0) return [];
    const sorted = [...dayRes].sort((a, b) =>
      timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );
    const columns: number[][] = [];
    const assigned: Array<{ col: number }> = [];
    for (const res of sorted) {
      const startMin = timeToMinutes(res.startTime);
      const endMin = timeToMinutes(res.endTime);
      let placed = false;
      for (let c = 0; c < columns.length; c++) {
        if (startMin >= columns[c][columns[c].length - 1]) {
          columns[c].push(endMin);
          assigned.push({ col: c });
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push([endMin]);
        assigned.push({ col: columns.length - 1 });
      }
    }
    const total = columns.length;
    return sorted.map((res, i) => ({ reservation: res, col: assigned[i].col, total }));
  }

  function handleColumnClick(e: React.MouseEvent<HTMLDivElement>, day: Date) {
    if (draggingId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relY = e.clientY - rect.top;
    const minuteOffset = Math.floor(relY / HOUR_HEIGHT_PX * 60 / 30) * 30;
    const totalMin = CALENDAR_START_MIN + minuteOffset;
    onSlotClick(day, minutesToTime(totalMin));
  }

  // Active reservation being dragged (for DragOverlay)
  const draggingReservation = draggingId
    ? reservations.find(r => r.id === draggingId)
    : null;
  const draggingRoom = draggingReservation
    ? roomMap[draggingReservation.roomId]
    : null;

  return (
    <DndContext
      sensors={sensors}
      modifiers={[restrictToWindowEdges]}
      onDragStart={({ active }) => setDraggingId(String(active.id))}
      onDragCancel={() => setDraggingId(null)}
      onDragEnd={({ active, over, delta }) => {
        setDraggingId(null);
        if (!over) return;

        const reservation = reservations.find(r => r.id === active.id);
        if (!reservation) return;

        // delta.y in px = minutes shift (since HOUR_HEIGHT_PX=60 → 1px=1min)
        const minuteShift = Math.round(delta.y / 30) * 30;
        const duration =
          timeToMinutes(reservation.endTime) - timeToMinutes(reservation.startTime);
        const newStartMin = Math.max(
          CALENDAR_START_MIN,
          Math.min(
            CALENDAR_END_MIN - duration,
            timeToMinutes(reservation.startTime) + minuteShift
          )
        );

        onReservationUpdate({
          ...reservation,
          date: String(over.id),
          startTime: minutesToTime(newStartMin),
          endTime: minutesToTime(newStartMin + duration),
        });
      }}
    >
      <div className="flex flex-col h-full overflow-auto calendar-scroll">
        {/* Day headers */}
        <div className="flex sticky top-0 z-20 bg-white border-b border-gray-200">
          <div className="w-14 flex-shrink-0" />
          {days.map(day => {
            const { day: dayLabel, num, isToday } = formatDayHeader(day);
            return (
              <div
                key={day.toISOString()}
                className="flex-1 flex flex-col items-center py-2 border-l border-gray-100 min-w-0"
              >
                <span className="text-[11px] font-medium text-gray-400 tracking-widest">{dayLabel}</span>
                <span
                  className={`text-sm font-semibold mt-0.5 w-7 h-7 flex items-center justify-center rounded-full
                    ${isToday ? 'bg-[#1e8449] text-white' : 'text-gray-700'}`}
                >
                  {num}
                </span>
              </div>
            );
          })}
        </div>

        {/* Calendar grid */}
        <div className="flex flex-1 min-h-0">
          {/* Time gutter */}
          <div
            className="w-14 flex-shrink-0 relative border-r border-gray-200"
            style={{ height: `${TOTAL_HEIGHT_PX}px` }}
          >
            {WORK_HOURS.map((hour, i) => (
              <div
                key={hour}
                className="absolute w-full flex items-start justify-end pr-2"
                style={{ top: `${i * HOUR_HEIGHT_PX - 9}px` }}
              >
                {i > 0 && (
                  <span className="text-[11px] text-gray-400">
                    {String(hour).padStart(2, '0')}:00
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map(day => {
            const dayRes = getDayReservations(day);
            const layout = layoutReservations(dayRes);
            const isToday = isSameDay(day, new Date());
            const dateStr = formatDateISO(day);

            return (
              <DroppableColumn
                key={dateStr}
                dateStr={dateStr}
                isToday={isToday}
                onClick={e => handleColumnClick(e, day)}
              >
                {/* Hour lines */}
                {WORK_HOURS.map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-full border-t border-gray-100"
                    style={{ top: `${i * HOUR_HEIGHT_PX}px` }}
                  />
                ))}
                {/* Half-hour lines */}
                {WORK_HOURS.map((_, i) => (
                  <div
                    key={`h${i}`}
                    className="absolute w-full border-t border-gray-50"
                    style={{ top: `${i * HOUR_HEIGHT_PX + HOUR_HEIGHT_PX / 2}px` }}
                  />
                ))}

                {isToday && <CurrentTimeIndicator />}

                {layout.map(({ reservation, col, total }) => {
                  const room = roomMap[reservation.roomId];
                  if (!room) return null;
                  return (
                    <DraggableReservationBlock
                      key={reservation.id}
                      reservation={reservation}
                      room={room}
                      col={col}
                      total={total}
                      isDragging={draggingId === reservation.id}
                      onClick={e => {
                        e.stopPropagation();
                        onReservationClick(reservation);
                      }}
                    />
                  );
                })}
              </DroppableColumn>
            );
          })}
        </div>
      </div>

      {/* Ghost shown while dragging */}
      <DragOverlay dropAnimation={null}>
        {draggingReservation && draggingRoom ? (
          <ReservationGhost reservation={draggingReservation} room={draggingRoom} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

/* ── Droppable column ── */
function DroppableColumn({
  dateStr,
  isToday,
  onClick,
  children,
}: {
  dateStr: string;
  isToday: boolean;
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dateStr });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 relative border-l border-gray-100 cursor-pointer min-w-0 transition-colors
        ${isOver ? 'bg-[#e8f5e9]' : isToday ? 'bg-blue-50/30' : 'bg-white hover:bg-gray-50/50'}`}
      style={{ height: `${TOTAL_HEIGHT_PX}px` }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

/* ── Draggable reservation block ── */
interface DraggableBlockProps {
  reservation: Reservation;
  room: Room;
  col: number;
  total: number;
  isDragging: boolean;
  onClick: (e: React.MouseEvent) => void;
}

function DraggableReservationBlock({
  reservation,
  room,
  col,
  total,
  isDragging,
  onClick,
}: DraggableBlockProps) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: reservation.id });

  const totalCalMin = WORK_HOURS.length * 60;
  const startMin = timeToMinutes(reservation.startTime) - CALENDAR_START_MIN;
  const endMin = timeToMinutes(reservation.endTime) - CALENDAR_START_MIN;
  const topPx = (startMin / totalCalMin) * TOTAL_HEIGHT_PX;
  const heightPx = Math.max(((endMin - startMin) / totalCalMin) * TOTAL_HEIGHT_PX, 18);
  const widthPct = 100 / total;
  const leftPct = col * widthPct;

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      title={`${reservation.title}\n${reservation.startTime} – ${reservation.endTime}\n${room.name}`}
      style={{
        position: 'absolute',
        top: `${topPx}px`,
        height: `${heightPx}px`,
        left: `${leftPct + 1}%`,
        width: `${widthPct - 2}%`,
        backgroundColor: isDragging ? 'transparent' : room.color + 'dd',
        borderLeft: isDragging ? '3px solid transparent' : `3px solid ${darken(room.color)}`,
        opacity: isDragging ? 0.3 : 1,
      }}
      className="rounded-md px-1.5 py-0.5 overflow-hidden z-10 select-none transition-opacity"
      {...listeners}
      {...attributes}
    >
      {!isDragging && (
        <>
          <p className="text-white text-[11px] font-semibold leading-tight truncate cursor-grab active:cursor-grabbing">
            {reservation.title}
          </p>
          {heightPx > 30 && (
            <p className="text-white/80 text-[10px] truncate leading-tight">
              {reservation.startTime}–{reservation.endTime}
            </p>
          )}
          {heightPx > 44 && (
            <p className="text-white/70 text-[10px] truncate leading-tight">
              {room.name}
            </p>
          )}
        </>
      )}
    </div>
  );
}

/* ── Ghost shown in DragOverlay ── */
function ReservationGhost({ reservation, room }: { reservation: Reservation; room: Room }) {
  const totalCalMin = WORK_HOURS.length * 60;
  const startMin = timeToMinutes(reservation.startTime) - CALENDAR_START_MIN;
  const endMin = timeToMinutes(reservation.endTime) - CALENDAR_START_MIN;
  const heightPx = Math.max(((endMin - startMin) / totalCalMin) * TOTAL_HEIGHT_PX, 18);

  return (
    <div
      style={{
        height: `${heightPx}px`,
        width: '120px',
        backgroundColor: room.color + 'ee',
        borderLeft: `3px solid ${darken(room.color)}`,
      }}
      className="rounded-md px-1.5 py-0.5 shadow-xl opacity-90 select-none"
    >
      <p className="text-white text-[11px] font-semibold leading-tight truncate">
        {reservation.title}
      </p>
      <p className="text-white/80 text-[10px] truncate leading-tight">
        {reservation.startTime}–{reservation.endTime}
      </p>
    </div>
  );
}

/* ── Current time indicator ── */
function CurrentTimeIndicator() {
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const offsetMin = currentMin - CALENDAR_START_MIN;
  const totalCalMin = WORK_HOURS.length * 60;
  if (offsetMin < 0 || offsetMin > totalCalMin) return null;
  const top = (offsetMin / totalCalMin) * TOTAL_HEIGHT_PX;

  return (
    <div
      className="absolute w-full z-10 pointer-events-none"
      style={{ top: `${top}px` }}
    >
      <div className="relative flex items-center">
        <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 flex-shrink-0" />
        <div className="flex-1 h-px bg-red-500" />
      </div>
    </div>
  );
}
