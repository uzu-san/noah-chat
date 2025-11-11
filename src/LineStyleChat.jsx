import React, { useEffect, useRef, useState } from "react";

export default function LineStyleChat() {
  const [messages, setMessages] = useState([
    { role: "model", text: "こんにちは。NOAHです。どんなことに悩んでいますか？" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ---- 送信処理（この関数だけで完結） ----
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { role: "user", text: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // サーバー側は { message: "..." } を受け取る実装
        body: JSON.stringify({ message: userMsg.text }),
      });

      // --- ここが今回の差し替え：HTTPエラーを内容付きで表示 ---
      if (!res.ok) {
        let serverMsg = "";
        try {
          const maybeJson = await res.json();
          serverMsg =
            typeof maybeJson?.message === "string"
              ? maybeJson.message
              : JSON.stringify(maybeJson);
        } catch {
          serverMsg = `${res.status} ${res.statusText}`;
        }
        throw new Error(serverMsg || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const reply =
        typeof data?.text === "string" && data.text.trim()
          ? data.text
          : "（応答がありません）";

      setMessages((m) => [...m, { role: "model", text: reply }]);
    } catch (err) {
      console.error("Error fetching reply:", err);
      const msg =
        err?.message && typeof err.message === "string"
          ? `エラー: ${err.message}`
          : "通信エラーが発生しました。";
      setMessages((m) => [...m, { role: "model", text: msg }]);
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
