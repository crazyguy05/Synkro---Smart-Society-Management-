"use client";
import Shell from '../../components/Shell';
import { useState } from 'react';
import { api } from '../../lib/api';

export default function AdminPage() {
  const [input, setInput] = useState({ category: 'General', description: '' });
  const [result, setResult] = useState<any>(null);

  const askAI = async (e: React.FormEvent) => {
    e.preventDefault();
    try { setResult(await api('/api/ai/suggest', { method: 'POST', body: JSON.stringify(input) })); } catch {}
  };

  return (
    <Shell>
      <div className="grid gap-4">
        <form onSubmit={askAI} className="card p-4 grid gap-2">
          <h2 className="font-semibold">AI Suggestion</h2>
          <input className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Category" value={input.category} onChange={e=>setInput(v=>({ ...v, category: e.target.value }))} />
          <textarea className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Description" value={input.description} onChange={e=>setInput(v=>({ ...v, description: e.target.value }))} />
          <button className="btn-glow w-fit">Analyze</button>
          {result && (
            <div className="p-3 rounded bg-white/5 border border-white/10">
              <p className="text-sm opacity-80">Urgency: <span className="capitalize">{result.urgency}</span></p>
              <p className="mt-1">{result.suggestion}</p>
            </div>
          )}
        </form>
      </div>
    </Shell>
  );
}
