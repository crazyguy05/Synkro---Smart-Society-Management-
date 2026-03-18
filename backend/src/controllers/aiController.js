import OpenAI from 'openai';
import axios from 'axios';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b';
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS || 60000);

const SYSTEM_PROMPT = `You are an experienced housing society operations manager with 20 years of field experience. A resident has filed a complaint. Your job is to give the admin a PRACTICAL, SPECIFIC action plan — not generic advice like "call an expert" (that is obvious).

Your suggestion MUST include:
1. An immediate safety or containment step residents/staff should take RIGHT NOW (before any expert arrives)
2. A specific operational action — mention WHO on the society staff should do WHAT, and any equipment/supply needed
3. A preventive follow-up to stop recurrence

Be direct, technical, and specific. Mention exact things like "turn off the MCB for that floor", "check the earthing at the DB box", "use a voltage tester", "post a notice on the wing notice board", "check CCTV footage from camera #X near the area", etc.

NEVER say generic things like "call electrician", "contact plumber", "inform maintenance" — those are obvious. Focus on what the ADMIN and STAFF can do operationally.

Respond with ONLY a JSON object (no markdown, no code fences, no extra text):
{"urgency":"low|medium|high","suggestion":"your detailed specific suggestion here (2-3 sentences max)"}`;

const COMPLAINT_PROMPTS = [
  (text) => `Complaint from resident: "${text}"\n\nWhat specific steps should the society admin and staff take? Be practical and specific — do NOT give generic advice.`,
  (text) => `Resident reported: "${text}"\n\nAs an experienced society manager, what exact operational steps would you take? Include specific safety actions, not just "call an expert".`,
  (text) => `Issue filed: "${text}"\n\nGive a field-level action plan. What should staff do immediately, what equipment/checks are needed, and how to prevent this from recurring?`,
];

function pickPrompt(text) {
  return COMPLAINT_PROMPTS[Math.floor(Math.random() * COMPLAINT_PROMPTS.length)](text);
}

function parseResponse(raw) {
  const trimmed = (raw || '').trim();

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed.suggestion && parsed.urgency) return parsed;
  } catch { /* not pure JSON, try to extract */ }

  const jsonMatch = trimmed.match(/\{[\s\S]*?"urgency"\s*:\s*"[^"]+?"[\s\S]*?"suggestion"\s*:\s*"[^"]*?"[\s\S]*?\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.suggestion && parsed.urgency) return parsed;
    } catch { /* fall through */ }
  }

  const urgencyMatch = /\b(high|medium|low)\b/i.exec(trimmed);
  return {
    urgency: (urgencyMatch?.[1] || 'medium').toLowerCase(),
    suggestion: trimmed.replace(/```json|```/g, '').trim().slice(0, 500) || 'Schedule maintenance and monitor the issue.',
  };
}

async function callOllama(complaintText) {
  try {
    const { data } = await axios.post(
      `${OLLAMA_BASE}/api/chat`,
      {
        model: OLLAMA_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: pickPrompt(complaintText) },
        ],
        stream: false,
        options: { temperature: 0.7, num_predict: 300 },
      },
      { timeout: OLLAMA_TIMEOUT_MS }
    );
    const raw = data?.message?.content;
    if (!raw) return null;
    return { ok: true, ...parseResponse(raw) };
  } catch (err) {
    console.error('Ollama error:', err?.message || err);
    return null;
  }
}

export const suggestForComplaint = async (req, res) => {
  try {
    const { text, category, description } = req.body || {};
    const combined = (typeof text === 'string' && text.trim().length > 0)
      ? text.trim()
      : [category, description].filter(Boolean).join('. ').trim();
    if (!combined || combined.length < 5) return res.status(400).json({ error: 'Provide complaint text or category and description' });

    // 1) Ollama (local)
    const ollamaResult = await callOllama(combined);
    if (ollamaResult?.ok) {
      return res.json({
        urgency: ollamaResult.urgency,
        suggestion: ollamaResult.suggestion,
        provider: 'ollama',
        model: OLLAMA_MODEL,
      });
    }

    // 2) OpenAI fallback
    if (openai) {
      try {
        const prompt = `You are a society manager assistant. For the following complaint, provide a concise suggestion and an urgency (low/medium/high). Complaint: ${combined}`;
        const completion = await openai.responses.create({
          model: 'gpt-4o-mini',
          input: prompt,
          temperature: 0.6,
        });
        const raw = completion.output_text || '';
        let parsed = { suggestion: raw.slice(0, 200), urgency: 'medium' };
        try { parsed = JSON.parse(raw); } catch { /* use raw text */ }
        return res.json({ ...parsed, provider: 'openai', model: 'gpt-4o-mini' });
      } catch (_) {
        // fall through to static
      }
    }

    // 3) Static fallback
    const urgency = /water|electric|gas|leak|smell|fire/i.test(combined) ? 'high' : /noise|lift|elevator|gate/i.test(combined) ? 'medium' : 'low';
    const suggestion = urgency === 'high'
      ? 'Alert maintenance immediately and isolate the affected area.'
      : urgency === 'medium'
        ? 'Schedule a maintenance visit and notify residents if needed.'
        : 'Log the issue and monitor for escalation.';
    return res.json({ urgency, suggestion, provider: 'static' });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to generate suggestion' });
  }
};
