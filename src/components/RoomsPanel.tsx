import type { Room } from '../types';

interface Props {
  rooms: Room[];
  selectedRoomId: string | null;
  onSelect: (id: string | null) => void;
}

export default function RoomsPanel({ rooms, selectedRoomId, onSelect }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1 px-2">
        Salas
      </p>
      <button
        onClick={() => onSelect(null)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left
          ${selectedRoomId === null
            ? 'bg-blue-50 text-blue-700 font-medium'
            : 'text-gray-600 hover:bg-gray-100'}`}
      >
        <span className="w-3 h-3 rounded-full bg-gray-400 flex-shrink-0" />
        Todas las salas
      </button>
      {rooms.map(room => (
        <button
          key={room.id}
          onClick={() => onSelect(room.id === selectedRoomId ? null : room.id)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left
            ${selectedRoomId === room.id
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-gray-600 hover:bg-gray-100'}`}
        >
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: room.color }}
          />
          <span className="truncate">{room.name}</span>
          <span className="ml-auto text-xs text-gray-400 flex-shrink-0">{room.capacity}</span>
        </button>
      ))}
    </div>
  );
}
