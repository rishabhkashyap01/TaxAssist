"use client";
import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { streamPost } from "@/hooks/useSSE";
import { ITRFiling, Message, createDefaultFiling } from "@/lib/types";
import { getStepProgress, getStepLabel } from "@/lib/utils";
import ChatWindow from "@/components/chat/ChatWindow";
import ChatInput from "@/components/chat/ChatInput";
import StepTracker from "@/components/filing/StepTracker";

export default function FilingChatPage({ params }: { params: Promise<{ filingId: string }> }) {
  const { filingId: rawId } = use(params);
  const router = useRouter();

  const [filingId, setFilingId] = useState<string | null>(rawId === "new" ? null : rawId);
  const [filing, setFiling] = useState<ITRFiling | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  // Load filing on mount
  useEffect(() => {
    if (rawId === "new") {
      const stored = sessionStorage.getItem("newFiling");
      const f: ITRFiling = stored ? JSON.parse(stored) : createDefaultFiling();
      sessionStorage.removeItem("newFiling");
      setFiling(f);
      // Trigger welcome message
      triggerWelcome(f);
    } else {
      api.get<{ filing_state: ITRFiling; messages: Message[] }>(`/api/filings/${rawId}`)
        .then(({ filing_state, messages: msgs }) => {
          setFiling(filing_state);
          setMessages(msgs);
        })
        .catch(() => router.push("/filing"));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawId]);

  async function triggerWelcome(f: ITRFiling) {
    setIsStreaming(true);
    setIsThinking(true);
    let accumulated = "";
    await streamPost(
      "/api/filing/welcome",
      { filing_state: f },
      (token) => { setIsThinking(false); accumulated += token; setStreaming(accumulated); },
      (data) => {
        const updatedFiling = data.filing_state as ITRFiling;
        const welcomeMsg: Message = { role: "assistant", content: accumulated };
        setMessages([welcomeMsg]);
        setStreaming("");
        setFiling(updatedFiling);
        setIsStreaming(false);
        setIsThinking(false);
      },
      (err) => {
        setMessages([{ role: "assistant", content: `Error: ${err}` }]);
        setStreaming("");
        setIsStreaming(false);
        setIsThinking(false);
      }
    );
  }

  async function handleSend(text: string) {
    if (isStreaming || !filing) return;

    const userMsg: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setStreaming("");
    setIsStreaming(true);
    setIsThinking(true);

    abortRef.current = new AbortController();
    let accumulated = "";

    await streamPost(
      "/api/filing/message/stream",
      {
        filing_state: filing,
        messages: updatedMessages,
        user_message: text,
        use_rag: true,
      },
      (token) => { setIsThinking(false); accumulated += token; setStreaming(accumulated); },
      async (data) => {
        const updatedFiling = data.filing_state as ITRFiling;
        const stepAdvanced = data.step_advanced as boolean;
        const assistantMsg: Message = { role: "assistant", content: accumulated };
        const newMessages = [...updatedMessages, assistantMsg];

        setMessages(newMessages);
        setStreaming("");
        setFiling(updatedFiling);
        setIsStreaming(false);
        setIsThinking(false);

        // Auto-save
        if (stepAdvanced) {
          if (!filingId && updatedFiling.personal.pan) {
            // First save
            const res = await api.post<{ filing_id: string }>("/api/filings", {
              filing_state: updatedFiling,
              messages: newMessages,
            });
            setFilingId(res.filing_id);
            window.history.replaceState({}, "", `/filing/${res.filing_id}`);
          } else if (filingId) {
            await api.patch(`/api/filings/${filingId}`, {
              filing_state: updatedFiling,
              messages: newMessages,
            });
          }
        }
      },
      (err) => {
        setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${err}` }]);
        setStreaming("");
        setIsStreaming(false);
        setIsThinking(false);
      },
      abortRef.current.signal
    );
  }

  if (!filing) {
    return (
      <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "40px", height: "40px", margin: "0 auto 0.875rem",
            borderRadius: "12px", background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.1rem", animation: "pulse-glow 2s ease-in-out infinite",
          }}>⚡</div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Loading filing...</div>
        </div>
      </div>
    );
  }

  const { current, total } = getStepProgress(filing.form_type || "ITR-1", filing.current_step);
  const progressPct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Main chat area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{
          padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", gap: "0.875rem",
          background: "var(--bg-secondary)",
        }}>
          <button onClick={() => router.push("/filing")} style={{
            background: "var(--bg-glass)", border: "1px solid var(--border)",
            borderRadius: "7px", color: "var(--text-muted)",
            cursor: "pointer", fontSize: "0.8rem", padding: "0.3rem 0.6rem",
            fontFamily: "inherit", transition: "all 0.15s",
          }}>← Back</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.8375rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span className="badge badge-blue" style={{ fontSize: "0.68rem" }}>{filing.form_type || "ITR"}</span>
              <span style={{ color: "var(--text-secondary)" }}>{getStepLabel(filing.current_step)}</span>
            </div>
            <div className="progress-track" style={{ marginTop: "5px" }}>
              <div className="progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            {current + 1} / {total}
          </span>
          <button onClick={() => setSidebarOpen((v) => !v)} style={{
            background: sidebarOpen ? "rgba(37,99,235,0.15)" : "var(--bg-glass)",
            border: sidebarOpen ? "1px solid rgba(59,130,246,0.3)" : "1px solid var(--border)",
            borderRadius: "7px", color: sidebarOpen ? "#60a5fa" : "var(--text-muted)",
            cursor: "pointer", padding: "0.3rem 0.6rem", fontSize: "0.78rem",
            fontFamily: "inherit", transition: "all 0.15s",
          }}>
            {sidebarOpen ? "≡ Hide" : "≡ Steps"}
          </button>
        </div>

        <ChatWindow messages={messages} streamingContent={streaming} isThinking={isThinking} />
        <ChatInput
          onSend={handleSend}
          disabled={isStreaming}
          placeholder="Reply to the assistant..."
        />
      </div>

      {/* Step tracker sidebar */}
      {sidebarOpen && (
        <div style={{
          width: "196px", minWidth: "196px",
          borderLeft: "1px solid var(--border)",
          overflowY: "auto",
          background: "rgba(0,0,0,0.25)",
          backdropFilter: "blur(20px)",
        }}>
          <StepTracker
            formType={filing.form_type || "ITR-1"}
            currentStep={filing.current_step}
            completedSteps={filing.completed_steps}
          />
        </div>
      )}
    </div>
  );
}
