import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { User, Room, Reservation } from '../types';
import {
  getReservations,
  addReservation,
  updateReservation,
  deleteReservation,
} from '../store';
import { timeToMinutes, getWeekLabel, nextWeek, prevWeek } from '../utils/dateUtils';
import { logout } from '../userStore';
import ZaimellaLogo from './ZaimellaLogo';
import WeekCalendar from './WeekCalendar';
import ReservationModal from './ReservationModal';

interface Props {
  user: User;
  room: Room;
  onLogout: () => void;
}

interface ModalState {
  open: boolean;
  initialDate?: Date;
  initialTime?: string;
  editing?: Reservation;
}

/** Devuelve la reserva activa ahora mismo en la sala, si existe */
function getCurrentReservation(reservations: Reservation[], roomId: string): Reservation | null {
  const now = new Date();
  const todayStr = format(now, 'yyyy-MM-dd');
  const nowMin = now.getHours() * 60 + now.getMinutes();

  return reservations.find(r =>
    r.roomId === roomId &&
    r.date === todayStr &&
    timeToMinutes(r.startTime) <= nowMin &&
    timeToMinutes(r.endTime) > nowMin
  ) ?? null;
}

/** Devuelve la proxima reserva de hoy en la sala, si existe */
function getNextReservation(reservations: Reservation[], roomId: string): Reservation | null {
  const now = new Date();
  const todayStr = format(now, 'yyyy-MM-dd');
  const nowMin = now.getHours() * 60 + now.getMinutes();

  return reservations
    .filter(r => r.roomId === roomId && r.date === todayStr && timeToMinutes(r.startTime) > nowMin)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))[0] ?? null;
}

export default function TabletView({ user, room, onLogout }: Props) {
  const [reservations, setReservations] = useState(() => getReservations());
  const [now, setNow] = useState(new Date());
  const [weekRef, setWeekRef] = useState(new Date());
  const [modal, setModal] = useState<ModalState>({ open: false });

  // Reloj en tiempo real
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  // Refresca reservas al enfocar
  useEffect(() => {
    const refresh = () => setReservations(getReservations());
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);

  const currentRes = getCurrentReservation(reservations, room.id);
  const nextRes = getNextReservation(reservations, room.id);
  const isOccupied = !!currentRes;

  const handleSlotClick = useCallback((date: Date, time: string) => {
    setModal({ open: true, initialDate: date, initialTime: time });
  }, []);

  const handleReservationClick = useCallback((res: Reservation) => {
    setModal({ open: true, editing: res });
  }, []);

  const handleSave = useCallback((res: Reservation) => {
    if (modal.editing) {
      updateReservation(res);
    } else {
      addReservation(res);
    }
    setReservations(getReservations());
    setModal({ open: false });
  }, [modal.editing]);

  const handleDelete = useCallback((id: string) => {
    deleteReservation(id);
    setReservations(getReservations());
    setModal({ open: false });
  }, []);

  const handleReservationUpdate = useCallback((res: Reservation) => {
    updateReservation(res);
    setReservations(getReservations());
  }, []);

  function handleLogout() {
    logout();
    onLogout();
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f2f4] select-none">

      {/* ── Cabecera ── */}
      <header className="bg-[#2db135] flex-shrink-0 shadow-md">
        <div className="flex items-center px-6 py-3 gap-4">
          {/* Logo */}
          <ZaimellaLogo className="h-8 w-auto brightness-0 invert opacity-90 flex-shrink-0" />

          <div className="w-px h-8 bg-white/20 flex-shrink-0" />

          {/* Nombre sala */}
          <div className="flex-1">
            <h1 className="text-white text-xl font-bold leading-tight">{room.name}</h1>
            <p className="text-white/70 text-xs">Capacidad: {room.capacity} personas</p>
          </div>

          {/* Fecha y hora */}
          <div className="text-right flex-shrink-0">
            <p className="text-white font-bold text-lg leading-tight">
              {format(now, 'HH:mm')}
            </p>
            <p className="text-white/80 text-xs capitalize">
              {format(now, "EEEE, d 'de' MMMM yyyy", { locale: es })}
            </p>
          </div>

          {/* Boton salir */}
          <button
            onClick={handleLogout}
            title="Salir del modo tablet"
            className="ml-2 text-white/50 hover:text-white transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>

        {/* ── Banner de estado ── */}
        <div
          className={`px-6 py-3 flex items-center justify-between transition-colors
            ${isOccupied ? 'bg-[#e31e24]' : 'bg-[#1a7a27]'}`}
        >
          <div className="flex items-center gap-3">
            {/* Indicador pulsante */}
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75
                ${isOccupied ? 'bg-red-200' : 'bg-green-200'}`} />
              <span className={`relative inline-flex rounded-full h-3 w-3
                ${isOccupied ? 'bg-red-100' : 'bg-green-100'}`} />
            </span>

            {isOccupied ? (
              <div>
                <p className="text-white font-bold text-sm">OCUPADA hasta las {currentRes!.endTime}</p>
                <p className="text-white/80 text-xs">{currentRes!.title} · {currentRes!.organizer}</p>
              </div>
            ) : (
              <p className="text-white font-bold text-sm">DISPONIBLE</p>
            )}
          </div>

          {/* Proxima reserva */}
          {nextRes && (
            <div className="text-right">
              <p className="text-white/70 text-xs">Próxima reserva</p>
              <p className="text-white text-sm font-medium">
                {nextRes.startTime} — {nextRes.title}
              </p>
            </div>
          )}
        </div>
      </header>

      {/* ── Navegacion semana + boton reservar ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-2 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => setWeekRef(prevWeek(weekRef))}
          className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={() => setWeekRef(new Date())}
          className="px-3 py-1 text-xs font-medium text-gray-600 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
        >
          Hoy
        </button>

        <span className="text-sm text-gray-600 font-medium flex-1 text-center">
          {getWeekLabel(weekRef)}
        </span>

        <button
          onClick={() => setWeekRef(nextWeek(weekRef))}
          className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Boton principal de reservar */}
        <button
          onClick={() => setModal({ open: true, initialDate: new Date() })}
          className="flex items-center gap-2 px-5 py-2 bg-[#2db135] text-white text-sm font-semibold rounded-lg hover:bg-[#249a2c] transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Reservar esta sala
        </button>
      </div>

      {/* ── Calendario ── */}
      <main className="flex-1 overflow-auto bg-[#f0f2f4] p-4">
        <div className="bg-white rounded shadow-sm h-full min-h-[500px]">
          <WeekCalendar
            weekReference={weekRef}
            reservations={reservations}
            rooms={[room]}
            selectedRoomId={room.id}
            onSlotClick={handleSlotClick}
            onReservationClick={handleReservationClick}
            onReservationUpdate={handleReservationUpdate}
          />
        </div>
      </main>

      {/* ── Modal reserva ── */}
      {modal.open && (
        <ReservationModal
          rooms={[room]}
          currentUser={user}
          initialDate={modal.initialDate}
          initialTime={modal.initialTime}
          initialRoomId={room.id}
          reservation={modal.editing}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  );
}
