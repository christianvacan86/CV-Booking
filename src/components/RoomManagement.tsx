import { useState } from 'react';
import type { Room } from '../types';

interface Props {
  rooms: Room[];
  onRoomsChange: (rooms: Room[]) => void;
}

const PRESET_COLORS = [
  '#2db135', '#e31e24', '#3b82f6', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
  '#10b981', '#6366f1',
];

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface FormState {
  name: string;
  capacity: string;
  color: string;
}

const EMPTY_FORM: FormState = { name: '', capacity: '8', color: PRESET_COLORS[0] };

export default function RoomManagement({ rooms, onRoomsChange }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState('');

  function openNew() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowForm(true);
  }

  function openEdit(room: Room) {
    setEditingId(room.id);
    setForm({ name: room.name, capacity: String(room.capacity), color: room.color });
    setError('');
    setShowForm(true);
  }

  function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta sala? Las reservas existentes no se borrarán.')) return;
    onRoomsChange(rooms.filter(r => r.id !== id));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) return setError('El nombre es obligatorio.');
    const cap = Number(form.capacity);
    if (!cap || cap < 1) return setError('La capacidad debe ser mayor que 0.');
    if (rooms.some(r => r.name.toLowerCase() === form.name.trim().toLowerCase() && r.id !== editingId)) {
      return setError('Ya existe una sala con ese nombre.');
    }

    if (editingId) {
      onRoomsChange(rooms.map(r =>
        r.id === editingId
          ? { ...r, name: form.name.trim(), capacity: cap, color: form.color }
          : r
      ));
    } else {
      onRoomsChange([...rooms, {
        id: generateId(),
        name: form.name.trim(),
        capacity: cap,
        color: form.color,
      }]);
    }
    setShowForm(false);
  }

  return (
    <div className="flex-1 overflow-auto bg-[#f0f2f4] p-4">
      <div className="bg-white rounded shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 text-base">Salas de reuniones</h2>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 bg-[#2db135] text-white text-sm font-medium rounded hover:bg-[#249a2c] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva sala
          </button>
        </div>

        {/* Table */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left">
              <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Color</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Capacidad</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rooms.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-sm">
                  No hay salas configuradas. Crea la primera.
                </td>
              </tr>
            )}
            {rooms.map(room => (
              <tr key={room.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-3">
                  <span
                    className="inline-block w-5 h-5 rounded"
                    style={{ backgroundColor: room.color }}
                  />
                </td>
                <td className="px-6 py-3 font-medium text-gray-700">{room.name}</td>
                <td className="px-6 py-3 text-gray-500">{room.capacity} personas</td>
                <td className="px-6 py-3 text-right">
                  <button
                    onClick={() => openEdit(room)}
                    className="text-[#2db135] hover:text-[#249a2c] font-medium mr-4 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(room.id)}
                    className="text-[#e31e24] hover:text-red-700 font-medium transition-colors"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800">
                {editingId ? 'Editar sala' : 'Nueva sala'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Sala de conferencias..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2db135] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad (personas) *</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={form.capacity}
                  onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2db135] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, color }))}
                      style={{ backgroundColor: color }}
                      className={`w-7 h-7 rounded-full transition-transform hover:scale-110
                        ${form.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#2db135] rounded-lg hover:bg-[#249a2c] transition-colors"
                >
                  {editingId ? 'Guardar' : 'Crear sala'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
