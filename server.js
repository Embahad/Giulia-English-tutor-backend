const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// Gemini setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "English Tutor API (Gemini AI) is running 🚀"
  });
});

// MAIN AI TUTOR ENDPOINT
app.post("/api/check", async (req, res) => {
  const { sentence } = req.body;

  if (!sentence) {
    return res.status(400).json({
      error: "No sentence provided"
    });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const prompt = `
You are an expert English tutor.

Your job:
1. Correct the student's sentence
2. Explain mistakes simply
3. Give the improved version
4. Be friendly, clear, and encouraging
5. Do NOT be rude or too long

Student sentence:
"${sentence}"
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return res.json({
      original: sentence,
      feedback: text
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Gemini AI request failed"
    });
  }
});

// SIMPLE XP SYSTEM (optional for frontend)
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