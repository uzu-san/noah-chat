export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ text: "Method not allowed" });
  }

  // まれに req.body が文字列で届くケースがあるので両対応
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch {}
  }
  const message = body?.message;
  if (!message) {
    return res.status(400).json({ text: "No message provided" });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ text: "Missing Google API key" });
  }

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: message }] }],
        }),
      }
    );

    const json = await resp.json();

    // ← ここを強化：APIがエラーを返したら内容をそのまま返す
    if (!resp.ok) {
      console.error("Gemini API error:", resp.status, json);
      const msg = json?.error?.message || `Gemini API returned ${resp.status}`;
      return res.status(500).json({ text: `［エラー］${msg}` });
    }

    // 応答本文を安全に取り出し（parts が複数でも結合）
    const parts = json?.candidates?.[0]?.content?.parts;
    const text = Array.isArray(parts)
      ? parts.map(p => p?.text || "").join("")
      : "";

    if (!text.trim()) {
      const safety = json?.promptFeedback?.safetyRatings?.map(r => r.category).join(", ");
      return res
        .status(200)
        .json({ text: safety ? `［安全フィルタで非表示：${safety}］` : "（応答がありません）" });
    }

    return res.status(200).json({ text });
  } catch (err) {
    console.error("Gemini API exception:", err);
    return res.status(500).json({ text: `［例外］${String(err)}` });
  }
}
