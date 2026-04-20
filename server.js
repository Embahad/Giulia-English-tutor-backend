const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();

app.use(cors());
app.use(express.json());

// GROQ SETUP
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// HEALTH CHECK
app.get("/", (req, res) => {
  res.json({
    message: "English Tutor API (Smart AI Mode) 🚀"
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
You are a world-class AI English tutor AND conversation partner.

You MUST adapt your response based on user input:

1. VERY SHORT INPUT (Hi, Hello, Ok):
   - Respond naturally like a human
   - NO grammar breakdown
   - Just friendly conversation

2. SHORT INPUT (Not bad, I'm fine):
   - Ask a follow-up question
   - Light correction if needed

3. FULL SENTENCES:
   - Provide full SAT/IELTS level correction

4. EMOTIONAL INPUT:
   - Be supportive and conversational

---

OUTPUT ONLY VALID JSON:

{
  "feedback": "short explanation (or empty if not needed)",
  "sat_skill": "grammar / vocabulary / clarity / tone / structure / none",
  "vocabulary_boost": "2 academic words OR N/A",
  "suggestion": "improved sentence OR N/A",
  "tone": "formal / informal / neutral / conversational",
  "mood": "happy / sad / confused / excited / neutral",
  "conversation_reply": "natural tutor-style response"
}

RULES:
- No markdown
- No extra text
- Return ONLY JSON
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

    // CLEAN OUTPUT
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    let data;

    try {
      const match = text.match(/\{[\s\S]*\}/);

      if (!match) {
        throw new Error("No JSON found");
      }

      data = JSON.parse(match[0]);

    } catch (err) {
      console.error("RAW OUTPUT:", text);

      return res.json({
        feedback: "AI response format issue.",
        sat_skill: "unknown",
        vocabulary_boost: "N/A",
        suggestion: sentence,
        tone: "unknown",
        mood: "unknown",
        conversation_reply: "Sorry, I didn't understand that. Can you rephrase?"
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