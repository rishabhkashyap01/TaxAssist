"use client";
import ReactMarkdown from "react-markdown";
import { Message } from "@/lib/types";

interface Props {
  message: Message;
  streaming?: boolean;
}

/* Circular AI avatar with sparkle star */
export function BotAvatar() {
  return (
    <div style={{
      width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0,
      background: "linear-gradient(135deg, #1d4ed8, #2563eb 50%, #06b6d4)",
      display: "flex", alignItems: "center", justifyContent: "center",
      marginBottom: "2px",
      boxShadow: "0 2px 10px rgba(37,99,235,0.45)",
    }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        {/* 4-pointed sparkle */}
        <path d="M12 2L13.09 9.26L20 12L13.09 14.74L12 22L10.91 14.74L4 12L10.91 9.26L12 2Z"
          fill="white" />
      </svg>
    </div>
  );
}

export default function ChatMessage({ message, streaming }: Props) {
  const isUser = message.role === "user";

  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      alignItems: "flex-end",
      gap: "0.5rem",
      marginBottom: "0.875rem",
      padding: "0 1.25rem",
    }}>
      {!isUser && <BotAvatar />}

      <div className={isUser ? "bubble-user" : "bubble-assistant"}>
        {isUser ? (
          <span style={{ whiteSpace: "pre-wrap", fontSize: "0.9375rem" }}>{message.content}</span>
        ) : (
          <>
            <ReactMarkdown>{message.content}</ReactMarkdown>
            {streaming && <span className="cursor" />}
          </>
        )}
      </div>

      {isUser && (
        <div style={{
          width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg,rgba(29,78,216,0.4),rgba(37,99,235,0.3))",
          border: "1px solid rgba(59,130,246,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.75rem", fontWeight: 700, color: "#60a5fa",
          marginBottom: "2px",
        }}>U</div>
      )}
    </div>
  );
}
