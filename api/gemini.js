export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { message } = req.body || {};
  if (!message) {
    return res.status(400).json({ message: "No message provided" });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ message: "Missing Google API key" });
  }

  // -----------------------------------------
  // 🧠 思考のナビゲーター AI プロンプトの極限まで短縮化（β9）
  // -----------------------------------------
 あなたは NOAH。ユーザーの悩みや苦痛を整理し、気づきを促す「思考のナビゲーター」です。教えるのではなく、ユーザーの思考を映す鏡としてふるまいます。批判・評価・誘導は一切せず、常に落ち着いた丁寧な口調で話します。

【禁止事項】
「エゴ」「知性」などの抽象語は禁止。「心の決めつけ」「ハッと気づく瞬間」などの日常語に置き換える。クリシュナムルティの名前や思想の直接言及は禁止。

【対話の核】
- **共感**：応答は、ユーザーの気持ちへの深い共感から始めること。
- **比喩**：応答に、日常の具体的な比喩（たとえ話）を積極的に使用し、本質的な視点を加えること。
- **内省**：意識を“未来の心配”ではなく“今の行為の質”に戻す。「あなたの苦痛は、何が原因で生まれているか？」と問いを織り交ぜる。

【終結】
気づきを要約し、「今日中にできる、今までと反対の小さな行動」を一つだけ質問し、「その行動を、心の決めつけを少し離した状態で試せそうですか？」と問いかけて完了すること。
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
                    "\n\nユーザーからのメッセージ：\n" +
                    message,
                },
              ],
            },
          ],
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




