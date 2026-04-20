const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();

app.use(cors());
app.use(express.json());

// --------------------
// GROQ SETUP
// --------------------
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// --------------------
// HEALTH CHECK
// --------------------
app.get("/", (req, res) => {
  res.json({
    message: "English Tutor API (Stable Production Mode) 🚀"
  });
});

// --------------------
// MAIN AI ENDPOINT
// --------------------
app.post("/api/check", async (req, res) => {
  const { sentence } = req.body;

  if (!sentence) {
    return res.status(400).json({
      error: "No sentence provided"
    });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",

      max_tokens: 500,

      messages: [
        {
          role: "system",
          content: `
You are an expert Digital SAT English tutor AND natural conversation partner.

You must intelligently switch between:

------------------------
MODE 1: CONVERSATION
------------------------
- For greetings, short replies, emotional text
- Be natural and human
- NO grammar breakdown
- NO structured analysis
- Keep it short and engaging

------------------------
MODE 2: SAT ENGLISH
------------------------
- For full sentences or grammar mistakes
- Correct grammar and clarity
- Identify SAT domain
- Give 2 vocabulary improvements
- Provide polished rewrite
- Add 1 short study tip

------------------------
IMPORTANT RULES:
------------------------
- ALWAYS return COMPLETE valid JSON
- NEVER return partial JSON
- NEVER stop mid-output
- DO NOT include markdown or explanations outside JSON

------------------------
OUTPUT FORMAT:
------------------------

{
  "mode": "conversation | sat",
  "reply": "natural response",
  "sat_domain": "Standard English Conventions / Expression of Ideas / Vocabulary in Context / empty",
  "vocabulary_boost": "2 words or empty",
  "rewrite": "improved sentence or empty",
  "study_tip": "only for SAT mode or empty",
  "tone": "formal / informal / neutral / emotional",
  "mood": "happy / confused / frustrated / neutral / excited"
}
`
        },
        {
          role: "user",
          content: sentence
        }
      ],

      temperature: 0.4
    });

    let text = completion.choices[0].message.content;

    // --------------------
    // CLEAN OUTPUT
    // --------------------
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    let data;

    try {
      const match = text.match(/\{[\s\S]*\}/);

      if (!match) throw new Error("No JSON found");

      let cleaned = match[0];

      // --------------------
      // AUTO FIX BROKEN JSON
      // --------------------
      const openBraces = (cleaned.match(/\{/g) || []).length;
      const closeBraces = (cleaned.match(/\}/g) || []).length;

      if (openBraces > closeBraces) {
        cleaned += "}".repeat(openBraces - closeBraces);
      }

      data = JSON.parse(cleaned);

    } catch (err) {
      console.error("BROKEN AI OUTPUT:", text);

      return res.json({
        mode: "conversation",
        reply: "Sorry, I didn’t fully understand that — can you rephrase it?",
        sat_domain: "",
        vocabulary_boost: "",
        rewrite: "",
        study_tip: "",
        tone: "neutral",
        mood: "confused"
      });
    }

    res.json(data);

  } catch (error) {
    console.error("GROQ ERROR:", error);

    res.status(500).json({
      error: error.message || "Groq request failed"
    });
  }
});

// --------------------
// OPTIONAL XP SYSTEM
// --------------------
app.post("/api/xp", (req, res) => {
  const { correct } = req.body;

  res.json({
    xp: correct ? 10 : 2,
    message: correct ? "Great job! 🎉" : "Keep practicing 💪"
  });
});

// --------------------
// START SERVER
// --------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});