export default async function handler(req, res) {
  // POST 以外は弾く
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // ★重要★: Vercel の Node 関数では req.body を「そのまま」読む
  // （await req.body はNG）
  const { message } = (req.body || {});
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
          contents: [{ role: "user", parts: [{ text: message }] }]
        })
      }
    );

    const data = await resp.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "（応答がありません）";

    return res.status(200).json({ text });
  } catch (err) {
    console.error("Gemini API Error:", err);
    return res.status(500).json({ message: "Error connecting to Gemini API" });
  }
}
