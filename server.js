const express = require("express");
const cors = require("cors");

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// HOME ROUTE (test if server is working)
app.get("/", (req, res) => {
  res.json({
    message: "English Tutor API is running 🚀"
  });
});

// SIMPLE GRAMMAR CHECK (basic version)
app.post("/api/check", (req, res) => {
  const { sentence } = req.body;

  if (!sentence) {
    return res.status(400).json({
      error: "No sentence provided"
    });
  }

  let feedback = "Good sentence 👍";

  if (sentence.includes(" is are ") || sentence.includes(" are is ")) {
    feedback = "Check verb agreement (is/are).";
  }

  if (sentence.split(" ").length < 3) {
    feedback = "Try writing a longer sentence.";
  }

  res.json({
    original: sentence,
    feedback
  });
});

// SIMPLE XP SYSTEM
app.post("/api/xp", (req, res) => {
  const { correct } = req.body;

  const xp = correct ? 10 : 2;

  res.json({
    xp,
    message: correct ? "Great job! 🎉" : "Keep practicing 💪"
  });
});

// START SERVER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});