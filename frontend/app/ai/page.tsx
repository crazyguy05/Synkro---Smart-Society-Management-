"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Send, Clock } from 'lucide-react';
import Shell from '../../components/Shell';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge, { statusTone } from '../../components/ui/Badge';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';

type Mode = 'triage' | 'conflict';

export default function AIPage() {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>(user?.role === 'resident' ? 'conflict' : 'triage');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<any | null>(null);
  const [history, setHistory] = useState<Array<{ q: string; a: any; mode: Mode }>>([]);

  const placeholder = mode === 'conflict'
    ? 'My upstairs neighbour plays loud music after 11pm on weekdays. I\'ve asked politely twice but it continues. How should I approach this?'
    : 'Water is leaking under the kitchen sink; floor is wet and the drain seems blocked.';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      const prompt = mode === 'conflict'
        ? `Act as a neutral society mediator. A resident is facing this conflict with a neighbour:\n\n${text}\n\nSuggest a respectful, step-by-step resolution that de-escalates tension, explores the other side, and offers concrete next steps (direct conversation, committee escalation, written notice). Be concise.`
        : text;
      const out = await api('/api/ai/suggest', { method: 'POST', body: JSON.stringify({ text: prompt }) });
      setRes(out);
      setHistory(h => [{ q: text, a: out, mode }, ...h].slice(0, 5));
    } catch {
      setRes({ urgency: 'medium', suggestion: 'Please try again in a moment.', provider: 'error' });
    } finally { setLoading(false); }
  };

  return (
    <Shell>
      <div>
        <h2 className="heading text-2xl">AI Assistant</h2>
        <p className="text-sm text-muted">
          {mode === 'conflict'
            ? 'Describe a dispute with a neighbour and get neutral mediation guidance.'
            : 'Describe an issue and get an urgency + handling suggestion.'}
        </p>
      </div>

      <div className="flex rounded-xl bg-[var(--card-muted)] border border-[var(--border)] p-1 w-fit">
        <button
          onClick={() => { setMode('conflict'); setRes(null); }}
          className={`px-4 py-1.5 text-sm rounded-lg transition ${mode === 'conflict' ? 'bg-gradient-to-br from-brand-500 to-accent-violet text-white shadow-glow' : 'text-[var(--text-muted)]'}`}
        >
          Conflict Resolution
        </button>
        <button
          onClick={() => { setMode('triage'); setRes(null); }}
          className={`px-4 py-1.5 text-sm rounded-lg transition ${mode === 'triage' ? 'bg-gradient-to-br from-brand-500 to-accent-violet text-white shadow-glow' : 'text-[var(--text-muted)]'}`}
        >
          Issue Triage
        </button>
      </div>

      <Card className="relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-gradient-to-br from-brand-500/30 to-accent-violet/30 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-violet grid place-items-center shadow-glow">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h3 className="heading text-lg">
                {mode === 'conflict' ? 'Describe the dispute' : 'Ask the assistant'}
              </h3>
              <p className="text-xs text-muted">
                {mode === 'conflict'
                  ? 'The AI acts as a neutral mediator — it won\'t take sides.'
                  : 'Keep it short and specific for best results.'}
              </p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <textarea
              className="input min-h-[110px]"
              placeholder={placeholder}
              value={text}
              onChange={e => setText(e.target.value)}
            />
            <div className="flex items-center gap-3 flex-wrap">
              <Button type="submit" loading={loading} leftIcon={<Send size={14} />}>
                {mode === 'conflict' ? 'Get Mediation' : 'Get Suggestion'}
              </Button>
              {mode !== 'conflict' && res?.urgency && <Badge tone={statusTone(res.urgency)}>Urgency: {res.urgency}</Badge>}
              {res?.provider && <Badge tone="slate">{res.provider}</Badge>}
            </div>
          </form>

          {res?.suggestion && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="mt-5 p-4 rounded-xl border border-[var(--border)] bg-[var(--card-muted)] text-sm leading-relaxed">
              {res.suggestion}
            </motion.div>
          )}
        </div>
      </Card>

      {history.length > 0 && (
        <div>
          <h3 className="heading text-base mb-3 flex items-center gap-2 text-muted"><Clock size={15} /> Recent</h3>
          <div className="grid gap-3">
            {history.map((h, i) => (
              <Card key={i}>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-muted">You asked</div>
                  <Badge tone={h.mode === 'conflict' ? 'violet' : 'brand'}>
                    {h.mode === 'conflict' ? 'Conflict' : 'Triage'}
                  </Badge>
                </div>
                <div className="text-sm mb-3">{h.q}</div>
                <div className="text-xs text-muted mb-1">Suggestion</div>
                <div className="text-sm whitespace-pre-wrap">{h.a?.suggestion}</div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </Shell>
  );
}
