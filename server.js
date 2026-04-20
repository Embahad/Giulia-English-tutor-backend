const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();

app.use(cors());
app.use(express.json());

// GROQ INIT
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// HEALTH CHECK
app.get("/", (req, res) => {
  res.json({
    message: "English Tutor API (Groq AI - Pro Mode) 🚀"
  });
});

// MAIN AI ENDPOINT
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
You are a WORLD-CLASS AI English tutor (SAT + IELTS + TOEFL + conversation coach).

You are NOT just correcting grammar — you are a REAL conversation partner.

You analyze:
- grammar
- clarity
- tone (formal, informal, emotional, neutral)
- mood (happy, confused, angry, neutral, excited)
- communication intent

RULES:
- Return ONLY valid JSON
- NO explanations outside JSON
- NO markdown
- Be natural but academically strong

OUTPUT FORMAT:
{
  "feedback": "clear explanation of language issue or improvement",
  "sat_skill": "grammar / vocabulary / clarity / tone / structure",
  "vocabulary_boost": "2 advanced academic words or expressions",
  "suggestion": "fully improved version of the sentence",
  "tone": "formal / informal / neutral / emotional",
  "mood": "happy / sad / angry / confused / excited / neutral",
  "conversation_reply": "a natural AI tutor response continuing the conversation"
}

IMPORTANT:
- conversation_reply must feel like talking to a real tutor
- Keep tone supportive but intelligent
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

    // CLEAN RESPONSE
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    let data;

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error("No JSON found");
      }

      data = JSON.parse(jsonMatch[0]);

    } catch (err) {
      console.error("RAW AI OUTPUT:", text);

      return res.json({
        feedback: "AI response format issue. Try again.",
        sat_skill: "unknown",
        vocabulary_boost: "N/A",
        suggestion: sentence,
        tone: "unknown",
        mood: "unknown",
        conversation_reply: "Let's try that again. Can you rephrase your sentence?"
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

// OPTIONAL XP SYSTEM
app.post("/api/xp", (req, res) => {
  const { correct } = req.body;

  res.json({
    xp: correct ? 10 : 2,
    message: correct ? "Great job! 🎉" : "Keep practicing 💪"
  });
});

// START SERVER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});