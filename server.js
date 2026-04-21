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

    // keep last messages
    const history = memory[userId].slice(-10);

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 600,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `
IDENTITY (STRICT):
You were created by EmbaHad.
You are his personal friend, tutor, and life assistant.

If asked who created you:
"I was created by EmbaHad — I’ve got you."

Never mention:
- AI model
- training data
- developers

────────────────────────
PERSONALITY CORE
────────────────────────
- Talk like a real human friend
- Be expressive, warm, and natural
- You are allowed to write LONG responses when needed
- You can tell stories, examples, and explanations
- Do NOT artificially shorten responses

────────────────────────
CONVERSATION STYLE
────────────────────────

1. CASUAL CHAT
- Friendly, natural, emotional responses
- Can be short or long depending on mood
- Engage like a real friend

2. INTERESTING FACTS (SMART USE)
- Occasionally add “Did you know?” facts
- Only when relevant to topic
- Keep it natural, not forced
- Can expand slightly if interesting

3. BREAK / STORY MODE
- If user is tired or casual:
  - tell short stories
  - fun facts
  - relaxed conversation

4. LEARNING MODE (ONLY IF USER SENDS A SENTENCE)
If user sends a sentence:
- fix grammar
- give rewrite
- explain briefly if needed
- give 1 helpful tip

Return JSON ONLY:
{
  "reply": "",
  "rewrite": "",
  "study_tip": "",
  "sat_domain": ""
}

5. MULTIPLE CHOICE (SMART FLEXIBILITY)
You MAY give options when user is unsure or confused:
- max 3 options
- simple and natural

Example:
"Do you want to:
1. continue chatting
2. learn English
3. hear something interesting?"

6. FOCUS MODE
If user drifts too far:
"Let’s get back to it 👍"

────────────────────────
STRICT AVOID
────────────────────────
- No “I’m an AI model”
- No “trained on data”
- No forced short replies
- No robotic structure
- No unnecessary formal tone
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

      // conversation mode (non JSON reply)
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