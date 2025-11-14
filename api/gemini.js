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
    console.log("API response:", data); // ★ ここで中身を確認できる

    const reply =
      typeof data?.text === "string" && data.text.trim()
        ? data.text
        : data?.message
        ? `サーバーエラー: ${data.message}`
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
