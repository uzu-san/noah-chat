// pages/api/gemini.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // body が文字列でもオブジェクトでも対応
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.warn("Failed to parse body as JSON:", e);
      }
    }

    const message = body?.message;
    if (!message) {
      return res.status(400).json({ error: "No message provided" });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error("GOOGLE_API_KEY is missing");
      return res.status(500).json({ error: "Missing GOOGLE_API_KEY" });
    }

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" +
      apiKey;

    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: message }],
        },
      ],
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const raw = await resp.text();

    if (!resp.ok) {
      // ここで Vercel のログに詳しい内容が出ます
      console.error("Gemini API error:", resp.status, raw);
      return res.status(500).json({
        error: `Gemini API error (${resp.status})`,
        detail: raw,
      });
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error("Failed to parse Gemini response:", e, raw);
      return res.status(500).json({ error: "Invalid response from Gemini" });
    }

    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ??
      "（応答がありません）";

    return res.status(200).json({ text });
  } catch (err) {
    console.error("API handler error:", err);
    return res.status(500).json({
      error: "Internal server error",
      detail: String(err),
    });
  }
}
