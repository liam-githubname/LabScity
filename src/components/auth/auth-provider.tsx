'use client';

import { createContext, useContext } from "react";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "./use-auth";

const AuthContext = createContext<{user: User | null; loading: boolean}>({
  user: null,
  loading: true
});

export function AuthProvider({ children }: { children: React.ReactNode}) {
  const auth = useAuth();

  return (
    <AuthContext.Provider  value={auth}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  return useContext(AuthContext);
}