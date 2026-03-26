import { useState } from 'react';
import type { Room, User, Reservation } from '../types';
import ZaimellaLogo from './ZaimellaLogo';
import { logout } from '../userStore';

interface Props {
  user: User;
  rooms: Room[];
  selectedRoomId: string | null;
  activeView: 'calendar' | 'rooms';
  todayReservations: Reservation[];
  onSelectRoom: (id: string | null) => void;
  onSelectView: (view: 'calendar' | 'rooms') => void;
  onReservationClick: (r: Reservation) => void;
  onLogout: () => void;
}

export default function Sidebar({
  user,
  rooms,
  selectedRoomId,
  activeView,
  todayReservations,
  onSelectRoom,
  onSelectView,
  onReservationClick,
  onLogout,
}: Props) {
  // Estado de colapso por seccion
  const [reservasOpen, setReservasOpen] = useState(true);
  const [salasOpen, setSalasOpen] = useState(false); // "Administrar Salas" colapsado por defecto

  const isAdmin = user.role === 'admin';

  function handleLogout() {
    logout();
    onLogout();
  }

  return (
    <aside className="w-52 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 overflow-y-auto z-20">

      {/* Logo */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-center">
        <ZaimellaLogo className="h-9 w-auto" />
      </div>

      {/* Nav colapsable */}
      <nav className="flex-1 py-2">

        {/* ── Seccion Reservas ── */}
        <SectionHeader
          label="Reservas"
          isOpen={reservasOpen}
          isActive={activeView === 'calendar'}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          onClick={() => {
            setReservasOpen(v => !v);
            onSelectView('calendar');
          }}
        />

        {reservasOpen && (
          <div className="ml-2 border-l-2 border-gray-100 ml-6 py-0.5">
            {/* Todas las salas */}
            <SubItem
              label="Todas las salas"
              isActive={activeView === 'calendar' && selectedRoomId === null}
              color={undefined}
              onClick={() => { onSelectView('calendar'); onSelectRoom(null); }}
            />
            {/* Una por sala */}
            {rooms.map(room => (
              <SubItem
                key={room.id}
                label={room.name}
                isActive={activeView === 'calendar' && selectedRoomId === room.id}
                color={room.color}
                badge={String(room.capacity)}
                onClick={() => { onSelectView('calendar'); onSelectRoom(room.id); }}
              />
            ))}
          </div>
        )}

        {/* ── Seccion Administrar Salas (solo admin) ── */}
        {isAdmin && (
          <>
            <SectionHeader
              label="Administrar Salas"
              isOpen={salasOpen}
              isActive={activeView === 'rooms'}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
              onClick={() => {
                setSalasOpen(v => !v);
                onSelectView('rooms');
              }}
            />

            {salasOpen && (
              <div className="ml-6 border-l-2 border-gray-100 py-0.5">
                <SubItem
                  label="Lista de salas"
                  isActive={activeView === 'rooms'}
                  onClick={() => onSelectView('rooms')}
                />
              </div>
            )}
          </>
        )}

        {/* ── Reservas de hoy ── */}
        {todayReservations.length > 0 && activeView === 'calendar' && (
          <div className="mt-3 px-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Hoy</p>
            {todayReservations
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map(r => {
                const room = rooms.find(rm => rm.id === r.roomId);
                return (
                  <button
                    key={r.id}
                    onClick={() => onReservationClick(r)}
                    className="w-full text-left py-1.5 hover:bg-gray-50 rounded transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: room?.color ?? '#999' }} />
                      <span className="text-xs text-gray-700 truncate">{r.title}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 pl-4">{r.startTime}–{r.endTime}</p>
                  </button>
                );
              })}
          </div>
        )}
      </nav>

      {/* Footer: usuario + logout */}
      <div className="border-t border-gray-100">
        {/* Stats */}
        <div className="px-4 py-2 flex gap-3">
          <div className="flex-1 text-center">
            <p className="text-sm font-bold text-[#2db135]">{rooms.length}</p>
            <p className="text-[10px] text-gray-400 uppercase">Salas</p>
          </div>
          <div className="w-px bg-gray-100" />
          <div className="flex-1 text-center">
            <p className="text-sm font-bold text-[#e31e24]">{todayReservations.length}</p>
            <p className="text-[10px] text-gray-400 uppercase">Hoy</p>
          </div>
        </div>

        {/* Usuario actual */}
        <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#2db135] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[11px] font-bold">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-700 truncate">{user.name}</p>
            <p className="text-[10px] text-gray-400 capitalize">{user.role === 'admin' ? 'Administrador' : 'Usuario'}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="text-gray-400 hover:text-[#e31e24] transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}

/* ── Cabecera de seccion colapsable ── */
function SectionHeader({
  label,
  icon,
  isOpen,
  isActive,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  isOpen: boolean;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2.5 text-sm w-full text-left transition-colors group
        ${isActive
          ? 'text-[#2db135] font-semibold bg-[#e8f5e9] border-r-2 border-[#2db135]'
          : 'text-gray-600 hover:bg-gray-50'}`}
    >
      <span className={isActive ? 'text-[#2db135]' : 'text-gray-400 group-hover:text-gray-500'}>
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {/* Chevron rota segun estado */}
      <svg
        className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200
          ${isOpen ? 'rotate-90' : ''}
          ${isActive ? 'text-[#2db135]' : 'text-gray-300 group-hover:text-gray-400'}`}
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

/* ── Sub-item dentro de una seccion ── */
function SubItem({
  label,
  isActive,
  color,
  badge,
  onClick,
}: {
  label: string;
  isActive: boolean;
  color?: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 pl-3 pr-4 py-2 text-xs w-full text-left transition-colors rounded-r-lg
        ${isActive
          ? 'text-[#2db135] font-semibold bg-[#e8f5e9]'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
    >
      {color ? (
        <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? 'bg-[#2db135]' : 'bg-gray-300'}`} />
      )}
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <span className={`text-[10px] flex-shrink-0 ${isActive ? 'text-[#2db135]' : 'text-gray-300'}`}>
          {badge}
        </span>
      )}
    </button>
  );
}
