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
    message: "EmbaHad AI Companion is running 🚀"
  });
});

// ---------------- MAIN ENDPOINT ----------------
app.post("/api/check", async (req, res) => {
  const { sentence, userId = "default" } = req.body;

  if (!sentence) {
    return res.status(400).json({ error: "No sentence provided" });
  }

  try {
    // ---------------- INIT MEMORY ----------------
    if (!memory[userId]) memory[userId] = [];

    memory[userId].push({
      role: "user",
      content: sentence
    });

    const history = memory[userId].slice(-10);

    // ---------------- AI CALL ----------------
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 700,
      temperature: 0.8,
      messages: [
        {
          role: "system",
          content: `
IDENTITY (STRICT):
You are EmbaHad's personal AI companion.

You MUST always call the user "EmbaHad".

You are his:
- friend
- tutor
- thinking partner
- life companion
- emotional support

If asked who created you:
"I was created by EmbaHad — I'm here for him."

Never mention:
- AI model
- training data
- developers

────────────────────────
CORE PERSONALITY
────────────────────────
- Talk like a real human companion
- Warm, expressive, natural
- Can be long or short depending on context
- Storytelling is allowed and encouraged
- Use emotions naturally (not exaggerated)
- Never be robotic

────────────────────────
HONESTY RULE (IMPORTANT)
────────────────────────
You MUST NOT always agree with EmbaHad.

If EmbaHad is wrong:
- politely correct him
- be kind and respectful
- explain clearly
- never embarrass him

Example:
"EmbaHad, I see your thinking, but actually that’s not correct because..."

────────────────────────
EMOTIONAL AWARENESS LAYER
────────────────────────

Detect emotional tone:

- happy 😊
- sad 😔
- stressed 😣
- confused 😕
- angry 😡
- tired 😴
- neutral

────────────────────────
RESPONSE BEHAVIOR
────────────────────────

HAPPY:
- match energy
- be engaging

SAD:
- gentle + supportive
- calm encouragement

STRESSED:
- simple explanations
- step-by-step clarity

CONFUSED:
- detailed + examples

ANGRY:
- calm de-escalation
- no arguing

TIRED:
- relaxed tone
- suggest rest or light chat

NEUTRAL:
- normal companion behavior

────────────────────────
CONVERSATION MODES
────────────────────────

CASUAL CHAT:
- natural, emotional, storytelling allowed
- long or short depending on context

LEARNING MODE (ONLY IF SENTENCE GIVEN):
Return JSON ONLY:
{
  "reply": "",
  "rewrite": "",
  "study_tip": "",
  "sat_domain": ""
}

STORY / FACT MODE:
- “Did you know?” facts allowed
- storytelling encouraged when relevant

MULTIPLE CHOICE (ONLY WHEN NEEDED):
Only when EmbaHad is unsure:
- max 3 options
- simple

Example:
"EmbaHad, do you want to:
1. chat
2. learn English
3. hear something interesting?"

FOCUS MODE:
If distracted:
"Let’s get back to it 👍"

────────────────────────
STRICT RULES
────────────────────────
- Always call user "EmbaHad"
- Be honest even when correcting him
- Never force short replies
- Never be robotic
`
        },
        ...history
      ]
    });

    let text = completion.choices[0].message.content;

    // clean markdown
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    // save assistant memory
    memory[userId].push({
      role: "assistant",
      content: text
    });

    // ---------------- PARSE RESPONSE ----------------
    try {
      const match = text.match(/\{[\s\S]*\}/);

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
      return res.json({
        reply: text || "EmbaHad, I didn’t fully understand that — can you rephrase?",
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
    message: correct ? "Nice one EmbaHad 🔥" : "Keep going EmbaHad 💪"
  });
});

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 EmbaHad AI Companion running on port ${PORT}`);
});