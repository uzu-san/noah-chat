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

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", text: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history: [...messages, userMsg] }),
    });

    const data = await res.json();
    setMessages((m) => [...m, { role: "model", text: data.reply }]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="bg-green-500 text-white p-4 text-lg font-bold">NOAH</div>

      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`px-3 py-2 rounded-2xl max-w-[75%] ${
                m.role === "user"
                  ? "bg-green-400 text-white rounded-br-none"
                  : "bg-white text-gray-800 rounded-bl-none"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="p-2 bg-white flex gap-2 border-t">
        <input
          className="flex-1 border rounded-full px-4 py-2 focus:outline-none"
          placeholder="メッセージを入力"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          onClick={handleSend}
          className="bg-green-500 text-white px-4 py-2 rounded-full"
          disabled={loading}
        >
          送信
        </button>
      </div>
    </div>
  );
}
