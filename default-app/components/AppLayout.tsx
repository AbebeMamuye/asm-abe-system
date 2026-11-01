"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Providers } from "@/components/Providers";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <Providers>
      <div className="flex min-h-screen">
        {!isLoginPage && <Sidebar />}
        <main className={isLoginPage ? "flex-1" : "flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 transition-all duration-300"}>
          <div className={isLoginPage ? "" : "max-w-7xl mx-auto"}>
            {children}
          </div>
        </main>
      </div>
    </Providers>
  );
}
