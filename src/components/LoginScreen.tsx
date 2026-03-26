import { useState } from 'react';
import { login } from '../userStore';
import type { User } from '../types';
import ZaimellaLogo from './ZaimellaLogo';

interface Props {
  onLogin: (user: User) => void;
}

export default function LoginScreen({ onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      return setError('Ingresa tu usuario y contraseña.');
    }
    setLoading(true);
    // Simula un pequeño delay para sensacion de autenticacion
    setTimeout(() => {
      const user = login(username.trim(), password);
      setLoading(false);
      if (user) {
        onLogin(user);
      } else {
        setError('Usuario o contraseña incorrectos.');
      }
    }, 400);
  }

  return (
    <div className="min-h-screen bg-[#f0f2f4] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

          {/* Header verde */}
          <div className="bg-[#2db135] px-8 py-6 flex flex-col items-center gap-3">
            <ZaimellaLogo className="h-10 w-auto brightness-0 invert" />
            <p className="text-white/80 text-sm">Sistema de Reserva de Salas</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Tu nombre de usuario"
                autoFocus
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#2db135] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#2db135] focus:border-transparent"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#2db135] text-white font-medium text-sm rounded-lg
                         hover:bg-[#249a2c] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Verificando...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>

        {/* Usuarios de prueba */}
        <div className="mt-4 bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Usuarios de prueba
          </p>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400">
                <th className="text-left pb-1 font-medium">Usuario</th>
                <th className="text-left pb-1 font-medium">Contraseña</th>
                <th className="text-left pb-1 font-medium">Rol</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 space-y-1">
              {[
                { u: 'admin',   p: 'admin123', r: 'Admin',   color: '#2db135' },
                { u: 'cvaca',   p: 'user123',  r: 'Admin',   color: '#2db135' },
                { u: 'jperez',  p: 'user123',  r: 'Usuario', color: '#6b7280' },
                { u: 'mgarcia', p: 'user123',  r: 'Usuario', color: '#6b7280' },
              ].map(row => (
                <tr
                  key={row.u}
                  className="cursor-pointer hover:bg-gray-50 rounded"
                  onClick={() => { setUsername(row.u); setPassword(row.p); setError(''); }}
                >
                  <td className="py-1 font-mono">{row.u}</td>
                  <td className="py-1 font-mono">{row.p}</td>
                  <td className="py-1">
                    <span
                      className="px-1.5 py-0.5 rounded text-white text-[10px] font-medium"
                      style={{ backgroundColor: row.color }}
                    >
                      {row.r}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] text-gray-400 mt-2">Haz clic en una fila para autocompletar</p>
        </div>
      </div>
    </div>
  );
}
