"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { FilingMeta } from "@/lib/types";
import { createDefaultFiling } from "@/lib/types";
import FilingCard from "@/components/filing/FilingCard";

export default function FilingPage() {
  const router = useRouter();
  const [filings, setFilings] = useState<FilingMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<FilingMeta[]>("/api/filings")
      .then(setFilings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(filingId: string) {
    await api.delete(`/api/filings/${filingId}`);
    setFilings((prev) => prev.filter((f) => f.filing_id !== filingId));
  }

  function handleStartNew() {
    // Store default filing state in sessionStorage so the filing page picks it up
    sessionStorage.setItem("newFiling", JSON.stringify(createDefaultFiling()));
    router.push("/filing/new");
  }

  return (
    <div style={{ padding: "2.5rem 3rem", maxWidth: "820px", margin: "0 auto", width: "100%" }}>
      {/* Hero */}
      <div className="fade-up" style={{ marginBottom: "2.5rem" }}>
        <div style={{ marginBottom: "0.75rem" }}>
          <h1 style={{ fontSize: "2.25rem", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.1, margin: 0 }}>
            <span style={{
              background: "linear-gradient(135deg, #93c5fd 0%, #60a5fa 40%, #22d3ee 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>File Your ITR</span>
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: 0 }}>
            AI-guided · ITR-1, 2, 3, 4 supported
          </p>
          <span className="badge badge-blue">AY 2025-26</span>
          <span className="badge badge-blue">AY 2024-25</span>
        </div>
      </div>

      {/* Start new banner */}
      <div className="fade-up fade-up-1" style={{
        marginBottom: "2rem",
        position: "relative", overflow: "hidden",
        background: "linear-gradient(135deg,rgba(29,78,216,0.2),rgba(37,99,235,0.12),rgba(6,182,212,0.08))",
        border: "1px solid rgba(59,130,246,0.28)",
        borderRadius: "var(--radius-xl)",
        padding: "1.75rem 2rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: "1rem",
        boxShadow: "0 8px 32px rgba(37,99,235,0.12), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}>
        {/* decorative glow */}
        <div style={{ position: "absolute", right: "-30px", top: "-30px", width: "160px", height: "160px", borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.2), transparent)", pointerEvents: "none" }} />
        <div>
          <div style={{ fontWeight: 800, fontSize: "1.0625rem", marginBottom: "0.3rem", letterSpacing: "-0.015em" }}>
            Start a New Filing
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>
            AI-guided step-by-step · Auto-saves on progress · ~10 min
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleStartNew} style={{ whiteSpace: "nowrap", padding: "0.75rem 1.75rem", fontSize: "0.9rem" }}>
          + New Filing
        </button>
      </div>

      {/* Section label */}
      <div style={{
        fontSize: "0.68rem", fontWeight: 600, color: "var(--text-muted)",
        textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.875rem",
      }}>
        Saved Filings
      </div>

      {/* Loading shimmer */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {[1, 2].map((i) => (
            <div key={i} className="shimmer" style={{ height: "96px", borderRadius: "var(--radius-lg)" }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filings.length === 0 && (
        <div style={{
          textAlign: "center", padding: "3rem 2rem",
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
        }}>
          <div style={{
            width: "52px", height: "52px", margin: "0 auto 1rem",
            borderRadius: "14px", background: "rgba(255,255,255,0.04)",
            border: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem",
          }}>◈</div>
          <div style={{ color: "var(--text-secondary)", fontWeight: 500, marginBottom: "0.25rem" }}>No saved filings</div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Start a new filing above to begin</div>
        </div>
      )}

      {/* Filing list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        {filings.map((f, i) => (
          <div key={f.filing_id} className={`fade-up fade-up-${Math.min(i + 1, 4)}`}>
            <FilingCard filing={f} onDelete={handleDelete} />
          </div>
        ))}
      </div>
    </div>
  );
}
