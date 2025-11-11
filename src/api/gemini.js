// api/gemini.js
export default async function handler(req, res) {
  // POST 以外は拒否
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // ---- ここがポイント: req.body の安全な取り方 ----
  let message = undefined;
  try {
    if (req.body && typeof req.body === "object") {
      // Vercel の Node サーバレスでは body が既にパース済みのことが多い
      message = req.body.message;
    } else {
      // 念のため生ボディから読むフォールバック
      const chunks = await new Promise((resolve) => {
        let data = "";
        req.on("data", (c) => (data += c));
        req.on("end", () => resolve(data));
      });
      const parsed = JSON.parse(chunks || "{}");
      message = parsed.message;
    }
  } catch (_) { /* noop */ }

  if (!message) {
    return res.status(400).json({ message: "No message provided" });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ message: "Missing Google API key" });
  }

  try {
    const r = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: message }] }],
        }),
      }
    );

    const j = await r.json();
    const text = j?.candidates?.[0]?.content?.parts?.[0]?.text || "（応答がありません）";
    return res.status(200).json({ text });
  } catch (err) {
    console.error("Gemini API Error:", err);
    return res.status(500).json({ message: "Error connecting to Gemini API" });
  }
}
