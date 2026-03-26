import type { User } from './types';

const USERS_KEY = 'cvbooking_users';
const SESSION_KEY = 'cvbooking_session'; // sessionStorage → se borra al cerrar el navegador

const DEFAULT_USERS: User[] = [
  { id: 'u1', username: 'admin',    password: 'admin123', name: 'Administrador',  role: 'admin' },
  { id: 'u2', username: 'jperez',   password: 'user123',  name: 'Juan Pérez',     role: 'user'  },
  { id: 'u3', username: 'mgarcia',  password: 'user123',  name: 'María García',   role: 'user'  },
  { id: 'u4', username: 'cvaca',    password: 'user123',  name: 'C. Vaca',        role: 'admin' },
];

export function getUsers(): User[] {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_USERS;
  } catch {
    return DEFAULT_USERS;
  }
}

export function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/** Intenta login. Devuelve el usuario o null si las credenciales son incorrectas. */
export function login(username: string, password: string): User | null {
  const users = getUsers();
  const user = users.find(
    u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
  );
  if (user) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }
  return user ?? null;
}

export function logout(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

/** Devuelve el usuario de la sesion activa, o null si no hay sesion. */
export function getCurrentUser(): User | null {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}
