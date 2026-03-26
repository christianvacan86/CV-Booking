import type { Reservation, Room } from '../types';
import { getEventPosition } from '../utils/dateUtils';

interface Props {
  reservation: Reservation;
  room: Room;
  onClick: (reservation: Reservation) => void;
  columnIndex: number;
  totalColumns: number;
}

export default function ReservationBlock({ reservation, room, onClick, columnIndex, totalColumns }: Props) {
  const { top, height } = getEventPosition(reservation.startTime, reservation.endTime);
  const width = 100 / totalColumns;
  const left = columnIndex * width;

  // Minimum visible height
  const visibleHeight = Math.max(height, 3);

  return (
    <div
      onClick={() => onClick(reservation)}
      title={`${reservation.title} (${reservation.startTime} - ${reservation.endTime})`}
      style={{
        position: 'absolute',
        top: `${top}%`,
        height: `${visibleHeight}%`,
        left: `${left + 1}%`,
        width: `${width - 2}%`,
        backgroundColor: room.color,
        borderLeft: `3px solid ${darken(room.color)}`,
      }}
      className="rounded-md px-1.5 py-0.5 cursor-pointer overflow-hidden z-10
                 hover:brightness-110 hover:shadow-md transition-all select-none"
    >
      <p className="text-white text-[11px] font-semibold leading-tight truncate">
        {reservation.title}
      </p>
      {height > 5 && (
        <p className="text-white/80 text-[10px] truncate leading-tight">
          {reservation.startTime}–{reservation.endTime}
        </p>
      )}
      {height > 8 && (
        <p className="text-white/70 text-[10px] truncate leading-tight">
          {reservation.organizer}
        </p>
      )}
    </div>
  );
}

function darken(hex: string): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - 40);
  const g = Math.max(0, ((num >> 8) & 0xff) - 40);
  const b = Math.max(0, (num & 0xff) - 40);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
