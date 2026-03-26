import { useState, useCallback, useEffect } from 'react';
import type { Reservation } from './types';
import {
  getRooms,
  getReservations,
  addReservation,
  updateReservation,
  deleteReservation,
} from './store';
import { getWeekLabel, nextWeek, prevWeek, formatDateISO } from './utils/dateUtils';
import WeekCalendar from './components/WeekCalendar';
import ReservationModal from './components/ReservationModal';
import RoomsPanel from './components/RoomsPanel';

const COMPANY_NAME = 'MI EMPRESA';
const APP_USER = 'cvaca';

interface ModalState {
  open: boolean;
  initialDate?: Date;
  initialTime?: string;
  initialRoomId?: string;
  editing?: Reservation;
}

export default function App() {
  const [rooms] = useState(() => getRooms());
  const [reservations, setReservations] = useState(() => getReservations());
  const [weekRef, setWeekRef] = useState(new Date());
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>({ open: false });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const refresh = () => setReservations(getReservations());
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);

  const handleSlotClick = useCallback((date: Date, time: string) => {
    setModal({
      open: true,
      initialDate: date,
      initialTime: time,
      initialRoomId: selectedRoomId ?? rooms[0]?.id,
    });
  }, [selectedRoomId, rooms]);

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

  const todayReservations = reservations.filter(
    r => r.date === formatDateISO(new Date())
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f2f4]">

      {/* ── Barra superior verde ── */}
      <header className="flex items-center h-11 px-3 bg-[#1e8449] flex-shrink-0 z-30">
        {/* Hamburger */}
        <button
          onClick={() => setSidebarOpen(v => !v)}
          className="text-white/80 hover:text-white p-1 mr-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Titulo app */}
        <span className="text-white font-semibold text-base tracking-wide">
          Reserva de Salas
        </span>

        <div className="flex-1" />

        {/* Usuario */}
        <div className="flex items-center gap-1.5 text-white/90 text-sm cursor-pointer hover:text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{APP_USER}</span>
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar blanco ── */}
        {sidebarOpen && (
          <aside className="w-52 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 overflow-y-auto z-20">

            {/* Nombre empresa */}
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-[11px] font-bold text-gray-700 tracking-widest uppercase">
                {COMPANY_NAME}
              </p>
            </div>

            {/* Menu de salas */}
            <div className="flex-1 py-2">
              <RoomsPanel
                rooms={rooms}
                selectedRoomId={selectedRoomId}
                onSelect={setSelectedRoomId}
              />

              {/* Seccion Hoy */}
              {todayReservations.length > 0 && (
                <div className="mt-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 mb-1">
                    Hoy
                  </p>
                  {todayReservations
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map(r => {
                      const room = rooms.find(rm => rm.id === r.roomId);
                      return (
                        <button
                          key={r.id}
                          onClick={() => handleReservationClick(r)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: room?.color ?? '#999' }}
                            />
                            <span className="text-xs text-gray-700 truncate">{r.title}</span>
                          </div>
                          <p className="text-[10px] text-gray-400 pl-4">{r.startTime}–{r.endTime}</p>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Stats footer */}
            <div className="px-4 py-3 border-t border-gray-100 flex gap-3">
              <div className="flex-1 text-center">
                <p className="text-base font-bold text-[#1e8449]">{rooms.length}</p>
                <p className="text-[10px] text-gray-400 uppercase">Salas</p>
              </div>
              <div className="w-px bg-gray-100" />
              <div className="flex-1 text-center">
                <p className="text-base font-bold text-[#1e8449]">{todayReservations.length}</p>
                <p className="text-[10px] text-gray-400 uppercase">Hoy</p>
              </div>
            </div>
          </aside>
        )}

        {/* ── Contenido principal ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Sub-cabecera blanca con titulo y acciones */}
          <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 flex-shrink-0">
            {/* Icono + titulo pagina */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#e8f5e9] rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-[#1e8449]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="font-semibold text-gray-800 text-base">Reserva de Salas</span>
            </div>

            <div className="flex-1" />

            {/* Navegacion semana */}
            <div className="flex items-center gap-1">
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
              <span className="text-sm text-gray-600 font-medium min-w-[175px] text-center">
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
            </div>

            {/* Boton nueva reserva */}
            <button
              onClick={() => setModal({ open: true, initialRoomId: selectedRoomId ?? rooms[0]?.id })}
              className="flex items-center gap-2 px-4 py-2 bg-[#1e8449] text-white text-sm font-medium rounded hover:bg-[#176b3a] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva reserva
            </button>
          </div>

          {/* Calendario */}
          <main className="flex-1 overflow-auto bg-[#f0f2f4] p-4">
            <div className="bg-white rounded shadow-sm h-full min-h-[600px]">
              <WeekCalendar
                weekReference={weekRef}
                reservations={reservations}
                rooms={rooms}
                selectedRoomId={selectedRoomId}
                onSlotClick={handleSlotClick}
                onReservationClick={handleReservationClick}
                onReservationUpdate={handleReservationUpdate}
              />
            </div>
          </main>
        </div>
      </div>

      {/* Modal */}
      {modal.open && (
        <ReservationModal
          rooms={rooms}
          initialDate={modal.initialDate}
          initialTime={modal.initialTime}
          initialRoomId={modal.initialRoomId}
          reservation={modal.editing}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  );
}
