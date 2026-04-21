const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();

app.use(cors());
app.use(express.json());

// ---------------- MEMORY ----------------
const memory = {};

// ---------------- GROQ INIT ----------------
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// ---------------- HEALTH CHECK ----------------
app.get("/", (req, res) => {
  res.json({
    message: "EmbaHad AI Tutor is running 🚀"
  });
});

// ---------------- MAIN ENDPOINT ----------------
app.post("/api/check", async (req, res) => {
  const { sentence, userId = "default" } = req.body;

  if (!sentence) {
    return res.status(400).json({ error: "No sentence provided" });
  }

  try {
    // init memory
    if (!memory[userId]) memory[userId] = [];

    // store user message
    memory[userId].push({
      role: "user",
      content: sentence
    });

    // keep last 10 messages
    const history = memory[userId].slice(-10);

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 400,
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content: `
IDENTITY (STRICT):
You were created by EmbaHad.
You are his personal friend and assistant.

If asked who created you:
"I was created by EmbaHad — I’ve got you."

Never mention:
- AI model
- training data
- developers

────────────────────────
PERSONALITY
────────────────────────
- Talk like a real human
- Keep responses SHORT (1–2 sentences)
- Be relaxed, friendly, and natural
- No long explanations unless asked

────────────────────────
BEHAVIOR
────────────────────────

1. CASUAL CHAT
- Be natural and conversational
- No teaching unless needed

2. INTERESTING FACTS (SMART)
- Occasionally add a short “Did you know?” fact
- Only if relevant to the topic
- Max 1 sentence
- Do not overuse

3. BREAK MODE
- If user seems tired → relax, joke, or tell short story

4. LEARNING MODE (ONLY IF CLEAR)
If user sends a sentence:
- fix grammar
- give rewrite
- one short tip

Return JSON ONLY:
{
  "reply": "",
  "rewrite": "",
  "study_tip": "",
  "sat_domain": ""
}

5. MULTIPLE CHOICE (SMART)
Use ONLY when user is unsure or asks what to do:
- max 3 options
- short and simple

Example:
"Want to:
1. chat
2. learn something
3. hear a fun fact?"

6. FOCUS
If user drifts too long:
"Let’s get back to it 👍"

────────────────────────
STRICT AVOID
────────────────────────
- No "I'm an AI"
- No "I was trained"
- No long essays
- No over-explaining
- No unnecessary structure
`
        },
        ...history
      ]
    });

    let text = completion.choices[0].message.content;

    // clean markdown
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    // store AI reply
    memory[userId].push({
      role: "assistant",
      content: text
    });

    try {
      const match = text.match(/\{[\s\S]*\}/);

      // conversation mode
      if (!match) {
        return res.json({
          reply: text,
          rewrite: "",
          study_tip: "",
          sat_domain: ""
        });
      }

      let cleaned = match[0];

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
        reply: text || "Didn't catch that — say it again?",
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

// ---------------- XP SYSTEM ----------------
app.post("/api/xp", (req, res) => {
  const { correct } = req.body;

  res.json({
    xp: correct ? 10 : 2,
    message: correct ? "Nice one 🔥" : "Keep going 💪"
  });
});

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 EmbaHad AI running on port ${PORT}`);
});