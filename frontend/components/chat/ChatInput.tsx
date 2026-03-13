"use client";
import { useRef, KeyboardEvent } from "react";

interface Props {
  onSend: (msg: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({ onSend, disabled, placeholder = "Type your message..." }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const val = ref.current?.value.trim();
    if (!val || disabled) return;
    onSend(val);
    if (ref.current) {
      ref.current.value = "";
      ref.current.style.height = "auto";
    }
  }

  return (
    <div style={{
      padding: "0.875rem 1.25rem",
      borderTop: "1px solid var(--border)",
      background: "var(--bg-secondary)",
    }}>
      <div style={{
        display: "flex", gap: "0.65rem", alignItems: "flex-end",
        background: "var(--bg-glass)",
        border: "1px solid var(--border)",
        borderRadius: "14px", padding: "0.5rem 0.5rem 0.5rem 1rem",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
        onFocusCapture={(e) => {
          e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.12)";
        }}
        onBlurCapture={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <textarea
          ref={ref}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          style={{
            flex: 1, resize: "none", background: "transparent",
            border: "none", color: "var(--text)",
            fontSize: "0.9375rem", outline: "none", fontFamily: "inherit",
            maxHeight: "120px", overflowY: "auto", lineHeight: "1.55",
            padding: "0.35rem 0",
          }}
          onInput={(e) => {
            const t = e.currentTarget;
            t.style.height = "auto";
            t.style.height = Math.min(t.scrollHeight, 120) + "px";
          }}
        />
        <button
          onClick={submit}
          disabled={disabled}
          style={{
            width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0,
            background: disabled
              ? "rgba(37,99,235,0.15)"
              : "linear-gradient(135deg,#1d4ed8,#2563eb)",
            border: "none", cursor: disabled ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1rem", color: "white",
            transition: "all 0.2s",
            boxShadow: disabled ? "none" : "0 2px 10px rgba(37,99,235,0.4)",
          }}
        >↑</button>
      </div>
      <div style={{ textAlign: "center", fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
        Enter to send · Shift+Enter for new line
      </div>
    </div>
  );
}
