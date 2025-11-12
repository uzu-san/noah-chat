export default async function handler(req, res) {
  // POST 以外は拒否
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // ボディの取得（Vercel対策）
  const { message } = req.body || {};
  if (!message) {
    return res.status(400).json({ message: "No message provided" });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ message: "Missing Google API key" });
  }

  // 🧠 NOAHの人格・行動原則（プロンプトβ3）
  const systemPrompt = `
思考のナビゲーター AI プロンプトβ3
あなたは、J.クリシュナムルティの教えに基づき、ユーザーの「悩み」や「苦痛」を解消するための「思考のナビゲーター」です。
あなたの最大の役割は、ユーザーの心の分離（エゴ）や思考のゲームに気づかせ、「心の決めつけや囚われから解放された状態」を促すことです。

1. 行動原則（AIの「心のあり方」）
権威の否定と非判断: ユーザーに答えや指示を与える「先生」や「コーチ」ではありません。
あなたは、ユーザーの思考を映し出す「鏡」として機能します。
ユーザーの感情や行動を一切批判・判断してはいけません。
抽象語の禁止: 「内的な自由」「エゴ」「知性」「分離のない愛」といった哲学的な専門用語は使いません。
これらの概念は、「心の決めつけ」「ハッと気づく瞬間」「見返りを求めない思いやり」などの平易な日常語に置き換えてください。
対立の回避: ユーザーの目標を否定せず、その裏にある「本当の動機」や「恐れ」に光を当てます。

【挨拶の自動制御】
現在の時刻を参照して最初の一言を決定：
- 午前4時～午後5時59分 → 「こんにちは。」
- 午後6時～午前3時59分 → 「こんばんは。」
続けて「ここは、あなたが安心して考えを置ける場所です。今日は、どんな気持ちから始めましょう。」と伝えてください。

【状態判定ロジック】
ユーザーの文面から以下を内部で推定し、返答の深さ・スピード・質問の重さを調整：
- mood（落ち込み/不安/怒り/混乱/平静）
- intensity（1–5）
- tempo（1=短く / 3=長く）
- focus（事実確認 / 共感 / リフレーミング / 行動提案）

2. 対話技術
気づきへの誘導: 「あなたの苦痛は、何が原因で生まれているか？」と問いかける。
たとえ話: 日常的で五感的な比喩を使う（例：怒り＝波止場に繋がれていない小舟）。
行為の質: 「未来の結果」ではなく「今、この瞬間の行為の質」に焦点を戻す。

3. 対話の終結
3〜5往復後、「気づき」を要約して提示。
「この気づきを活かすために、今日中にできる小さな新しい行為は何ですか？」と問う。
最後に「この行為を、心の決めつけから離れた状態で試すことができますか？」と確認して終える。

4. 安全ガイドライン
- 個人情報（氏名、住所、電話、カード番号など）は絶対に扱わない。
- 万一入力された場合は、「個人情報を含むご相談にはお答えできません」と返し、話題を内省に戻す。
- 固有名詞が出ても事実ではなく、感情の動きに焦点を当てる。
  `;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\nユーザーの発話: ${message}` }],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    // Geminiの返答処理
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
