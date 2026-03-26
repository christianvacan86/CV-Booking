import type { Room } from '../types';

interface Props {
  rooms: Room[];
  selectedRoomId: string | null;
  onSelect: (id: string | null) => void;
}

export default function RoomsPanel({ rooms, selectedRoomId, onSelect }: Props) {
  return (
    <div className="flex flex-col">
      {/* Item "Todas las salas" */}
      <button
        onClick={() => onSelect(null)}
        className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left w-full group
          ${selectedRoomId === null
            ? 'bg-[#e8f5e9] text-[#1e8449] font-medium border-r-2 border-[#1e8449]'
            : 'text-gray-600 hover:bg-gray-50'}`}
      >
        {/* Icono calendario */}
        <svg className={`w-4 h-4 flex-shrink-0 ${selectedRoomId === null ? 'text-[#1e8449]' : 'text-gray-400'}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="flex-1 truncate">Todas las salas</span>
        {/* Chevron */}
        <svg className={`w-3.5 h-3.5 flex-shrink-0 ${selectedRoomId === null ? 'text-[#1e8449]' : 'text-gray-300 group-hover:text-gray-400'}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Items de cada sala */}
      {rooms.map(room => {
        const isActive = selectedRoomId === room.id;
        return (
          <button
            key={room.id}
            onClick={() => onSelect(isActive ? null : room.id)}
            className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left w-full group
              ${isActive
                ? 'bg-[#e8f5e9] text-[#1e8449] font-medium border-r-2 border-[#1e8449]'
                : 'text-gray-600 hover:bg-gray-50'}`}
          >
            {/* Punto de color de la sala */}
            <span
              className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center"
            >
              <span
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: room.color }}
              />
            </span>
            <span className="flex-1 truncate">{room.name}</span>
            <span className={`text-[11px] flex-shrink-0 ${isActive ? 'text-[#1e8449]' : 'text-gray-300'}`}>
              {room.capacity}
            </span>
            <svg className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-[#1e8449]' : 'text-gray-300 group-hover:text-gray-400'}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
