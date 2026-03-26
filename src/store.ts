import type { Room, Reservation } from './types';

const ROOMS_KEY = 'cvbooking_rooms';
const RESERVATIONS_KEY = 'cvbooking_reservations';

const DEFAULT_ROOMS: Room[] = [
  { id: '1', name: 'Sala Alpha', capacity: 8, color: '#3b82f6' },
  { id: '2', name: 'Sala Beta', capacity: 12, color: '#10b981' },
  { id: '3', name: 'Sala Gamma', capacity: 4, color: '#f59e0b' },
  { id: '4', name: 'Sala Delta', capacity: 20, color: '#8b5cf6' },
];

export function getRooms(): Room[] {
  try {
    const stored = localStorage.getItem(ROOMS_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_ROOMS;
  } catch {
    return DEFAULT_ROOMS;
  }
}

export function saveRooms(rooms: Room[]): void {
  localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
}

export function getReservations(): Reservation[] {
  try {
    const stored = localStorage.getItem(RESERVATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveReservations(reservations: Reservation[]): void {
  localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(reservations));
}

export function addReservation(reservation: Reservation): void {
  const reservations = getReservations();
  saveReservations([...reservations, reservation]);
}

export function updateReservation(updated: Reservation): void {
  const reservations = getReservations();
  saveReservations(reservations.map(r => r.id === updated.id ? updated : r));
}

export function deleteReservation(id: string): void {
  const reservations = getReservations();
  saveReservations(reservations.filter(r => r.id !== id));
}
