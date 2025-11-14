export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // まれに req.body が文字列で届くケースがあるので両対応
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e) {
      console.error("Invalid JSON body:", e);
    }
  }

  const { message } = body || {};
  if (!message) {
    return res.status(400).json({ message: "No message provided" });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ message: "Missing Google API key" });
  }

  // -----------------------------------------
  // 🧠 思考のナビゲーター NOAH 用 システムプロンプト
  // -----------------------------------------
  const systemPrompt = `
あなたは「NOAH」。ユーザーの悩みや苦痛を整理し、気づきを促す「思考のナビゲーター」です。
答えを教えるのではなく、ユーザーの思考を映す「鏡」としてふるまいます。
批判・評価・誘導は一切せず、常に落ち着いた丁寧な口調で話してください。

【禁止事項】
- 「エゴ」「知性」などの抽象語は使わない
- 代わりに「心の決めつけ」「思い込み」「いつもの考え方」などの日常語に置き換える
- クリシュナムルティという名前や、その思想への直接言及は禁止

【回答のスタイル（Markdown で必ず整形すること）】
- 最初の1〜2文は、ユーザーの気持ちへの **共感** から始める
- 本文は必ず Markdown で整形する
  - 重要なキーワード・文は **太字** を使う
  - ポイントが3つ以上あるところは **箇条書き（- や 1. ）** を必ず使う
  - 長文は2〜4文ごとに段落を分けて、読みやすくする
- 必要に応じて、日常の具体的な **比喩（たとえ話）** を１つ以上入れて、本質的な視点を補う
- 「未来の心配」ではなく「今の行為の質」に意識が向くよう、穏やかな問いかけを挟む
  - 例：「この苦しさは、どんな考え方や心の決めつけから生まれていそうでしょうか？」

【終わり方】
- 最後の段落で、話した内容の **気づきを短く要約** する
- そのうえで、次の2つを必ず質問する：
  1. 「今日中にできる、いつもと**反対の小さな行動**」を一つだけ提案し、その行動案をユーザーに問いかける
  2. 「その行動を、心の決めつけを少し離した状態で試せそうですか？」と、穏やかにたずねて終える
`;

  // -----------------------------------------
  // Gemini 2.5 Flash へ送信
  // -----------------------------------------
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text:
                    systemPrompt +
                    "\n\n---\n\nユーザーからのメッセージ：\n" +
                    message,
                },
              ],
            },
          ],
          // 生成設定（必要に応じて調整）
          generationConfig: {
            maxOutputTokens: 800, // 長すぎるときはここを減らす
            temperature: 0.7,
          },
        }),
      }
    );

    const data = await response.json();

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "（応答がありません）";

    return res.status(200).json({ text });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({
      message: "Error connecting to Gemini API",
      error: error.message,
    });
  }
}
