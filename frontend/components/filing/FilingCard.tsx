"use client";
import { useRouter } from "next/navigation";
import { FilingMeta } from "@/lib/types";
import { getStepLabel, formatRelativeTime } from "@/lib/utils";

interface Props {
  filing: FilingMeta;
  onDelete: (id: string) => void;
}

export default function FilingCard({ filing, onDelete }: Props) {
  const router = useRouter();

  return (
    <div style={{
      background: "var(--bg-elevated)", border: "1px solid var(--border-md)",
      borderRadius: "var(--radius-lg)", padding: "1.25rem",
      display: "flex", flexDirection: "column", gap: "0.875rem",
      transition: "border-color 0.2s, box-shadow 0.2s",
      cursor: "default",
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(59,130,246,0.3)";
        e.currentTarget.style.boxShadow = "0 4px 24px rgba(109,40,217,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-md)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "0.2rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {filing.name || "Unnamed"} &nbsp;<span style={{ color: "var(--text-muted)", fontWeight: 400 }}>·</span>&nbsp; {filing.form_type || "ITR"}
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
            PAN: {filing.pan || "—"} &nbsp;·&nbsp; AY {filing.assessment_year}
          </div>
        </div>
        <span className="badge badge-blue" style={{ flexShrink: 0 }}>
          {getStepLabel(filing.current_step)}
        </span>
      </div>

      {/* Meta */}
      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
        <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--text-muted)", display: "inline-block" }} />
        Updated {formatRelativeTime(filing.updated_at)}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button className="btn btn-primary" style={{ flex: 1, padding: "0.6rem 1rem", fontSize: "0.875rem" }}
          onClick={() => router.push(`/filing/${filing.filing_id}`)}>
          Resume →
        </button>
        <button className="btn btn-danger"
          onClick={() => {
            if (confirm(`Delete filing for ${filing.name || "this user"}? This cannot be undone.`)) {
              onDelete(filing.filing_id);
            }
          }}>
          Delete
        </button>
      </div>
    </div>
  );
}
