const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

app.use(cors());
app.use(express.json());

// Gemini setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "English Tutor API (Gemini AI) is running 🚀"
  });
});

// MAIN AI TUTOR ENDPOINT
app.post("/api/check", async (req, res) => {
  const { sentence } = req.body;

  if (!sentence) {
    return res.status(400).json({ error: "No sentence provided" });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const prompt = `
You are an expert English tutor for SAT, IELTS, and TOEFL students.

Analyze the sentence:
"${sentence}"

Return ONLY valid JSON (no markdown, no explanation) in this exact format:

{
  "feedback": "brief grammar explanation",
  "sat_skill": "grammar / vocabulary / structure / clarity",
  "vocabulary_boost": "1-2 advanced word suggestions",
  "suggestion": "improved academic version of the sentence"
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // 🧠 SAFE CLEANING (VERY IMPORTANT)
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    let data;

    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error("JSON parse failed:", text);

      return res.json({
        feedback: "AI response format issue. Try again.",
        sat_skill: "unknown",
        vocabulary_boost: "N/A",
        suggestion: sentence
      });
    }

    res.json(data);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Gemini AI request failed"
    });
  }
});

// XP SYSTEM (optional)
app.post("/api/xp", (req, res) => {
  const { correct } = req.body;

  const xp = correct ? 10 : 2;

  res.json({
    xp,
    message: correct ? "Great job! 🎉" : "Keep practicing 💪"
  });
});

// start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});