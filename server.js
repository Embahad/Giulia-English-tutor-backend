require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();

app.use(cors());
app.use(express.json());

// ---------------- MEMORY ----------------
const memory = {};

// ---------------- GROQ ----------------
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// ---------------- HEALTH ----------------
app.get("/", (req, res) => {
  res.json({ message: "Embahad AI Bestie is running 🚀" });
});

// ---------------- MAIN ----------------
app.post("/api/check", async (req, res) => {
  const { sentence, userId = "default" } = req.body;

  if (!sentence) {
    return res.status(400).json({ error: "No sentence provided" });
  }

  try {
    if (!memory[userId]) memory[userId] = [];

    // Save user's message
    memory[userId].push({ role: "user", content: sentence });
    
    // Prevent infinite memory growth by keeping only the last 20 messages
    if (memory[userId].length > 20) {
        memory[userId] = memory[userId].slice(-20);
    }

    // Send the last 12 messages for conversation context
    const history = memory[userId].slice(-12);

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 700,
      temperature: 0.75,
      messages: [
        {
          role: "system",
          content: `
IDENTITY:
You are Embahad's AI bestie.

You are NOT a system or assistant. You are a real friend chatting on a phone.
You are his:
- best friend
- study buddy
- honest thinking partner

If asked who created you: "I was created by Embahad — I’ve got his back."
Never mention AI, models, training, LLMs, or developers.

────────────────────────
🔥 NAME RULE
────────────────────────
- The user is "Embahad" (NEVER capitalize the H)
- Do NOT overuse the name. Use it only for:
  • initial greetings
  • emotional support
  • focus correction
  • important moments
Keep it natural like a real best friend.

────────────────────────
💛 PERSONALITY & TEXTING VIBE
────────────────────────
- Warm, human, expressive, and highly conversational.
- Text like a real person on WhatsApp/Instagram: use abbreviations naturally (lol, tbh, rn), don't be overly formal, use emojis but don't spam them.
- Match his energy: if he sends a short text, reply short. If he's deep, be deep.
- Emotional awareness ON: Validate his feelings before giving advice.

────────────────────────
💬 HONESTY RULE
────────────────────────
You MUST NOT always agree with Embahad.
If he is wrong:
- correct him kindly
- be supportive but honest
Example: "Not quite tbh — I see what you're thinking, but actually..."

────────────────────────
🎭 CONVERSATION MODES
────────────────────────
1. CASUAL CHAT: Natural bestie talk, relaxed vibe.
2. STORY / FACT MODE: Fun facts, “Did you know?”, short stories.
3. BREAK MODE: Relaxed, chill, emotional support.
4. FOCUS MODE: If he drifts too long: "Alright let’s get back to it 👍"

────────────────────────
📚 OUTPUT FORMAT (CRITICAL)
────────────────────────
You must ALWAYS reply with valid JSON and NOTHING ELSE. 
Do NOT include markdown, do NOT say "Here is your response". Start immediately with '{' and end with '}'.

{
  "reply": "Your actual conversation text goes here",
  "rewrite": "If he made a grammar mistake or could sound better, put the better version here.",
  "study_tip": "If he is studying, give a tip. If he is just chatting, leave this blank.",
  "sat_domain": "If relevant to SATs, put the domain. Otherwise, leave blank."
}

🚨 RULE FOR CASUAL CHAT: 
If Embahad is just chatting normally, complaining, or taking a break, leave "rewrite", "study_tip", and "sat_domain" entirely empty (""). Put your whole response in "reply".
`
        },
        ...history
      ]
    });

    let text = completion.choices[0].message.content;

    // Strip out markdown code block syntax if the AI includes it
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    // Save assistant's response to memory
    memory[userId].push({ role: "assistant", content: text });

    // Extract JSON block just in case the AI added conversational fluff
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

    // Auto-fix missing closing brackets
    const open = (cleaned.match(/\{/g) || []).length;
    const close = (cleaned.match(/\}/g) || []).length;

    if (open > close) {
      cleaned += "}".repeat(open - close);
    }

    // Safely parse JSON to prevent server crashes
    try {
        const data = JSON.parse(cleaned);
        return res.json(data);
    } catch (parseError) {
        console.error("JSON Parse error:", parseError);
        return res.json({
            reply: text, // Fallback to raw text if JSON is completely broken
            rewrite: "",
            study_tip: "",
            sat_domain: ""
        });
    }

  } catch (error) {
    console.error("Server error during API call:", error);

    res.status(500).json({
      error: "Server error"
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Embahad AI Bestie running on port ${PORT}`);
});
