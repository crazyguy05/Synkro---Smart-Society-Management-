"use client";
import { useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';

export default function NoticesPage() {
  const { user } = useAuth();
  const [list, setList] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fetchList = async () => { try { setList(await api('/api/notices')); } catch {} };
  useEffect(() => { fetchList(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    try {
      setSubmitting(true);
      await api('/api/notices', { method: 'POST', body: JSON.stringify({ title, body }) });
      setTitle('');
      setBody('');
      setOpen(false);
      fetchList();
    } catch {}
    finally { setSubmitting(false); }
  };

  return (
    <Shell>
      <div className="grid gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Notices</h2>
          {user?.role === 'admin' && (
            <button className="btn-glow px-3 py-2 rounded" onClick={() => setOpen(true)}>Add Notice</button>
          )}
        </div>

        {open && user?.role === 'admin' && (
          <div className="fixed inset-0 z-40 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={() => !submitting && setOpen(false)} />
            <div className="relative z-50 w-full max-w-lg card p-5 border border-white/10 bg-white/5 rounded-xl">
              <h3 className="font-medium mb-3">Post Notice</h3>
              <form onSubmit={submit} className="grid gap-3">
                <input className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
                <textarea className="px-3 py-2 rounded bg-white/5 border border-white/10 min-h-[120px]" placeholder="Body" value={body} onChange={e=>setBody(e.target.value)} />
                <div className="flex gap-2 justify-end">
                  <button type="button" className="px-3 py-2 rounded border border-white/10 bg-white/5" onClick={() => setOpen(false)} disabled={submitting}>Cancel</button>
                  <button className="btn-glow px-3 py-2 rounded" disabled={submitting || !title.trim() || !body.trim()}>{submitting ? 'Publishing…' : 'Publish'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid gap-3">
          {list.map(n => (
            <div key={n._id} className="card p-4 border border-white/10 bg-white/5 rounded-xl">
              <h3 className="font-medium">{n.title}</h3>
              <p className="opacity-80 text-sm">{n.body}</p>
            </div>
          ))}
          {!list.length && <p className="opacity-70">No notices yet.</p>}
        </div>
      </div>
    </Shell>
  );
}
