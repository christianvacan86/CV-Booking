import { useState, useCallback, useEffect } from 'react';
import type { Reservation, Room, User } from './types';
import {
  getRooms,
  saveRooms,
  getReservations,
  addReservation,
  updateReservation,
  deleteReservation,
} from './store';
import { getWeekLabel, nextWeek, prevWeek, formatDateISO } from './utils/dateUtils';
import { getCurrentUser } from './userStore';
import WeekCalendar from './components/WeekCalendar';
import ReservationModal from './components/ReservationModal';
import RoomManagement from './components/RoomManagement';
import Sidebar from './components/Sidebar';
import LoginScreen from './components/LoginScreen';
import TabletView from './components/TabletView';

type ActiveView = 'calendar' | 'rooms';

interface ModalState {
  open: boolean;
  initialDate?: Date;
  initialTime?: string;
  initialRoomId?: string;
  editing?: Reservation;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentUser());
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

  // ── Handlers ──
  const handleSlotClick = useCallback((date: Date, time: string) => {
    if (!currentUser) return;
    setModal({
      open: true,
      initialDate: date,
      initialTime: time,
      initialRoomId: selectedRoomId ?? rooms[0]?.id,
    });
  }, [selectedRoomId, rooms, currentUser]);

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
    // Drag & drop: solo el dueno o admin puede mover
    if (!currentUser) return;
    const original = reservations.find(r => r.id === res.id);
    if (original && currentUser.role !== 'admin' && original.userId !== currentUser.id) return;
    updateReservation(res);
    setReservations(getReservations());
  }, [currentUser, reservations]);

  const handleRoomsChange = useCallback((updated: Room[]) => {
    saveRooms(updated);
    setRooms(updated);
  }, []);

  const todayReservations = reservations.filter(
    r => r.date === formatDateISO(new Date())
  );

  // ── Pantalla de login ──
  if (!currentUser) {
    return <LoginScreen onLogin={user => setCurrentUser(user)} />;
  }

  // ── Vista tablet ──
  if (currentUser.role === 'tablet') {
    const tabletRoom = rooms.find(r => r.id === currentUser.roomId);
    if (!tabletRoom) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#f0f2f4]">
          <p className="text-gray-500">Sala no encontrada para este usuario tablet.</p>
        </div>
      );
    }
    return (
      <TabletView
        user={currentUser}
        room={tabletRoom}
        onLogout={() => setCurrentUser(null)}
      />
    );
  }

  const pageTitle = activeView === 'calendar' ? 'Reserva de Salas' : 'Administrar Salas';

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f2f4]">

      {/* Barra superior */}
      <header className="flex items-center h-11 px-3 bg-[#2db135] flex-shrink-0 z-30 shadow-sm">
        <button
          onClick={() => setSidebarOpen(v => !v)}
          className="text-white/80 hover:text-white p-1 mr-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-white font-semibold text-base tracking-wide">Reserva de Salas de Reuniones</span>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5 text-white/90 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{currentUser.name}</span>
          <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-medium
            ${currentUser.role === 'admin' ? 'bg-white/20 text-white' : 'bg-white/10 text-white/70'}`}>
            {currentUser.role === 'admin' ? 'Admin' : 'Usuario'}
          </span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar colapsable */}
        {sidebarOpen && (
          <Sidebar
            user={currentUser}
            rooms={rooms}
            selectedRoomId={selectedRoomId}
            activeView={activeView}
            todayReservations={todayReservations}
            onSelectRoom={setSelectedRoomId}
            onSelectView={setActiveView}
            onReservationClick={handleReservationClick}
            onLogout={() => setCurrentUser(null)}
          />
        )}

        {/* Contenido */}
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
              <span className="font-semibold text-gray-800 text-base">Reserva de Salas de Reuniones</span>
            </div>

            <div className="flex-1" />

            {activeView === 'calendar' && (
              <>
                <div className="flex items-center gap-1">
                  <button onClick={() => setWeekRef(prevWeek(weekRef))}
                    className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button onClick={() => setWeekRef(new Date())}
                    className="px-3 py-1 text-xs font-medium text-gray-600 border border-gray-200 rounded hover:bg-gray-50 transition-colors">
                    Hoy
                  </button>
                  <span className="text-sm text-gray-600 font-medium min-w-[175px] text-center">
                    {getWeekLabel(weekRef)}
                  </span>
                  <button onClick={() => setWeekRef(nextWeek(weekRef))}
                    className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
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

          {/* Vista */}
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
      {modal.open && currentUser && (
        <ReservationModal
          rooms={rooms}
          currentUser={currentUser}
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
