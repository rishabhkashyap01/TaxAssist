"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";

/* SVG logo — rupee in blue-to-cyan gradient square */
function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#logoGrad)" />
      {/* Rupee symbol paths */}
      <text x="20" y="28" textAnchor="middle" fill="white" fontSize="22" fontWeight="800" fontFamily="system-ui, sans-serif">₹</text>
    </svg>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggleTheme } = useTheme();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [backendReady, setBackendReady] = useState(false);

  // Wake up the Render backend the moment login page loads.
  // Keeps the submit button disabled until backend responds.
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "";
    const ping = () =>
      fetch(`${base}/health`, { method: "GET" })
        .then(() => setBackendReady(true))
        .catch(() => setTimeout(ping, 3000)); // retry every 3s if still sleeping
    ping();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await api.post(tab === "login" ? "/api/auth/login" : "/api/auth/register", { username, password });
      router.push(searchParams.get("next") ?? "/filing");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally { setLoading(false); }
  }

  const isDark = theme === "dark";

  return (
    <div style={{ minHeight: "100vh", display: "flex", position: "relative", overflow: "hidden", background: "var(--bg)" }}>
      {/* Orbs */}
      <div className="orb-bg"><div className="orb orb-1"/><div className="orb orb-2"/><div className="orb orb-3"/></div>
      <div className="grid-overlay" />

      {/* Theme toggle — top right */}
      <button onClick={toggleTheme} style={{
        position: "fixed", top: "1.25rem", right: "1.25rem", zIndex: 20,
        background: "var(--bg-glass)", border: "1px solid var(--border)",
        borderRadius: "10px", padding: "0.5rem 0.875rem",
        display: "flex", alignItems: "center", gap: "0.45rem",
        cursor: "pointer", fontFamily: "inherit", fontSize: "0.78rem",
        fontWeight: 500, color: "var(--text-secondary)",
        backdropFilter: "blur(12px)", transition: "all 0.15s",
      }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(59,130,246,0.4)"; e.currentTarget.style.color = "#60a5fa"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
      >
        {isDark ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
          </svg>
        )}
        {isDark ? "Light" : "Dark"}
      </button>

      {/* LEFT — branding */}
      <div style={{
        flex: "0 0 52%", display: "flex", flexDirection: "column",
        justifyContent: "center", padding: "4rem 5%",
        position: "relative", zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "2rem" }}>
          <Logo size={44} />
          <span style={{
            fontSize: "1.375rem", fontWeight: 900, letterSpacing: "-0.035em",
            background: "linear-gradient(135deg, #93c5fd, #60a5fa, #22d3ee)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>TaxAssist</span>
        </div>

        {/* Hero heading */}
        <h1 style={{
          fontSize: "clamp(2rem,4vw,3.25rem)", fontWeight: 900,
          lineHeight: 1.08, letterSpacing: "-0.04em",
          color: "var(--text)", marginBottom: "1.25rem",
        }}>
          File your ITR<br />
          <span style={{
            background: "linear-gradient(135deg, #93c5fd 0%, #60a5fa 40%, #22d3ee 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>with AI precision.</span>
        </h1>

        <p style={{ color: "var(--text-secondary)", fontSize: "1rem", lineHeight: 1.75, maxWidth: "380px", marginBottom: "2.75rem" }}>
          India&apos;s smartest income tax assistant — answer any tax question instantly, or let AI guide you through your full ITR filing in minutes.
        </p>

        {/* Simple benefit bullets */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {[
            "AI answers for any deduction, exemption, or rule",
            "Step-by-step guided filing for ITR-1 through ITR-4",
            "Backed by 518 income tax rules · AY 2025-26",
          ].map((point) => (
            <div key={point} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{
                width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, #60a5fa, #22d3ee)",
                boxShadow: "0 0 6px rgba(96,165,250,0.6)",
              }} />
              <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{point}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{
        position: "absolute", left: "52%", top: "10%", bottom: "10%", width: "1px",
        background: "linear-gradient(to bottom, transparent, rgba(59,130,246,0.2), transparent)",
        zIndex: 1,
      }} />

      {/* RIGHT — auth form */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "3rem 5%", position: "relative", zIndex: 1,
      }}>
        <div style={{ width: "100%", maxWidth: "380px" }}>
          <div className="fade-up" style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-md)",
            borderRadius: "20px", padding: "2.25rem",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
            boxShadow: "var(--shadow-card)",
          }}>
            {/* Card header */}
            <div style={{ marginBottom: "1.75rem" }}>
              <h2 style={{ fontSize: "1.375rem", fontWeight: 800, letterSpacing: "-0.025em", marginBottom: "0.3rem", color: "var(--text)" }}>
                {tab === "login" ? "Welcome back" : "Create account"}
              </h2>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                {tab === "login" ? "Sign in to continue to TaxAssist" : "Get started — it's free"}
              </p>
            </div>

            {/* Tabs */}
            <div style={{
              display: "flex", background: "var(--bg-surface)",
              borderRadius: "10px", padding: "3px", marginBottom: "1.5rem",
              border: "1px solid var(--border)",
            }}>
              {(["login", "register"] as const).map((t) => (
                <button key={t} onClick={() => { setTab(t); setError(""); }} style={{
                  flex: 1, padding: "0.55rem 0.5rem", borderRadius: "8px",
                  border: "none", cursor: "pointer", fontWeight: 600,
                  fontSize: "0.8375rem", fontFamily: "inherit",
                  background: tab === t
                    ? "linear-gradient(135deg, #1d4ed8, #2563eb, #3b82f6)"
                    : "transparent",
                  color: tab === t ? "#fff" : "var(--text-muted)",
                  transition: "all 0.15s",
                  boxShadow: tab === t ? "0 2px 12px rgba(37,99,235,0.4)" : "none",
                }}>
                  {t === "login" ? "Sign In" : "Register"}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.45rem", letterSpacing: "0.02em" }}>
                  Username
                </label>
                <input className="input" type="text" value={username}
                  autoComplete="username"
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. rahul_sharma" required
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.45rem", letterSpacing: "0.02em" }}>
                  Password
                </label>
                <input className="input" type="password" value={password}
                  autoComplete={tab === "login" ? "current-password" : "new-password"}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={tab === "login" ? "Your password" : "Min. 6 characters"} required
                />
              </div>

              {error && (
                <div style={{
                  background: "rgba(239,68,68,0.09)", border: "1px solid rgba(239,68,68,0.24)",
                  borderRadius: "10px", padding: "0.75rem 1rem",
                  fontSize: "0.8125rem", color: "#ef4444",
                  display: "flex", alignItems: "center", gap: "0.5rem",
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              <button className="btn btn-primary" type="submit" disabled={loading || !backendReady}
                style={{ width: "100%", padding: "0.8rem", fontSize: "0.9375rem", marginTop: "0.25rem", borderRadius: "12px", opacity: backendReady ? 1 : 0.6 }}>
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem" }}>
                    <span style={{ width: "15px", height: "15px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                    Please wait...
                  </span>
                ) : !backendReady ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem" }}>
                    <span style={{ width: "15px", height: "15px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                    Connecting...
                  </span>
                ) : (tab === "login" ? "Sign In →" : "Create Account →")}
              </button>
            </form>
          </div>

          <p className="fade-up fade-up-2" style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.72rem", marginTop: "1.25rem", lineHeight: 1.7 }}>
            Your data is encrypted and never shared.
          </p>
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
