"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";

interface SidebarProps {
  username: string;
}

const NAV = [
  {
    href: "/qa",
    label: "Ask AI",
    sub: "Tax Q&A",
    svgPath: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  },
  {
    href: "/filing",
    label: "File ITR",
    sub: "Returns",
    svgPath: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
];

export default function Sidebar({ username }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  async function handleLogout() {
    await api.post("/api/auth/logout");
    router.push("/login");
    router.refresh();
  }

  return (
    <aside style={{
      width: "228px", minWidth: "228px",
      background: "var(--bg-secondary)",
      borderRight: "1px solid var(--border)",
      backdropFilter: "blur(40px)",
      WebkitBackdropFilter: "blur(40px)",
      display: "flex", flexDirection: "column",
      height: "100vh", position: "sticky", top: 0,
      zIndex: 10, overflow: "hidden",
    }}>

      {/* Top accent — blue to cyan */}
      <div style={{
        height: "1px", flexShrink: 0,
        background: "linear-gradient(90deg, transparent, #2563eb 30%, #06b6d4 70%, transparent)",
      }} />

      {/* Logo */}
      <div style={{ padding: "1.5rem 1.25rem 1.25rem", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, filter: "drop-shadow(0 4px 12px rgba(37,99,235,0.45))" }}>
            <defs>
              <linearGradient id="sidebarLogoGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#1d4ed8" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            <rect width="40" height="40" rx="11" fill="url(#sidebarLogoGrad)" />
            <text x="20" y="28" textAnchor="middle" fill="white" fontSize="22" fontWeight="800" fontFamily="system-ui, sans-serif">₹</text>
          </svg>
          <div>
            <div style={{
              fontSize: "1.05rem", fontWeight: 800, letterSpacing: "-0.025em",
              background: "linear-gradient(135deg, #93c5fd, #60a5fa, #22d3ee)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              lineHeight: 1.2,
            }}>TaxAssist</div>
            <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginTop: "2px", letterSpacing: "0.04em", fontWeight: 500 }}>
              AY 2025–26 · India
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: "var(--border)", margin: "0 1.25rem", flexShrink: 0 }} />

      {/* Nav */}
      <nav style={{ padding: "1rem 0.75rem", flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
        <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.10em", textTransform: "uppercase", paddingLeft: "0.6rem", marginBottom: "0.5rem" }}>
          Navigation
        </div>
        {NAV.map(({ href, label, sub, svgPath }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href} style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "0.65rem 0.75rem", borderRadius: "10px",
              textDecoration: "none", position: "relative", overflow: "hidden",
              background: active
                ? "linear-gradient(135deg, rgba(29,78,216,0.18), rgba(37,99,235,0.10))"
                : "transparent",
              border: active
                ? "1px solid rgba(59,130,246,0.32)"
                : "1px solid transparent",
              boxShadow: active
                ? "0 4px 16px rgba(37,99,235,0.10), inset 0 1px 0 rgba(255,255,255,0.06)"
                : "none",
              transition: "all 0.15s",
            }}>
              {/* Left accent bar */}
              {active && (
                <div style={{
                  position: "absolute", left: 0, top: "20%", bottom: "20%",
                  width: "3px", borderRadius: "0 3px 3px 0",
                  background: "linear-gradient(to bottom, #60a5fa, #2563eb)",
                  boxShadow: "0 0 8px rgba(96,165,250,0.9)",
                }} />
              )}

              <div style={{
                width: "30px", height: "30px", borderRadius: "8px", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: active ? "rgba(37,99,235,0.15)" : "var(--bg-glass)",
                border: active ? "1px solid rgba(59,130,246,0.35)" : "1px solid var(--border)",
                transition: "all 0.15s",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke={active ? "#60a5fa" : "var(--text-muted)"}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={svgPath} />
                </svg>
              </div>

              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: active ? 600 : 400, color: active ? "var(--text)" : "var(--text-secondary)", lineHeight: 1.2 }}>
                  {label}
                </div>
                <div style={{ fontSize: "0.67rem", color: active ? "#60a5fa" : "var(--text-muted)", marginTop: "1px" }}>
                  {sub}
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: "0.75rem", flexShrink: 0 }}>
        <div style={{ height: "1px", background: "var(--border)", marginBottom: "0.75rem" }} />

        {/* Theme toggle */}
        <button onClick={toggleTheme} style={{
          width: "100%", padding: "0.55rem 0.75rem", marginBottom: "0.5rem",
          borderRadius: "8px", border: "1px solid var(--border)",
          background: "var(--bg-glass)", cursor: "pointer",
          fontFamily: "inherit", fontSize: "0.8rem", fontWeight: 500,
          color: "var(--text-secondary)", transition: "all 0.15s",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
        }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(59,130,246,0.35)";
            e.currentTarget.style.color = "#60a5fa";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
        >
          {theme === "dark" ? (
            /* Sun icon */
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            /* Moon icon */
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
            </svg>
          )}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>

        {/* User card */}
        <div style={{
          borderRadius: "10px", padding: "0.75rem",
          background: "var(--bg-glass)",
          border: "1px solid var(--border)",
          marginBottom: "0.5rem",
          display: "flex", alignItems: "center", gap: "0.65rem",
        }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
            border: "2px solid rgba(59,130,246,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.8125rem", fontWeight: 700, color: "#fff",
            boxShadow: "0 0 10px rgba(37,99,235,0.4)",
          }}>
            {username.slice(0, 1).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {username}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "1px" }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#10b981", display: "inline-block", boxShadow: "0 0 4px #10b981" }} />
              <span style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>Active</span>
            </div>
          </div>
        </div>

        {/* Sign out */}
        <button onClick={handleLogout} style={{
          width: "100%", padding: "0.55rem 0.75rem",
          borderRadius: "8px", border: "1px solid var(--border)",
          background: "transparent", cursor: "pointer",
          fontFamily: "inherit", fontSize: "0.8rem", fontWeight: 500,
          color: "var(--text-muted)", transition: "all 0.15s",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "0.45rem",
        }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.08)";
            e.currentTarget.style.borderColor = "rgba(239,68,68,0.28)";
            e.currentTarget.style.color = "#f87171";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--text-muted)";
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
