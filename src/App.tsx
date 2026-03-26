import { useState, useCallback, useEffect } from 'react';
import type { Reservation, Room } from './types';
import {
  getRooms,
  saveRooms,
  getReservations,
  addReservation,
  updateReservation,
  deleteReservation,
} from './store';
import { getWeekLabel, nextWeek, prevWeek, formatDateISO } from './utils/dateUtils';
import WeekCalendar from './components/WeekCalendar';
import ReservationModal from './components/ReservationModal';
import RoomsPanel from './components/RoomsPanel';
import RoomManagement from './components/RoomManagement';
import ZaimellaLogo from './components/ZaimellaLogo';

const APP_USER = 'cvaca';

type ActiveView = 'calendar' | 'rooms';

interface ModalState {
  open: boolean;
  initialDate?: Date;
  initialTime?: string;
  initialRoomId?: string;
  editing?: Reservation;
}

export default function App() {
  const [rooms, setRooms] = useState<Room[]>(() => getRooms());
  const [reservations, setReservations] = useState(() => getReservations());
  const [weekRef, setWeekRef] = useState(new Date());
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>({ open: false });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<ActiveView>('calendar');

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

  const handleRoomsChange = useCallback((updated: Room[]) => {
    saveRooms(updated);
    setRooms(updated);
  }, []);

  const todayReservations = reservations.filter(
    r => r.date === formatDateISO(new Date())
  );

  // ── Sidebar nav items ──
  const navItems: Array<{ id: ActiveView; label: string; icon: React.ReactNode }> = [
    {
      id: 'calendar',
      label: 'Reservas',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'rooms',
      label: 'Administrar Salas',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f2f4]">

      {/* ── Barra superior ── */}
      <header className="flex items-center h-11 px-3 bg-[#2db135] flex-shrink-0 z-30 shadow-sm">
        <button
          onClick={() => setSidebarOpen(v => !v)}
          className="text-white/80 hover:text-white p-1 mr-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <span className="text-white font-semibold text-base tracking-wide">
          {activeView === 'calendar' ? 'Reserva de Salas' : 'Administrar Salas'}
        </span>

        <div className="flex-1" />

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

        {/* ── Sidebar ── */}
        {sidebarOpen && (
          <aside className="w-52 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 overflow-y-auto z-20">

            {/* Logo */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-center">
              <ZaimellaLogo className="h-9 w-auto" />
            </div>

            {/* Navegacion principal */}
            <nav className="py-2 border-b border-gray-100">
              {navItems.map(item => {
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left w-full group
                      ${isActive
                        ? 'bg-[#e8f5e9] text-[#2db135] font-medium border-r-2 border-[#2db135]'
                        : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <span className={isActive ? 'text-[#2db135]' : 'text-gray-400 group-hover:text-gray-500'}>
                      {item.icon}
                    </span>
                    <span className="flex-1">{item.label}</span>
                    <svg
                      className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-[#2db135]' : 'text-gray-300 group-hover:text-gray-400'}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                );
              })}
            </nav>

            {/* Filtro de salas (solo en vista calendario) */}
            {activeView === 'calendar' && (
              <div className="flex-1 py-2">
                <RoomsPanel
                  rooms={rooms}
                  selectedRoomId={selectedRoomId}
                  onSelect={setSelectedRoomId}
                />

                {/* Reservas de hoy */}
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
            )}

            {/* Stats footer */}
            <div className="px-4 py-3 border-t border-gray-100 flex gap-3">
              <div className="flex-1 text-center">
                <p className="text-base font-bold text-[#2db135]">{rooms.length}</p>
                <p className="text-[10px] text-gray-400 uppercase">Salas</p>
              </div>
              <div className="w-px bg-gray-100" />
              <div className="flex-1 text-center">
                <p className="text-base font-bold text-[#e31e24]">{todayReservations.length}</p>
                <p className="text-[10px] text-gray-400 uppercase">Hoy</p>
              </div>
            </div>
          </aside>
        )}

        {/* ── Contenido ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Sub-cabecera */}
          <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#e8f5e9] rounded-lg flex items-center justify-center">
                {activeView === 'calendar' ? (
                  <svg className="w-5 h-5 text-[#2db135]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-[#2db135]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                )}
              </div>
              <span className="font-semibold text-gray-800 text-base">
                {activeView === 'calendar' ? 'Reserva de Salas' : 'Administrar Salas'}
              </span>
            </div>

            <div className="flex-1" />

            {/* Controles solo en vista calendario */}
            {activeView === 'calendar' && (
              <>
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
                <button
                  onClick={() => setModal({ open: true, initialRoomId: selectedRoomId ?? rooms[0]?.id })}
                  className="flex items-center gap-2 px-4 py-2 bg-[#2db135] text-white text-sm font-medium rounded hover:bg-[#249a2c] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nueva reserva
                </button>
              </>
            )}
          </div>

          {/* Vista activa */}
          {activeView === 'calendar' ? (
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
          ) : (
            <RoomManagement rooms={rooms} onRoomsChange={handleRoomsChange} />
          )}
        </div>
      </div>

      {/* Modal reserva */}
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
