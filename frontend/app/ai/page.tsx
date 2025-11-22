"use client";
import { useState } from 'react';
import Shell from '../../components/Shell';
import { api } from '../../lib/api';

export default function AIPage() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<any | null>(null);
  const [history, setHistory] = useState<Array<{ q: string; a: any }>>([]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      const out = await api('/api/ai/suggest', { method: 'POST', body: JSON.stringify({ text }) });
      setRes(out);
      setHistory((h) => [{ q: text, a: out }, ...h].slice(0, 5));
    } catch {
      setRes({ urgency: 'medium', suggestion: 'Please try again in a moment.', provider: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const badgeColor = (u?: string) => u === 'high' ? 'bg-red-500/20 text-red-300 border-red-500/30' : u === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

  return (
    <Shell>
      <div className="grid gap-6">
        <div className="card p-6 border border-white/10 bg-white/5 rounded-xl shadow-[0_0_40px_-15px_rgba(0,0,0,0.5)]">
          <h2 className="text-xl font-semibold mb-3">AI Suggestion</h2>
          <p className="text-sm opacity-80 mb-4">Ask for a quick triage. Keep it short for best results.</p>
          <form onSubmit={submit} className="grid gap-3">
            <textarea
              className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 min-h-[110px]"
              placeholder="Describe your issue... e.g. Water is leaking under the kitchen sink and floor is wet."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="flex items-center gap-3">
              <button className="btn-glow px-4 py-2 rounded-lg" disabled={loading}>{loading ? 'Analyzing…' : 'Get Suggestion'}</button>
              {res?.urgency && (
                <span className={`px-2 py-1 rounded-md text-xs border ${badgeColor(res.urgency)}`}>Urgency: {res.urgency}</span>
              )}
              {res?.provider && (
                <span className="px-2 py-1 rounded-md text-xs border border-white/10 bg-white/5">{res.provider}</span>
              )}
            </div>
          </form>
          {res?.suggestion && (
            <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10 leading-relaxed">
              {res.suggestion}
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="grid gap-3">
            <h3 className="text-sm font-medium opacity-80">Recent</h3>
            <div className="grid gap-3">
              {history.map((h, i) => (
                <div key={i} className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-xs opacity-70 mb-2">You asked:</div>
                  <div className="mb-3">{h.q}</div>
                  <div className="text-xs opacity-70 mb-1">Suggestion:</div>
                  <div className="text-sm">{h.a?.suggestion}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
