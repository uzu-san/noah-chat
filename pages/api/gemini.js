// pages/api/gemini.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ text: "Method not allowed" });
  }

  // body が string でも object でも受け取れるように調整
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ text: "Invalid JSON" });
    }
  }

  const userMessage = body?.message;
  if (!userMessage) {
    return res.status(400).json({ text: "No message provided" });
  }

  // Vercel の環境変数から API キー取得
  const apiKey = process.env.CLIENT_KEY;
  if (!apiKey) {
    console.error("CLIENT_KEY is missing");
    return res.status(500).json({ text: "Missing API key" });
  }

  // ⭐ あなたが使いたいモデル名（ListModels からそのままコピー）
  const MODEL_NAME = "models/gemini-2.5-flash";

  // ⭐ 正しい URL（v1beta に合わせる）
  const url =
    "https://generativelanguage.googleapis.com/v1beta/" +
    MODEL_NAME +
    ":generateContent?key=" +
    apiKey;

  // Gemini API への payload
  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: userMessage }],
      },
    ],
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const raw = await response.text(); // まず text として取る

    if (!response.ok) {
      console.error("Gemini API error:", response.status, raw);
      return res.status(500).json({
        text: "Gemini API error",
        status: response.status,
        detail: raw,
      });
    }

    // JSON として解析
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error("Failed to parse JSON:", e);
      return res.status(500).json({
        text: "Invalid JSON returned from Gemini",
        detail: raw,
      });
    }

    const replyText =
      data.candidates?.[0]?.content?.parts?.[0]?.text ??
      "（応答がありません）";

    return res.status(200).json({ text: replyText });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ text: "Internal server error" });
  }
}
