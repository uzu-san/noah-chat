import React, { useEffect, useRef, useState, useMemo } from "react";

function makeInitialGreeting() {
  const h = new Date().getHours();
 const greet = 
    (h >= 4 && h < 10) ? "おはようございます。" : 
    (h >= 10 && h < 18) ? "こんにちは。" : 
    "こんばんは。";
  return `${greet} 今日は、どんなことから話しましょうか？`;
}

export default function LineStyleChat() {
  // 初回メッセージは時間帯で生成（useMemoで毎レンダー固定）
  const initialMessage = useMemo(() => makeInitialGreeting(), []);
  const [messages, setMessages] = useState([
    { role: "model", text: initialMessage },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { role: "user", text: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.text }),
      });

      const data = await res.json();

      const reply =
        typeof data?.text === "string" && data.text.trim()
          ? data.text
          : "（応答がありません）";

      setMessages((m) => [...m, { role: "model", text: reply }]);
    } catch (err) {
      console.error("Error fetching reply:", err);
      setMessages((m) => [
        ...m,
        { role: "model", text: "通信エラーが発生しました。" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div
      style={{
        fontFamily:
          "system-ui, -apple-system, Segoe UI, Roboto, 'ヒラギノ角ゴ ProN', 'Yu Gothic UI', sans-serif",
        padding: 16,
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>NOAH</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((m, i) => {
          const isUser = m.role === "user";
          return (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: isUser ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "70%",
                  background: isUser ? "rgba(16,185,129,0.15)" : "#f5f7fa",
                  border: "1px solid #e5e7eb",
                  padding: "12px 14px",
                  borderRadius: 16,
                  borderTopRightRadius: isUser ? 4 : 16,
                  borderTopLeftRadius: isUser ? 16 : 4,
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                }}
              >
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <input
          placeholder="メッセージを入力"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          style={{
            flex: 1,
            border: "1px solid #d1d5db",
            borderRadius: 999,
            padding: "10px 14px",
            outline: "none",
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            background: loading || !input.trim() ? "#e5e7eb" : "#10b981",
            color: loading || !input.trim() ? "#6b7280" : "#fff",
            border: "none",
            borderRadius: 999,
            padding: "10px 18px",
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
          }}
        >
          送信
        </button>
      </div>
    </div>
  );
}
