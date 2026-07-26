import { createContext, useContext, useState, type ReactNode } from "react";

interface AdminAuthValue {
  password: string | null;
  setPassword: (p: string | null) => void;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [password, setPassword] = useState<string | null>(null);
  return (
    <AdminAuthContext.Provider value={{ password, setPassword }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
