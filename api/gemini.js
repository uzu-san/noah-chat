export default async function handler(req, res) {
  const { history = [] } = req.body || {};
  const userInput = history[history.length - 1]?.text || "";
  const reply = `なるほど。「${userInput}」について感じているんですね。もう少し教えてください。`;
  res.status(200).json({ reply });
}
