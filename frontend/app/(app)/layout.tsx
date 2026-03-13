"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { AuthUser } from "@/lib/types";
import Sidebar from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<AuthUser>("/api/auth/me")
      .then(setUser)
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
        <div className="orb-bg"><div className="orb orb-1"/><div className="orb orb-2"/><div className="orb orb-3"/></div>
        <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <svg width="52" height="52" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"
            style={{ margin: "0 auto 1.25rem", display: "block", filter: "drop-shadow(0 8px 24px rgba(37,99,235,0.5))", animation: "pulse-glow 2s ease-in-out infinite" }}>
            <defs>
              <linearGradient id="loadGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#1d4ed8" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            <rect width="40" height="40" rx="11" fill="url(#loadGrad)" />
            <text x="20" y="28" textAnchor="middle" fill="white" fontSize="22" fontWeight="800" fontFamily="system-ui, sans-serif">₹</text>
          </svg>
          <div style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Loading TaxAssist...</div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar username={user.username} />
      <main style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", position: "relative" }}>
        {children}
      </main>
    </div>
  );
}
