'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

interface Mascota {
  id: number;
  nombre: string;
  especie: string;
  fecha_nacimiento: string | null;
}

export default function BuscarMascotas() {
  const router = useRouter();
  const { rol, vetId } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!rol) {
      router.push('/');
    }
  }, [rol, router]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = searchTerm 
        ? `http://localhost:3001/api/mascotas?nombre=${encodeURIComponent(searchTerm)}`
        : `http://localhost:3001/api/mascotas`;
      
      const res = await fetch(url, {
        headers: {
          'X-Role': rol,
          'X-Vet-Id': vetId
        }
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error al buscar mascotas');

      setMascotas(data.mascotas || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!rol) return null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="flex justify-between items-center bg-white text-gray-900 p-4 rounded shadow mb-6">
        <div>
          <h2 className="text-xl font-bold">Búsqueda de Mascotas</h2>
          <p className="text-sm text-gray-500">
            Sesión: {rol.charAt(0).toUpperCase() + rol.slice(1)} {rol === 'veterinario' ? `(ID: ${vetId})` : ''}
          </p>
        </div>
        <div className="flex gap-4">
          <Link href="/vacunacion" className="text-blue-600 hover:underline">
            Ir a Vacunación Pendiente
          </Link>
          <Link href="/" className="text-red-600 hover:underline">
            Salir
          </Link>
        </div>
      </header>

      <main className="bg-white text-gray-900 p-6 rounded shadow">
        <form onSubmit={handleSearch} className="flex gap-4 mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar mascota por nombre..."
            className="flex-1 p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        {total !== null && (
          <p className="text-gray-600 mb-4 font-medium">
            Mostrando {total} mascotas
          </p>
        )}

        {mascotas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-200 p-2 text-left">ID</th>
                  <th className="border border-gray-200 p-2 text-left">Nombre</th>
                  <th className="border border-gray-200 p-2 text-left">Especie</th>
                  <th className="border border-gray-200 p-2 text-left">Fecha Nacimiento</th>
                </tr>
              </thead>
              <tbody>
                {mascotas.map((m, i) => (
                  <tr key={m.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-200 p-2">{m.id}</td>
                    <td className="border border-gray-200 p-2 font-medium">{m.nombre}</td>
                    <td className="border border-gray-200 p-2 capitalize">{m.especie}</td>
                    <td className="border border-gray-200 p-2">
                      {m.fecha_nacimiento ? new Date(m.fecha_nacimiento).toLocaleDateString() : 'Desconocida'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : total === 0 ? (
          <div className="text-center p-8 text-gray-500 bg-gray-50 rounded border border-gray-200">
            No se encontraron mascotas
          </div>
        ) : null}
      </main>
    </div>
  );
}
