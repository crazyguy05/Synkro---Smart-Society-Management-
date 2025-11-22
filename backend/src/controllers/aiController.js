import OpenAI from 'openai';
import axios from 'axios';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const HF_MODEL_ENV = process.env.HUGGINGFACE_MODEL || 'google/flan-t5-small';
const MODEL_URL = `https://api-inference.huggingface.co/models/${encodeURIComponent(HF_MODEL_ENV)}`;
const HF_TIMEOUT_MS = Number(process.env.HUGGINGFACE_TIMEOUT_MS || 60000);

async function callHFWithRetry(prompt, genParams = { max_new_tokens: 60, return_full_text: false, temperature: 0.8, top_p: 0.95 }) {
  const HF_KEY = process.env.HUGGINGFACE_API_KEY;
  if (!HF_KEY) return null;
  const maxAttempts = 3; // ~ up to ~60-90s total with waits
  const waits = [15000, 20000];
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      let { data } = await axios.post(
        MODEL_URL,
        { inputs: prompt, parameters: genParams, options: { wait_for_model: true } },
        { headers: { Authorization: `Bearer ${HF_KEY}` }, timeout: HF_TIMEOUT_MS }
      );
      return { ok: true, data };
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || '';
      const isLoading = /currently loading|please try again/i.test(msg);
      if (attempt < maxAttempts && isLoading) {
        const waitMs = waits[attempt - 1] || 15000;
        await new Promise(r => setTimeout(r, waitMs));
        continue;
      }
      return { ok: false, error: msg };
    }
  }
}

export const suggestForComplaint = async (req, res) => {
  try {
    const { text, category, description } = req.body || {};
    const combined = (typeof text === 'string' && text.trim().length > 0)
      ? text.trim()
      : [category, description].filter(Boolean).join('. ').trim();
    if (!combined || combined.length < 5) return res.status(400).json({ error: 'Provide complaint text or category and description' });

    // 1) Prefer Hugging Face if configured with guided and slightly randomized prompts
    const prompts = [
      `Resident issue: ${combined}. Give a short, specific, and polite action plan with urgency (low/medium/high). Return both in plain text.`,
      `Problem: ${combined}. Respond as a professional society manager with one immediate step and an urgency (low/medium/high). Keep it concise.`,
      `Situation: ${combined}. Suggest one immediate step staff should take and classify urgency (low/medium/high).`
    ];
    const chosenPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    const genParams = { max_new_tokens: 60, return_full_text: false, temperature: 0.8, top_p: 0.95 };
    const hfResult = await callHFWithRetry(chosenPrompt, genParams);
    if (hfResult && hfResult.ok) {
      const data = hfResult.data;
      let generated = '';
      if (Array.isArray(data) && data[0]?.generated_text) {
        generated = data[0].generated_text;
      } else if (data?.generated_text) {
        generated = data.generated_text;
      } else if (typeof data === 'string') {
        generated = data;
      }
      const urgencyMatch = /\b(high|medium|low)\b/i.exec(generated) || [];
      const urgency = (urgencyMatch[1] || 'medium').toLowerCase();
      const suggestion = generated?.trim()?.slice(0, 500) || 'Schedule maintenance and monitor the issue.';
      return res.json({ urgency, suggestion, provider: 'huggingface', model: HF_MODEL_ENV });
    }

    // 2) Try OpenAI if configured
    if (openai) {
      try {
        const prompt = `You are a society manager assistant. For the following complaint, provide a concise suggestion and an urgency (low/medium/high). Complaint: ${combined}`;
        const completion = await openai.responses.create({
          model: 'gpt-4o-mini',
          input: prompt,
          temperature: 0.6
        });
        const text = completion.output_text || '';
        let parsed = { suggestion: text.slice(0, 200), urgency: 'medium' };
        try { parsed = JSON.parse(text); } catch {}
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
