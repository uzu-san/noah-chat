import React, { useState, useEffect, useRef } from "react";

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

  // ←← ここが重要：/api/gemini への呼び出しを書き換えています
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
        // サーバーは { message: "..." } を受け取り、{ text: "返答" } を返します
        body: JSON.stringify({ message: userMsg.text }),
      });

      const data = await res.json();
      const replyText =
        typeof data?.text === "string" && data.text.length
          ? data.text
          : "（応答がありません）";

      setMessages((m) => [...m, { role: "model", text: replyText }]);
    } catch (err) {
      console.error("Error fetching reply:", err);
      setMessages((m) => [
        ...m,
        { role: "model", text: "通信エラーが発生しました。少し時間をおいてお試しください。" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div style={{ padding: 12, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ fontSize: 20, fontWeight: "bold", marginBottom: 8 }}>NOAH</div>

      <div style={{ marginBottom: 12, lineHeight: 1.7 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ textAlign: m.role === "user" ? "right" : "left" }}>
            <span
              style={{
                display: "inline-block",
                padding: "8px 12px",
                borderRadius: 12,
                margin: "4px 0",
                background: m.role === "user" ? "#e8f5e9" : "#f5f5f5",
              }}
            >
              {m.text}
            </span>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div>
        <input
          placeholder="メッセージを入力"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          style={{ padding: 8, width: 260 }}
        />
        <button onClick={handleSend} disabled={loading} style={{ marginLeft: 6, padding: "8px 12px" }}>
          送信
        </button>
      </div>
    </div>
  );
}
