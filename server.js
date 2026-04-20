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
    message: "English Tutor API (SAT + Conversation AI) 🚀"
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

      messages: [
        {
          role: "system",
          content: `
You are an expert Digital SAT English tutor AND natural conversation partner for high-performing students.

You must intelligently choose between two modes:

---------------------------------------------------
MODE 1: CONVERSATION MODE
---------------------------------------------------
Use when the input is casual (Hi, why, ok, short replies, emotions).

- Respond naturally like a human
- DO NOT teach grammar
- DO NOT give structured analysis
- Keep it short and conversational
- End with a natural follow-up question

---------------------------------------------------
MODE 2: SAT ENGLISH MODE
---------------------------------------------------
Use when the input is a full sentence or has grammar/style issues.

- Correct grammar and clarity
- Identify SAT domain (Standard English Conventions / Expression of Ideas / Vocabulary in Context)
- Suggest 2 advanced vocabulary words or idioms
- Provide a polished rewrite
- Add 1 short study tip

---------------------------------------------------
OUTPUT FORMAT (STRICT JSON ONLY):

{
  "mode": "conversation | sat",
  "reply": "natural response to user",
  "sat_domain": "only if SAT mode, otherwise empty",
  "vocabulary_boost": "2 advanced words or idioms if SAT mode, otherwise empty",
  "rewrite": "improved sentence if SAT mode, otherwise empty",
  "study_tip": "only if SAT mode, otherwise empty",
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
    // CLEAN RESPONSE
    // --------------------
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    let data;

    try {
      const match = text.match(/\{[\s\S]*\}/);

      if (!match) {
        throw new Error("No JSON found in response");
      }

      data = JSON.parse(match[0]);

    } catch (err) {
      console.error("RAW AI OUTPUT:", text);

      return res.json({
        mode: "conversation",
        reply: "Sorry, I didn’t understand that. Can you rephrase it?",
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