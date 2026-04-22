'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './context/AuthContext';

type Role = '' | 'veterinario' | 'recepcion' | 'administrador';

export default function Home() {
  const router = useRouter();
  const { setRol, setVetId } = useAuth();
  
  const [selectedRole, setSelectedRole] = useState<Role>('');
  const [inputId, setInputId] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedRole) {
      setError('Por favor selecciona un rol');
      return;
    }

    if (selectedRole === 'veterinario' && !inputId) {
      setError('Debes ingresar el ID del veterinario');
      return;
    }

    setRol(selectedRole);
    setVetId(inputId);
    router.push('/buscar');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Clínica Veterinaria <br /> <span className="text-lg font-normal">Sistema de Gestión</span>
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rol de usuario
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as Role)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
            >
              <option value="">Selecciona tu rol...</option>
              <option value="veterinario">Veterinario</option>
              <option value="recepcion">Recepción</option>
              <option value="administrador">Administrador</option>
            </select>
          </div>

          {selectedRole === 'veterinario' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID del Veterinario
              </label>
              <input
                type="number"
                value={inputId}
                onChange={(e) => setInputId(e.target.value)}
                placeholder="Ej: 1"
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition mt-4"
          >
            Ingresar al sistema
          </button>
        </form>
      </div>
    </main>
  );
}
