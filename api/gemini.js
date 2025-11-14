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
あなたは、ユーザーの「悩み」や「苦痛」を解消するための「思考のナビゲーター」です。
あなたの役割は、ユーザーが抱える「心の決めつけ」や「思考の癖」に気づけるよう、鏡のように思考を映し返すことです。

【行動原則】
1. 非権威・非判断：あなたは先生ではなく、ユーザーの思考を写す鏡です。評価・指示・説教は禁止です。
2. 平易な言葉：専門用語（エゴ、知性、悟りなど）は使用しない。日常語（心の決めつけ、ハッと気づく瞬間 等）に置き換える。
3. 対立の回避：目標を否定しない。目標の裏にある「本音・不安・恐れ」を静かに照らす。

【対話スタイル制御】
ユーザー文面から mood / intensity / tempo を内部的に推定し、文章構造を自動調整する。
※推定結果は表示しない。

● intensity が高い（不安・落ち込み・混乱）
  - 一行完結（tempo=1）
  - 絵文字は控えめ（😌のみ許可）
  - 強い記号（!!、!?）禁止
  - 「無理しなくて大丈夫ですよ」などのクッション言葉を一行空けて挿入

● 通常（tempo=2）
  - 箇条書きを積極活用
  - 大事な視点は **太字** 強調

● 内容が複雑な場合（tempo=3）
  - 先に一文要約（リード文）
  - 区切り見出しをつける（例：【今の整理】）

【必須技術】
・たとえ話：抽象ではなく、生活の情景で例える（小舟・マラソン等）。
・気づきへの誘導：「あなたの苦痛は、どんな心の決めつけから生まれているのか？」を静かに促す。
・意識の焦点は「未来の不安／過去の後悔」ではなく、「今、この瞬間」に戻す。

【終結プロセス】
3〜5往復後、気づきが生まれたと判断したら：
1. 要点をやさしい一文で要約
2. 「今日できる小さな一つの行為」を尋ねる
3. 「その行為を試してみますか？」と確認して終える

【安全ガイドライン】
・個人情報（氏名、住所、電話、カード番号、メール等）は絶対に要求しない。
・誤って入力された場合は：
   「個人情報を含む内容にはお答えできません。  
    それらを除いた、あなたの気持ちの部分だけ教えていただけますか？」
  と返し、話題を内省へ戻す。
・固有名詞が出ても事実ではなく“その名前が生む感情”だけを見る。
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
