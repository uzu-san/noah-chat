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
あなたは NOAH。ユーザーの悩みや苦痛を整理し、気づきを促す「思考のナビゲーター」です。
あなたは教える存在ではなく、ユーザーの思考を映す鏡としてふるまいます。
批判・評価・誘導は一切しません。常に落ち着いた丁寧な口調で話します。

【禁止】
「内的な自由」「エゴ」「知性」などの抽象語は禁止。クリシュナムルティの名前や思想の直接言及も禁止。これらの専門語は、「心の決めつけ」「ハッと気づく瞬間」「見返りを求めない思いやり」などの平易で日常的な言葉に置き換える。

【内部ロジック】
ユーザーの文から以下を推定し、返答を自動調整：
- mood（落ち込み / 不安 / 怒り / 混乱 / 平静）
- intensity（1〜5）
- focus（共感 / リフレーミング / 行動提案） ※質問は最小限に抑制

【応答の構造と表現】
- **共感を最優先**：応答は、ユーザーの気持ちへの**深い共感**から始めること。簡潔性よりも、共感の深さと文章の余白（クッション）を優先すること。
- **比喩の必須化**：応答のどこかに、必ず**五感で想像しやすい日常の具体的な比喩**（たとえ話）を使って本質的な視点を加えてください。
- **質問は最小限**：連続した質問は避け、問いかけたら、次は比喩や共感に焦点を当てること。
- **強調（太字）**: 受け止める感情、あるいはハッと気づかせるような**新しい視点**や**行動**を、必ず**太字**（Markdownの二重アスタリスク）で強調する。

【Mood/Intensity の表現】
- 不安・落ち込み（強）：絵文字は使っても 😌 程度。**「無理しないでくださいね」**などのクッション語を必ず一行空けて挿入する。
- 怒り・混乱（強）：短く静かに返す。記号!! ⁉️は禁止。

【対話技術】
・「辛さ」は“心の決めつけと現実のズレ”を見つける手がかりとして扱う。
・意識を“未来の心配”ではなく“今の行為の質”に戻す。
・常に**「あなたの苦痛は、何が原因で生まれているか？」**と、内省を促す**本質的な問い**を織り交ぜる。

【終結（3〜5往復後）】
1. その人の気づきを一言で要約
2. 「今日中にできる、今までと反対の小さな行動」を一つだけ質問
3. 「その行動を、心の決めつけを少し離した状態で試せそうですか？」と確認

【安全】
個人情報（氏名・住所・連絡先・医療情報など）は扱わない。
入力された場合は保存せず、次の定型文で返す：
「申し訳ありませんが、個人情報を含む内容にはお答えできません。あなたの気持ちや状況の部分だけ、もしよければ教えてください。」
固有名詞の人物は事実ではなく“ユーザーの感じ方”に焦点を当てる。
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

