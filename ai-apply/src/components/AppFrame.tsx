"use client";

import { usePathname } from "next/navigation";
import { Nav } from "@/components/Nav";
import { ToastProvider } from "@/components/Toast";
import { PWARegister } from "@/components/PWARegister";

// Bare, centered layout for auth/onboarding; sidebar layout for everything else.
export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare =
    pathname === "/signin" ||
    pathname === "/signup" ||
    pathname === "/onboarding";

  return (
    <ToastProvider>
      <PWARegister />
      {bare ? (
        <div className="flex min-h-screen items-center justify-center px-4">
          {children}
        </div>
      ) : (
        <div className="flex min-h-screen">
          <Nav />
          <main className="flex-1 px-6 py-8 lg:px-10">
            <div className="mx-auto max-w-5xl">{children}</div>
          </main>
        </div>
      )}
    </ToastProvider>
  );
}
