export interface Room {
  id: string;
  name: string;
  capacity: number;
  color: string;
}

export interface Reservation {
  id: string;
  roomId: string;
  title: string;
  organizer: string;
  userId: string; // id del usuario que creo la reserva
  date: string;   // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  attendees: number;
  description?: string;
}

export type UserRole = 'admin' | 'user' | 'tablet';

export interface User {
  id: string;
  username: string;
  password: string; // texto plano (prototipo)
  name: string;
  role: UserRole;
  roomId?: string; // solo para rol tablet: sala asignada
}
