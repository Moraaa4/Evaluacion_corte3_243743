'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

interface VacunacionPendiente {
  mascota_id: number;
  nombre_mascota: string;
  especie: string;
  nombre_dueno: string;
  telefono_dueno: string;
  ultima_vacuna: string | null;
  dias_sin_vacuna: number;
  estado: string;
}

export default function VacunacionPendiente() {
  const router = useRouter();
  const { rol, vetId } = useAuth();
  
  const [registros, setRegistros] = useState<VacunacionPendiente[]>([]);
  const [source, setSource] = useState<'cache' | 'db' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!rol) {
      router.push('/');
    }
  }, [rol, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('http://localhost:3001/api/vacunacion-pendiente', {
        headers: {
          'X-Role': rol,
          'X-Vet-Id': vetId
        }
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error al obtener datos');

      setRegistros(data.data || []);
      setSource(data.source);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [rol, vetId]);

  useEffect(() => {
    if (rol) {
      fetchData();
    }
  }, [rol, fetchData]);

  if (!rol) return null;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <header className="flex justify-between items-center bg-white text-gray-900 p-4 rounded shadow mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-3">
            Vacunación Pendiente
            {source && (
              <span className={`text-xs px-2 py-1 rounded text-white font-bold ${source === 'cache' ? 'bg-green-500' : 'bg-red-500'}`}>
                {source === 'cache' ? 'CACHÉ HIT 🟢' : 'BASE DE DATOS 🔴'}
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Sesión: {rol.charAt(0).toUpperCase() + rol.slice(1)} {rol === 'veterinario' ? `(ID: ${vetId})` : ''}
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <button 
            onClick={fetchData}
            disabled={loading}
            className="bg-blue-100 text-blue-700 px-4 py-2 rounded hover:bg-blue-200 transition font-medium text-sm"
          >
            {loading ? 'Actualizando...' : 'Actualizar consulta'}
          </button>
          <Link href="/buscar" className="text-blue-600 hover:underline text-sm">
            Volver a Búsqueda
          </Link>
        </div>
      </header>

      <main className="bg-white text-gray-900 p-6 rounded shadow">
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        {registros.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-200 p-2 text-left">Mascota</th>
                  <th className="border border-gray-200 p-2 text-left">Especie</th>
                  <th className="border border-gray-200 p-2 text-left">Dueño</th>
                  <th className="border border-gray-200 p-2 text-left">Teléfono</th>
                  <th className="border border-gray-200 p-2 text-left">Última Vacuna</th>
                  <th className="border border-gray-200 p-2 text-left">Días sin Vacuna</th>
                  <th className="border border-gray-200 p-2 text-left">Estado</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((r, i) => (
                  <tr key={r.mascota_id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-200 p-2 font-medium">{r.nombre_mascota}</td>
                    <td className="border border-gray-200 p-2 capitalize">{r.especie}</td>
                    <td className="border border-gray-200 p-2">{r.nombre_dueno || 'N/A'}</td>
                    <td className="border border-gray-200 p-2">{r.telefono_dueno || 'N/A'}</td>
                    <td className="border border-gray-200 p-2">
                      {r.ultima_vacuna ? new Date(r.ultima_vacuna).toLocaleDateString() : '-'}
                    </td>
                    <td className="border border-gray-200 p-2 font-mono">
                      {r.dias_sin_vacuna === 9999 ? '-' : r.dias_sin_vacuna}
                    </td>
                    <td className="border border-gray-200 p-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${r.estado === 'NUNCA VACUNADA' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>
                        {r.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : loading ? (
          <div className="text-center p-8 text-gray-500">Cargando...</div>
        ) : (
          <div className="text-center p-8 text-gray-500 bg-gray-50 rounded border border-gray-200">
            No hay vacunaciones pendientes
          </div>
        )}
      </main>
    </div>
  );
}
