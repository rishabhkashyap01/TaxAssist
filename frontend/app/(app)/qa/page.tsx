"use client";
import { useState } from "react";
import { Message } from "@/lib/types";
import { streamGet } from "@/hooks/useSSE";
import { BASE } from "@/lib/api";
import ChatWindow from "@/components/chat/ChatWindow";
import ChatInput from "@/components/chat/ChatInput";

export default function QAPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  function handleSend(text: string) {
    if (isStreaming) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setStreaming("");
    setIsStreaming(true);
    setIsThinking(true);

    let accumulated = "";
    const url = `${BASE}/api/qa/stream?q=${encodeURIComponent(text)}`;

    streamGet(
      url,
      (token) => { setIsThinking(false); accumulated += token; setStreaming(accumulated); },
      () => {
        setMessages((prev) => [...prev, { role: "assistant", content: accumulated }]);
        setStreaming("");
        setIsStreaming(false);
        setIsThinking(false);
      },
      (err) => {
        setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${err}` }]);
        setStreaming("");
        setIsStreaming(false);
        setIsThinking(false);
      }
    );
  }

  const SUGGESTIONS = [
    "What is Section 80C?",
    "HRA exemption rules",
    "New vs old tax regime",
    "Capital gains tax rates",
    "Section 44ADA for professionals",
    "80D health insurance deduction",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{
        padding: "1rem 1.75rem",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: "1rem",
        background: "var(--bg-secondary)",
        flexShrink: 0,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.625rem" }}>
            <h1 style={{ fontSize: "1.1rem", fontWeight: 800, letterSpacing: "-0.025em", margin: 0 }}>
              Tax Q&amp;A
            </h1>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 400 }}>Income Tax Act 1961 · 518 Rules</span>
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span className="badge badge-green">
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#34d399", display: "inline-block", boxShadow: "0 0 5px #34d399" }} />
            RAG Active
          </span>
        </div>
      </div>

      {/* Empty state */}
      {messages.length === 0 && !isStreaming && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
          <div style={{ textAlign: "center", maxWidth: "500px" }}>
            <div style={{ marginBottom: "2rem" }}>
              <h2 style={{ fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.04em", marginBottom: "0.6rem", lineHeight: 1.1 }}>
                <span style={{
                  background: "linear-gradient(135deg, #93c5fd, #60a5fa, #22d3ee)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>Ask anything.</span>
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.7 }}>
                Powered by RAG over 518 Income Tax Rules and the Income Tax Act 1961.
              </p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center" }}>
              {SUGGESTIONS.map((q) => (
                <button key={q} onClick={() => handleSend(q)} style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--border)",
                  borderRadius: "20px", padding: "0.45rem 0.9rem",
                  fontSize: "0.8rem", color: "var(--text-secondary)",
                  cursor: "pointer", transition: "all 0.18s", fontFamily: "inherit",
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(59,130,246,0.35)";
                    e.currentTarget.style.color = "#60a5fa";
                    e.currentTarget.style.background = "rgba(37,99,235,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chat */}
      {(messages.length > 0 || isStreaming) && (
        <ChatWindow messages={messages} streamingContent={streaming} isThinking={isThinking} />
      )}

      <ChatInput onSend={handleSend} disabled={isStreaming} placeholder="Ask anything about Indian income tax..." />
    </div>
  );
}
