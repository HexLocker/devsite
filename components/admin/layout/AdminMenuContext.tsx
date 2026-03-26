"use client";

import { createContext, useContext, useState } from "react";

interface AdminMenuCtx {
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

const AdminMenuContext = createContext<AdminMenuCtx>({
  mobileOpen: false,
  setMobileOpen: () => {},
});

export function AdminMenuProvider({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <AdminMenuContext.Provider value={{ mobileOpen, setMobileOpen }}>
      {children}
    </AdminMenuContext.Provider>
  );
}

export function useAdminMenu() {
  return useContext(AdminMenuContext);
}
