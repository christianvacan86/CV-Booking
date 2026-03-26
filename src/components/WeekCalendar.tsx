import { useMemo } from 'react';
import { isSameDay } from 'date-fns';
import type { Reservation, Room } from '../types';
import {
  getWeekDays,
  formatDayHeader,
  formatDateISO,
  WORK_HOURS,
  CALENDAR_START_MIN,
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
}

const HOUR_HEIGHT_PX = 60; // pixels per hour
const TOTAL_HEIGHT_PX = WORK_HOURS.length * HOUR_HEIGHT_PX;

export default function WeekCalendar({
  weekReference,
  reservations,
  rooms,
  selectedRoomId,
  onSlotClick,
  onReservationClick,
}: Props) {
  const days = useMemo(() => getWeekDays(weekReference), [weekReference]);

  const roomMap = useMemo(() => {
    const m: Record<string, Room> = {};
    rooms.forEach(r => { m[r.id] = r; });
    return m;
  }, [rooms]);

  /** Filter reservations per day, optionally filtered by room */
  function getDayReservations(day: Date): Reservation[] {
    const dateStr = formatDateISO(day);
    return reservations.filter(r => {
      if (r.date !== dateStr) return false;
      if (selectedRoomId && r.roomId !== selectedRoomId) return false;
      return true;
    });
  }

  /** Group overlapping reservations into columns */
  function layoutReservations(dayRes: Reservation[]): Array<{ reservation: Reservation; col: number; total: number }> {
    if (dayRes.length === 0) return [];

    const sorted = [...dayRes].sort((a, b) =>
      timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );

    // Simple column assignment
    const columns: number[][] = []; // columns[col] = [endMin, endMin, ...]
    const result: Array<{ reservation: Reservation; col: number; total: number }> = [];
    const assigned: Array<{ col: number }> = [];

    for (const res of sorted) {
      const startMin = timeToMinutes(res.startTime);
      const endMin = timeToMinutes(res.endTime);
      let placed = false;
      for (let c = 0; c < columns.length; c++) {
        const lastEnd = columns[c][columns[c].length - 1];
        if (startMin >= lastEnd) {
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
    sorted.forEach((res, i) => {
      result.push({ reservation: res, col: assigned[i].col, total });
    });
    return result;
  }

  function handleColumnClick(e: React.MouseEvent<HTMLDivElement>, day: Date) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relY = e.clientY - rect.top;
    const fraction = relY / TOTAL_HEIGHT_PX;
    const minuteOffset = Math.floor(fraction * (WORK_HOURS.length * 60) / 30) * 30;
    const totalMin = CALENDAR_START_MIN + minuteOffset;
    onSlotClick(day, minutesToTime(totalMin));
  }

  return (
    <div className="flex flex-col h-full overflow-auto calendar-scroll">
      {/* Day headers */}
      <div className="flex sticky top-0 z-20 bg-white border-b border-gray-200">
        {/* Time gutter */}
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
                  ${isToday ? 'bg-blue-600 text-white' : 'text-gray-700'}`}
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

          return (
            <div
              key={day.toISOString()}
              className={`flex-1 relative border-l border-gray-100 cursor-pointer min-w-0
                ${isToday ? 'bg-blue-50/30' : 'bg-white hover:bg-gray-50/50'}`}
              style={{ height: `${TOTAL_HEIGHT_PX}px` }}
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

              {/* Current time indicator */}
              {isToday && <CurrentTimeIndicator totalHeightPx={TOTAL_HEIGHT_PX} />}

              {/* Reservations */}
              {layout.map(({ reservation, col, total }) => {
                const room = roomMap[reservation.roomId];
                if (!room) return null;
                return (
                  <PixelReservationBlock
                    key={reservation.id}
                    reservation={reservation}
                    room={room}
                    col={col}
                    total={total}
                    totalHeightPx={TOTAL_HEIGHT_PX}
                    onClick={e => {
                      e.stopPropagation();
                      onReservationClick(reservation);
                    }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CurrentTimeIndicator({ totalHeightPx }: { totalHeightPx: number }) {
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const offsetMin = currentMin - CALENDAR_START_MIN;
  const totalCalMin = WORK_HOURS.length * 60;
  if (offsetMin < 0 || offsetMin > totalCalMin) return null;

  const top = (offsetMin / totalCalMin) * totalHeightPx;

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

interface PixelBlockProps {
  reservation: Reservation;
  room: Room;
  col: number;
  total: number;
  totalHeightPx: number;
  onClick: (e: React.MouseEvent) => void;
}

function PixelReservationBlock({ reservation, room, col, total, totalHeightPx, onClick }: PixelBlockProps) {
  const totalCalMin = WORK_HOURS.length * 60;
  const startMin = timeToMinutes(reservation.startTime) - CALENDAR_START_MIN;
  const endMin = timeToMinutes(reservation.endTime) - CALENDAR_START_MIN;

  const topPx = (startMin / totalCalMin) * totalHeightPx;
  const heightPx = Math.max(((endMin - startMin) / totalCalMin) * totalHeightPx, 18);

  const widthPct = 100 / total;
  const leftPct = col * widthPct;

  function darken(hex: string): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - 40);
    const g = Math.max(0, ((num >> 8) & 0xff) - 40);
    const b = Math.max(0, (num & 0xff) - 40);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  return (
    <div
      onClick={onClick}
      title={`${reservation.title}\n${reservation.startTime} – ${reservation.endTime}\n${room.name}`}
      style={{
        position: 'absolute',
        top: `${topPx}px`,
        height: `${heightPx}px`,
        left: `${leftPct + 1}%`,
        width: `${widthPct - 2}%`,
        backgroundColor: room.color + 'dd',
        borderLeft: `3px solid ${darken(room.color)}`,
      }}
      className="rounded-md px-1.5 py-0.5 cursor-pointer overflow-hidden z-10 hover:brightness-105 hover:shadow-md transition-all select-none"
    >
      <p className="text-white text-[11px] font-semibold leading-tight truncate">
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
    </div>
  );
}
