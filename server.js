const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();

app.use(cors());
app.use(express.json());

// Groq setup
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "English Tutor API (Groq AI) is running 🚀"
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
      // ✅ CURRENT WORKING MODEL (IMPORTANT FIX)
      model: "llama-3.1-8b-instant",

      messages: [
        {
          role: "system",
          content: `
You are an expert English tutor for SAT, IELTS, and TOEFL students.

Return ONLY valid JSON in this format:
{
  "feedback": "short grammar explanation",
  "sat_skill": "grammar / vocabulary / clarity / structure",
  "vocabulary_boost": "1-2 advanced words",
  "suggestion": "improved academic version of the sentence"
}

Be concise, helpful, and accurate.
`
        },
        {
          role: "user",
          content: sentence
        }
      ],
      temperature: 0.7
    });

    let text = completion.choices[0].message.content;

    // clean possible formatting
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    let data;

    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error("JSON parse error:", text);

      return res.json({
        feedback: "AI response format issue. Try again.",
        sat_skill: "unknown",
        vocabulary_boost: "N/A",
        suggestion: sentence
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

// XP SYSTEM (optional)
app.post("/api/xp", (req, res) => {
  const { correct } = req.body;

  res.json({
    xp: correct ? 10 : 2,
    message: correct ? "Great job! 🎉" : "Keep practicing 💪"
  });
});

// start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});