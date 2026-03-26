import { useState, useEffect } from 'react';
import type { Room, Reservation } from '../types';
import { formatDateISO } from '../utils/dateUtils';

interface Props {
  rooms: Room[];
  initialDate?: Date;
  initialTime?: string;
  initialRoomId?: string;
  reservation?: Reservation | null;
  onSave: (reservation: Reservation) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const TIME_OPTIONS = Array.from({ length: 26 }, (_, i) => {
  const totalMin = 7 * 60 + i * 30;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
});

export default function ReservationModal({
  rooms,
  initialDate,
  initialTime,
  initialRoomId,
  reservation,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const isEdit = !!reservation;

  const [title, setTitle] = useState(reservation?.title ?? '');
  const [organizer, setOrganizer] = useState(reservation?.organizer ?? '');
  const [roomId, setRoomId] = useState(reservation?.roomId ?? initialRoomId ?? rooms[0]?.id ?? '');
  const [date, setDate] = useState(
    reservation?.date ?? (initialDate ? formatDateISO(initialDate) : formatDateISO(new Date()))
  );
  const [startTime, setStartTime] = useState(reservation?.startTime ?? initialTime ?? '09:00');
  const [endTime, setEndTime] = useState(reservation?.endTime ?? '10:00');
  const [attendees, setAttendees] = useState(String(reservation?.attendees ?? 1));
  const [description, setDescription] = useState(reservation?.description ?? '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit && initialTime) {
      const idx = TIME_OPTIONS.indexOf(initialTime);
      const nextIdx = idx >= 0 && idx + 2 < TIME_OPTIONS.length ? idx + 2 : idx + 1;
      setEndTime(TIME_OPTIONS[nextIdx] ?? '10:00');
    }
  }, [initialTime, isEdit]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!title.trim()) return setError('El título es obligatorio.');
    if (!organizer.trim()) return setError('El organizador es obligatorio.');
    if (startTime >= endTime) return setError('La hora de fin debe ser posterior a la de inicio.');

    const room = rooms.find(r => r.id === roomId);
    if (room && Number(attendees) > room.capacity) {
      return setError(`La sala ${room.name} tiene capacidad máxima de ${room.capacity} personas.`);
    }

    onSave({
      id: reservation?.id ?? generateId(),
      roomId,
      title: title.trim(),
      organizer: organizer.trim(),
      date,
      startTime,
      endTime,
      attendees: Number(attendees),
      description: description.trim() || undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            {isEdit ? 'Editar reserva' : 'Nueva reserva'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Reunión de equipo..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Organizer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organizador *</label>
            <input
              type="text"
              value={organizer}
              onChange={e => setOrganizer(e.target.value)}
              placeholder="Tu nombre..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Room */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sala</label>
            <select
              value={roomId}
              onChange={e => setRoomId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {rooms.map(room => (
                <option key={room.id} value={room.id}>
                  {room.name} (cap. {room.capacity})
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inicio</label>
              <select
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {TIME_OPTIONS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fin</label>
              <select
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {TIME_OPTIONS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Attendees */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asistentes</label>
            <input
              type="number"
              min={1}
              max={100}
              value={attendees}
              onChange={e => setAttendees(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Notas adicionales..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {isEdit && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(reservation!.id)}
                className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                Eliminar
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isEdit ? 'Guardar' : 'Reservar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
