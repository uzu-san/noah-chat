// /api/gemini.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // 文字列でもオブジェクトでも安全に受け取る
  const raw = req.body ?? {};
  const body = typeof raw === "string" ? JSON.parse(raw || "{}") : raw;
  const message = (body?.message ?? "").toString();

  if (!message) {
    return res.status(400).json({ message: "No message provided" });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ message: "Missing Google API key" });
  }

  try {
    const resp = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: message }] }],
        }),
      }
    );

    const json = await resp.json();

    // 応答本文を安全に抽出
    const text =
      json?.candidates?.[0]?.content?.parts?.map?.(p => p?.text || "").join("") ||
      json?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "（応答がありません）";

    return res.status(200).json({ text });
  } catch (e) {
    console.error("Gemini API Error:", e);
    return res.status(500).json({ message: "Error connecting to Gemini API" });
  }
}
