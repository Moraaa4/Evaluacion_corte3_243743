'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type Role = '' | 'veterinario' | 'recepcion' | 'administrador';

interface AuthContextType {
  rol: Role;
  vetId: string;
  setRol: (rol: Role) => void;
  setVetId: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [rol, setRol] = useState<Role>('');
  const [vetId, setVetId] = useState<string>('');

  return (
    <AuthContext.Provider value={{ rol, vetId, setRol, setVetId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
