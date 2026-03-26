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

  // Reload from localStorage when tab gains focus
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

  const todayReservations = reservations.filter(
    r => r.date === formatDateISO(new Date())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm flex-shrink-0">
        <button
          onClick={() => setSidebarOpen(v => !v)}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          title="Toggle sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="font-bold text-gray-800 text-lg">CV Booking</span>
        </div>

        <div className="flex-1" />

        {/* Week navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekRef(prevWeek(weekRef))}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={() => setWeekRef(new Date())}
            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
          >
            Hoy
          </button>

          <span className="text-sm text-gray-600 font-medium min-w-[180px] text-center">
            {getWeekLabel(weekRef)}
          </span>

          <button
            onClick={() => setWeekRef(nextWeek(weekRef))}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="flex-1" />

        {/* New reservation button */}
        <button
          onClick={() => setModal({ open: true, initialRoomId: selectedRoomId ?? rooms[0]?.id })}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva reserva
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-56 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 overflow-y-auto">
            <div className="p-4 flex-1">
              <RoomsPanel
                rooms={rooms}
                selectedRoomId={selectedRoomId}
                onSelect={setSelectedRoomId}
              />

              {/* Today's summary */}
              <div className="mt-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 px-2">
                  Hoy
                </p>
                {todayReservations.length === 0 ? (
                  <p className="text-xs text-gray-400 px-2">Sin reservas</p>
                ) : (
                  <div className="space-y-1">
                    {todayReservations
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map(r => {
                        const room = rooms.find(rm => rm.id === r.roomId);
                        return (
                          <button
                            key={r.id}
                            onClick={() => handleReservationClick(r)}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: room?.color ?? '#999' }}
                              />
                              <span className="text-xs font-medium text-gray-700 truncate">{r.title}</span>
                            </div>
                            <p className="text-[11px] text-gray-400 ml-3.5">{r.startTime}–{r.endTime}</p>
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="p-4 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-blue-50 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-blue-600">{rooms.length}</p>
                  <p className="text-[10px] text-blue-400 font-medium">Salas</p>
                </div>
                <div className="bg-green-50 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-green-600">{todayReservations.length}</p>
                  <p className="text-[10px] text-green-400 font-medium">Hoy</p>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Calendar area */}
        <main className="flex-1 overflow-auto bg-white">
          <WeekCalendar
            weekReference={weekRef}
            reservations={reservations}
            rooms={rooms}
            selectedRoomId={selectedRoomId}
            onSlotClick={handleSlotClick}
            onReservationClick={handleReservationClick}
          />
        </main>
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
