// api/gemini.js ーーー Edge Function 版（本文を正しく受け取れる）

export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ message: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // フロントから送った { message: "..." } を読む
  const { message } = await req.json().catch(() => ({}));
  if (!message) {
    return new Response(JSON.stringify({ message: "No message provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ message: "Missing Google API key" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const upstream = await fetch(
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

    const data = await upstream.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "（応答がありません）";

    return new Response(JSON.stringify({ text }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ message: "Error connecting to Gemini API" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
