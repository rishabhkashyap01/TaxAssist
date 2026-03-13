"use client";
import { useEffect, useRef } from "react";
import { Message } from "@/lib/types";
import ChatMessage, { BotAvatar } from "./ChatMessage";

interface Props {
  messages: Message[];
  streamingContent?: string;
  isThinking?: boolean;
}

function ThinkingIndicator() {
  return (
    <div style={{
      display: "flex", alignItems: "flex-end", gap: "0.5rem",
      marginBottom: "0.875rem", padding: "0 1.25rem",
    }}>
      <BotAvatar />
      <div className="bubble-assistant" style={{ padding: "0.75rem 1rem" }}>
        <div className="thinking-dots">
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}

export default function ChatWindow({ messages, streamingContent, isThinking }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent, isThinking]);

  return (
    <div style={{
      flex: 1, overflowY: "auto", paddingTop: "1.25rem", paddingBottom: "0.5rem",
      display: "flex", flexDirection: "column",
    }}>
      {messages.map((msg, i) => (
        <ChatMessage key={i} message={msg} />
      ))}

      {/* Thinking dots — dedicated state, no race condition */}
      {isThinking && <ThinkingIndicator />}

      {/* Streaming bubble */}
      {streamingContent && (
        <ChatMessage
          message={{ role: "assistant", content: streamingContent }}
          streaming
        />
      )}

      <div ref={bottomRef} />
    </div>
  );
}
