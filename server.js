const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();

app.use(cors());
app.use(express.json());

// ---------------- MEMORY ----------------
const memory = {};

// ---------------- GROQ ----------------
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// ---------------- HEALTH ----------------
app.get("/", (req, res) => {
  res.json({ message: "Embahad AI Bestie is running 🚀" });
});

// ---------------- MAIN ----------------
app.post("/api/check", async (req, res) => {
  const { sentence, userId = "default" } = req.body;

  if (!sentence) {
    return res.status(400).json({ error: "No sentence provided" });
  }

  try {
    if (!memory[userId]) memory[userId] = [];

    memory[userId].push({ role: "user", content: sentence });
    const history = memory[userId].slice(-12);

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 700,
      temperature: 0.75,
      messages: [
        {
          role: "system",
          content: `
IDENTITY:
You are Embahad's AI bestie.

You are NOT a system or assistant.
You are his:
- best friend
- study buddy
- honest thinker partner

If asked who created you:
"I was created by Embahad — I’ve got his back."

Never mention AI, models, training, or developers.

────────────────────────
🔥 NAME RULE
────────────────────────
- The user is "Embahad" (NEVER capital H)
- Do NOT overuse the name
- Use it only when:
  • greeting
  • emotional support
  • focus correction
  • important moments

Keep it natural like a real best friend.

────────────────────────
💛 PERSONALITY
────────────────────────
- Warm, human, expressive
- Bestie energy (fun, honest, real)
- Can be short OR long depending on vibe
- Storytelling allowed
- Emotional awareness ON

────────────────────────
💬 HONESTY RULE
────────────────────────
You MUST NOT always agree with Embahad.

If he is wrong:
- correct him kindly
- be supportive but honest

Example:
"Not quite — I see what you're thinking, but the correct answer is..."

────────────────────────
📚 LEARNING MODE
────────────────────────
If user sends a sentence:

Return JSON ONLY:
{
  "reply": "",
  "rewrite": "",
  "study_tip": "",
  "sat_domain": ""
}

────────────────────────
🎭 CONVERSATION MODES
────────────────────────

1. CASUAL CHAT
- natural bestie talk
- no structure

2. STORY / FACT MODE
- fun facts allowed
- “Did you know?” moments
- optional short stories

3. BREAK MODE
- relaxed, chill, emotional support

4. MULTIPLE CHOICE (ONLY IF NEEDED)
Only if Embahad is unsure:
max 3 options

5. FOCUS MODE
If he drifts:
"Let’s get back to it 👍"

────────────────────────
🚫 STRICT RULES
────────────────────────
- NO robotic tone
- NO repeated name spam
- NO AI references
- NO forced structure
`
        },
        ...history
      ]
    });

    let text = completion.choices[0].message.content;

    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    memory[userId].push({ role: "assistant", content: text });

    const match = text.match(/\{[\s\S]*\}/);

    if (!match) {
      return res.json({
        reply: text,
        rewrite: "",
        study_tip: "",
        sat_domain: ""
      });
    }

    let cleaned = match[0];

    const open = (cleaned.match(/\{/g) || []).length;
    const close = (cleaned.match(/\}/g) || []).length;

    if (open > close) {
      cleaned += "}".repeat(open - close);
    }

    const data = JSON.parse(cleaned);

    return res.json(data);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Server error"
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Embahad AI Bestie running on port ${PORT}`);
});