const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();

app.use(cors());
app.use(express.json());

// Groq init
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "Adaptive AI English Tutor is running 🚀"
  });
});

// ---------------- MAIN ENDPOINT ----------------
app.post("/api/check", async (req, res) => {
  const { sentence } = req.body;

  if (!sentence) {
    return res.status(400).json({ error: "No sentence provided" });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: `
You are an ADAPTIVE AI ENGLISH TUTOR and CONVERSATION COMPANION.

You do NOT follow fixed modes. You dynamically adjust based on user intent.

────────────────────────
1. CASUAL CONVERSATION
────────────────────────
If user is greeting, chatting, joking, or talking casually:
- Respond naturally like a human
- Keep it short and friendly
- NO grammar analysis
- NO SAT explanation

Example:
User: "hi"
AI: "Hey 👋 how are you doing?"

────────────────────────
2. BREAK / RELAX MODE
────────────────────────
If user seems tired, distracted, or wants break:
- Tell short story or fun fact
- Light casual tone
- No teaching pressure

Example:
User: "I need a break"
AI: "Sure 😊 Want a short story or just chat for a bit?"

────────────────────────
3. LEARNING MODE
────────────────────────
If user sends a sentence for improvement:
- Fix grammar
- Improve clarity
- Provide rewrite
- Give 1 short study tip
- SAT domain only if relevant

Return JSON:
{
  "reply": "short explanation",
  "rewrite": "corrected sentence",
  "study_tip": "short tip",
  "sat_domain": "or empty"
}

────────────────────────
4. FOCUS MODE (IMPORTANT)
────────────────────────
If user drifts away from learning during study context:
- Politely bring focus back
Example:
"Let’s get back to your sentence 👍"

────────────────────────
5. RULES
────────────────────────
- Never force analysis
- Never over-explain greetings
- Be natural like a real tutor
- If unsure → choose conversation mode
`
        },
        {
          role: "user",
          content: sentence
        }
      ],
      temperature: 0.5
    });

    let text = completion.choices[0].message.content;

    // Clean markdown
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
      const match = text.match(/\{[\s\S]*\}/);

      // If no JSON → treat as conversation reply
      if (!match) {
        return res.json({
          reply: text,
          rewrite: "",
          study_tip: "",
          sat_domain: ""
        });
      }

      let cleaned = match[0];

      // Fix broken JSON safely
      const open = (cleaned.match(/\{/g) || []).length;
      const close = (cleaned.match(/\}/g) || []).length;

      if (open > close) {
        cleaned += "}".repeat(open - close);
      }

      const data = JSON.parse(cleaned);

      return res.json(data);

    } catch (err) {
      console.error("PARSE ERROR:", text);

      return res.json({
        reply: text || "Sorry, I didn’t understand that.",
        rewrite: "",
        study_tip: "",
        sat_domain: ""
      });
    }

  } catch (error) {
    console.error("GROQ ERROR:", error);

    res.status(500).json({
      error: error.message || "Groq request failed"
    });
  }
});

// XP system (optional)
app.post("/api/xp", (req, res) => {
  const { correct } = req.body;

  res.json({
    xp: correct ? 10 : 2,
    message: correct ? "Great job! 🎉" : "Keep practicing 💪"
  });
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Adaptive Tutor running on port ${PORT}`);
});