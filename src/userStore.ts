import type { User } from './types';

const USERS_KEY = 'cvbooking_users';
const SESSION_KEY = 'cvbooking_session';
// Las tablets usan localStorage para que la sesion persista aunque se cierre el navegador
const TABLET_SESSION_KEY = 'cvbooking_tablet_session';

const DEFAULT_USERS: User[] = [
  // Administradores
  { id: 'u1', username: 'admin',   password: 'admin123', name: 'Administrador', role: 'admin' },
  { id: 'u4', username: 'cvaca',   password: 'user123',  name: 'C. Vaca',       role: 'admin' },
  // Usuarios
  { id: 'u2', username: 'jperez',  password: 'user123',  name: 'Juan Pérez',    role: 'user'  },
  { id: 'u3', username: 'mgarcia', password: 'user123',  name: 'María García',  role: 'user'  },
  // Tablets (una por sala — roomId debe coincidir con el id de la sala)
  { id: 't1', username: 'tablet-alpha',  password: 'tablet123', name: 'Sala Alpha',  role: 'tablet', roomId: '1' },
  { id: 't2', username: 'tablet-beta',   password: 'tablet123', name: 'Sala Beta',   role: 'tablet', roomId: '2' },
  { id: 't3', username: 'tablet-gamma',  password: 'tablet123', name: 'Sala Gamma',  role: 'tablet', roomId: '3' },
  { id: 't4', username: 'tablet-delta',  password: 'tablet123', name: 'Sala Delta',  role: 'tablet', roomId: '4' },
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
    if (user.role === 'tablet') {
      // Tablets persisten en localStorage (no se cierran al cerrar el navegador)
      localStorage.setItem(TABLET_SESSION_KEY, JSON.stringify(user));
    } else {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    }
  }
  return user ?? null;
}

export function logout(): void {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(TABLET_SESSION_KEY);
}

/** Devuelve el usuario de la sesion activa, o null si no hay sesion. */
export function getCurrentUser(): User | null {
  try {
    // Primero comprueba sesion normal, luego sesion de tablet
    const session = sessionStorage.getItem(SESSION_KEY) ?? localStorage.getItem(TABLET_SESSION_KEY);
    return session ? JSON.parse(session) : null;
  } catch {
    return null;
  }
}
