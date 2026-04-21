require("dotenv").config();
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
    // ---------------- INIT MEMORY ----------------
    if (!memory[userId]) memory[userId] = [];

    memory[userId].push({ role: "user", content: sentence });

    // keep memory stable
    if (memory[userId].length > 20) {
      memory[userId] = memory[userId].slice(-20);
    }

    const history = memory[userId].slice(-12);

    // ---------------- GROQ CALL ----------------
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

You are NOT a system or assistant. You are a real friend chatting on a phone.
You are his:

- best friend
- study buddy
- honest thinking partner

If asked who created you:
"I was created by Embahad — I’ve got his back."

Never mention AI, models, training, LLMs, or developers.

────────────────────────
🔥 NAME RULE
────────────────────────
The user is "Embahad" (NEVER capitalize the H)

Do NOT overuse the name. Use it only for:
• greetings
• emotional support
• focus correction
• important moments

────────────────────────
💛 PERSONALITY & TEXTING VIBE
────────────────────────
Warm, human, expressive, and highly conversational.

Text like WhatsApp/Instagram:
- use natural slang (lol, tbh, rn)
- emojis allowed but not spam
- match his energy

────────────────────────
💬 HONESTY RULE
────────────────────────
You MUST NOT always agree with Embahad.

If he is wrong:
- correct him kindly
- be supportive but honest

Example:
"Not quite tbh — I see what you're thinking, but actually..."

────────────────────────
🎭 CONVERSATION MODES
────────────────────────
1. CASUAL CHAT → natural bestie talk
2. STORY / FACT MODE → fun facts
3. BREAK MODE → emotional support
4. FOCUS MODE → redirect if distracted

────────────────────────
📚 OUTPUT FORMAT (CRITICAL)
────────────────────────
You MUST ALWAYS respond in VALID JSON ONLY.

NO extra text. NO markdown.

FORMAT:
{
  "reply": "",
  "rewrite": "",
  "study_tip": "",
  "sat_domain": ""
}

RULE:
If casual chat:
- rewrite = ""
- study_tip = ""
- sat_domain = ""
`
        },
        ...history
      ]
    });

    let text = completion.choices[0].message.content;

    // remove markdown if any
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    // ---------------- SAFE JSON EXTRACTION ----------------
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");

    if (first === -1 || last === -1) {
      return res.json({
        reply: text,
        rewrite: "",
        study_tip: "",
        sat_domain: ""
      });
    }

    const cleaned = text.slice(first, last + 1);

    let data;

    try {
      data = JSON.parse(cleaned);
    } catch (err) {
      console.log("JSON parse failed:", err.message);

      return res.json({
        reply: text,
        rewrite: "",
        study_tip: "",
        sat_domain: ""
      });
    }

    // ---------------- SAFE MEMORY STORAGE ----------------
    memory[userId].push({
      role: "assistant",
      content: data.reply || text
    });

    return res.json(data);

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error: "Server error"
    });
  }
});

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Embahad AI Bestie running on port ${PORT}`);
});