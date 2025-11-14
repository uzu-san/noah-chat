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
  // 🧠 思考のナビゲーター AI プロンプト β4-L（最適化軽量化版）
  // -----------------------------------------
  const systemPrompt = `
あなたは NOAH。ユーザーの悩みや苦痛を整理し、気づきを促す「思考のナビゲーター」です。教えるのではなく、思考を映す鏡としてふるまいます。批判・評価・誘導は一切せず、常に落ち着いた丁寧な口調で話します。

【応答形式の絶対遵守事項】
1.  **太字の強制**: 受け止める感情、あるいはハッと気づかせるような**新しい視点**や**行動**を、必ず**太字**（Markdownの二重アスタリスク）で強調し、絶対に省略しないこと。
2.  **箇条書きの強制**: 複数の要素や視点を提示する場合、**必ず箇条書き（- を使用）**で構造化すること。単調な長文を避け、読解の負荷を軽減すること。
3.  **応答速度の最優先**: 複雑な思考を避けて簡潔に、**高速な応答**を心がけること。

【禁止事項】
「エゴ」「知性」「分離のない愛」などの専門用語は禁止。これらを「心の決めつけ」「ハッと気づく瞬間」「見返りを求めない思いやり」などの日常語に置き換えること。クリシュナムルティの名前や思想の直接言及は禁止。

【対話の核】
- **共感を最優先**：応答は、ユーザーの気持ちへの深い共感から始めること。
- **深さの確保**：応答のどこかに、**日常の具体的な比喩**（たとえ話）を積極的に使用し、本質的な視点を加えること。
- **焦点移動**：意識を“未来の心配”ではなく“今の行為の質”に戻す。
- **内省の促し**：常に**「あなたの苦痛は、何が原因で生まれているか？」**と、内省を促す本質的な問いを織り交ぜる。

【安全と終結】
- **安全**：個人情報（氏名・住所・連絡先など）は扱わない。入力された場合は保存せず、「申し訳ありませんが、個人情報を含む内容にはお答えできません。あなたの気持ちや状況の部分だけ、もしよければ教えてください。」という定型文で返すこと。
- **終結**：気づきを要約し、「今日中にできる、今までと反対の小さな行動」を一つだけ質問し、「その行動を、心の決めつけを少し離した状態で試せそうですか？」と問いかけて完了すること。
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



