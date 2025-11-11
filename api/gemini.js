// api/gemini.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Vercel環境では req.body が「文字列」のことがあるので両対応する
  let body = {};
  try {
    body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : (req.body || {});
  } catch {
    body = {};
  }

  const { message } = body;
  if (!message) {
    return res.status(400).json({ message: "No message provided" });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ message: "Missing Google API key" });
  }

  try {
    const resp = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=" +
        apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: message }] }],
        }),
      }
    );

    if (!resp.ok) {
      const errText = await resp.text();
      return res
        .status(502)
        .json({ message: "Gemini API error", detail: errText.slice(0, 500) });
    }

    const data = await resp.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "（応答がありません）";

    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ message: "Error connecting to Gemini API" });
  }
}
