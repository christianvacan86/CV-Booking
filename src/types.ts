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
  date: string; // ISO date string YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  attendees: number;
  description?: string;
}
