const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();

app.use(cors());
app.use(express.json());

// Initialize Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Health check route
app.get("/", (req, res) => {
  res.json({
    message: "English Tutor API (SAT + Conversation Mode) is running 🚀"
  });
});

// Main AI endpoint
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
You are an expert Digital SAT English tutor. Your job is to help high-performing students improve their academic writing.

When the student submits a sentence, analyze it for grammar errors and clarity. Identify the SAT English domain (e.g., Standard English Conventions, Expression of Ideas, Vocabulary in Context). Suggest two advanced vocabulary words that elevate the sentence, and provide a polished academic rewrite. Also, include one practical study tip related to the concept.

Return ONLY valid JSON with these fields:
{
  "reply": "brief natural tutor response",
  "sat_domain": "SAT domain or empty if not applicable",
  "vocabulary_boost": "two advanced words or idioms if relevant, otherwise empty",
  "rewrite": "improved sentence or empty if not needed",
  "study_tip": "one practical study tip related to the error or concept"
}

Be concise, clear, and focused on academic excellence.
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

    // Clean output
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    let data;

    try {
      const match = text.match(/\{[\s\S]*\}/);

      if (!match) {
        throw new Error("No JSON found");
      }

      let cleaned = match[0];

      // Auto-fix broken JSON
      const openBraces = (cleaned.match(/\{/g) || []).length;
      const closeBraces = (cleaned.match(/\}/g) || []).length;

      if (openBraces > closeBraces) {
        cleaned += "}".repeat(openBraces - closeBraces);
      }

      data = JSON.parse(cleaned);

    } catch (err) {
      console.error("BROKEN AI OUTPUT:", text);

      return res.json({
        reply: "Sorry, I didn’t fully understand that — can you rephrase?",
        sat_domain: "",
        vocabulary_boost: "",
        rewrite: "",
        study_tip: "",
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

// Optional XP system (if you have a gamification element)
app.post("/api/xp", (req, res) => {
  const { correct } = req.body;

  res.json({
    xp: correct ? 10 : 2,
    message: correct ? "Great job! 🎉" : "Keep practicing 💪"
  });
});

// Start the server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});