"use client";
import { useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';

export default function VisitorsPage() {
  const { user } = useAuth();
  const [list, setList] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [reason, setReason] = useState('');
  const [resident, setResident] = useState('');

  const fetchList = async () => {
    try { const data = await api('/api/visitors/my'); setList(data); } catch {}
  };
  useEffect(() => { fetchList(); }, []);

  const submitGuard = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api('/api/visitors', { method: 'POST', body: JSON.stringify({ name, reason, resident }) }); setName(''); setReason(''); setResident(''); } catch {}
  };

  const setStatus = async (id: string, status: string) => {
    try { await api(`/api/visitors/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); fetchList(); } catch {}
  };

  return (
    <Shell>
      <div className="grid gap-4">
        {user?.role === 'guard' && (
          <form onSubmit={submitGuard} className="card p-4 grid gap-2">
            <h2 className="font-semibold">Log Visitor</h2>
            <input className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
            <input className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Reason" value={reason} onChange={e=>setReason(e.target.value)} />
            <input className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Resident User ID" value={resident} onChange={e=>setResident(e.target.value)} />
            <button className="btn-glow w-fit">Save</button>
          </form>
        )}
        {user?.role === 'resident' && (
          <div className="card p-4">
            <h2 className="font-semibold mb-3">Visitor Requests</h2>
            <div className="space-y-2">
              {list.map(v => (
                <div key={v._id} className="p-3 rounded bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{v.name}</p>
                    <p className="text-sm opacity-80">{v.reason}</p>
                  </div>
                  <div className="space-x-2">
                    <button className="btn-glow" onClick={()=>setStatus(v._id, 'approved')}>Approve</button>
                    <button className="btn-glow" onClick={()=>setStatus(v._id, 'rejected')}>Reject</button>
                  </div>
                </div>
              ))}
              {!list.length && <p className="opacity-70">No pending visitors.</p>}
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
