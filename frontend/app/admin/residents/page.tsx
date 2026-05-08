"use client";
import { useEffect, useState } from 'react';
import Shell from '../../../components/Shell';
import { api } from '../../../lib/api';

const ROLES = ['resident', 'guard', 'staff'];

export default function AdminResidentsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'resident', apartment: '', phone: '' });
  const [error, setError] = useState('');

  const fetch = async () => { try { setUsers(await api('/api/auth/users')); } catch {} };
  useEffect(() => { fetch(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await api('/api/auth/admin/create-user', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      setCreated({ ...form, _id: res.user?.id });
      setForm({ name: '', email: '', password: '', role: 'resident', apartment: '', phone: '' });
      setOpen(false);
      fetch();
    } catch (e: any) {
      setError(e.message || 'Failed to create user');
    } finally { setSubmitting(false); }
  };

  const roleColor = (r: string) =>
    r === 'admin' ? 'bg-purple-500/20 text-purple-400' :
    r === 'resident' ? 'bg-blue-500/20 text-blue-400' :
    r === 'guard' ? 'bg-emerald-500/20 text-emerald-400' :
    'bg-yellow-500/20 text-yellow-400';

  return (
    <Shell>
      <div className="grid gap-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Residents & Users</h2>
          <button className="btn-glow px-3 py-2 rounded" onClick={() => { setOpen(true); setCreated(null); setError(''); }}>
            + Create User
          </button>
        </div>

        {/* Credentials card shown after creation */}
        {created && (
          <div className="card p-4 border border-emerald-500/30 bg-emerald-500/5 rounded-xl grid gap-1">
            <p className="text-sm font-semibold text-emerald-400">✅ User created — share these credentials</p>
            <p className="text-sm">Name: <span className="font-mono">{created.name}</span></p>
            <p className="text-sm">Email: <span className="font-mono">{created.email}</span></p>
            <p className="text-sm">Password: <span className="font-mono">{created.password}</span></p>
            {created.apartment && <p className="text-sm">Flat: <span className="font-mono">{created.apartment}</span></p>}
            <button className="text-xs opacity-50 text-left mt-1" onClick={() => setCreated(null)}>Dismiss</button>
          </div>
        )}

        {/* Users table */}
        <div className="overflow-auto rounded border border-white/10">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Role</th>
                <th className="text-left p-3">Flat</th>
                <th className="text-left p-3">Area (sq ft)</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} className="border-t border-white/10">
                  <td className="p-3 font-medium">{u.name}</td>
                  <td className="p-3 opacity-70">{u.email}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs ${roleColor(u.role)}`}>{u.role}</span></td>
                  <td className="p-3 opacity-70">{u.apartment || '—'}</td>
                  <td className="p-3 opacity-70">{u.areaSqFt || '—'}</td>
                </tr>
              ))}
              {!users.length && <tr><td colSpan={5} className="p-4 opacity-50">No users found.</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Create user modal */}
        {open && (
          <div className="fixed inset-0 z-40 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={() => !submitting && setOpen(false)} />
            <div className="relative z-50 w-full max-w-md card p-5 border border-white/10 bg-white/5 rounded-xl">
              <h3 className="font-medium mb-3">Create User Account</h3>
              <form onSubmit={submit} className="grid gap-3">
                <input className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Full Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                <input type="email" className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                <input className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
                <div className="grid grid-cols-2 gap-3">
                  <select className="px-3 py-2 rounded bg-white/5 border border-white/10" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                    {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                  </select>
                  <input className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Flat No. (e.g. A-101)" value={form.apartment} onChange={e => setForm(f => ({ ...f, apartment: e.target.value }))} />
                </div>
                <input className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Phone (optional)" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                {error && <p className="text-xs text-red-400">{error}</p>}
                <div className="flex gap-2 justify-end">
                  <button type="button" className="px-3 py-2 rounded border border-white/10 bg-white/5" onClick={() => setOpen(false)} disabled={submitting}>Cancel</button>
                  <button className="btn-glow px-3 py-2 rounded" disabled={submitting || !form.name || !form.email || !form.password}>{submitting ? 'Creating…' : 'Create Account'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
