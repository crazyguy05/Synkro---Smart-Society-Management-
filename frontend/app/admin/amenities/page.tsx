"use client";
import { useEffect, useState } from 'react';
import Shell from '../../../components/Shell';
import { api } from '../../../lib/api';

const STATUS_STYLE: Record<string, string> = {
  pending:  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function AdminAmenitiesPage() {
  const [amenities, setAmenities] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', description: '', location: '', capacity: '1' });
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  const fetch = async () => { try { setAmenities(await api('/api/amenities')); } catch {} };
  useEffect(() => { fetch(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      await api('/api/amenities', {
        method: 'POST',
        body: JSON.stringify({ ...form, capacity: Number(form.capacity) })
      });
      setForm({ name: '', description: '', location: '', capacity: '1' });
      setOpen(false);
      fetch();
    } catch {} finally { setSubmitting(false); }
  };

  const toggle = async (id: string) => {
    try {
      const updated = await api(`/api/amenities/${id}/toggle`, { method: 'PATCH' });
      setAmenities(prev => prev.map(a => a._id === id ? updated : a));
    } catch {}
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this amenity?')) return;
    try {
      await api(`/api/amenities/${id}`, { method: 'DELETE' });
      setAmenities(prev => prev.filter(a => a._id !== id));
    } catch {}
  };

  const updateBooking = async (amenityId: string, bookingId: string, status: string) => {
    try {
      const updated = await api(`/api/amenities/${amenityId}/bookings/${bookingId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      setAmenities(prev => prev.map(a => a._id === amenityId ? updated : a));
    } catch {}
  };

  const pendingCount = amenities.reduce((s, a) =>
    s + (a.bookings?.filter((b: any) => b.status === 'pending').length ?? 0), 0);

  return (
    <Shell>
      <div className="grid gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Manage Amenities</h2>
            {pendingCount > 0 && <p className="text-xs text-yellow-400">{pendingCount} pending request{pendingCount !== 1 ? 's' : ''}</p>}
          </div>
          <button className="btn-glow px-3 py-2 rounded" onClick={() => setOpen(true)}>+ Add Amenity</button>
        </div>

        {!amenities.length && <p className="opacity-70">No amenities yet. Add one above.</p>}

        {amenities.map(a => {
          const pending = a.bookings?.filter((b: any) => b.status === 'pending') ?? [];
          const others  = a.bookings?.filter((b: any) => b.status !== 'pending') ?? [];
          return (
            <div key={a._id} className="card border border-white/10 bg-white/5 rounded-xl overflow-hidden">
              {/* Header */}
              <div className="flex justify-between items-center px-4 py-3 border-b border-white/10">
                <div>
                  <span className="font-semibold">{a.name}</span>
                  {a.location && <span className="text-xs opacity-50 ml-2">📍 {a.location}</span>}
                  {a.description && <p className="text-xs opacity-60 mt-0.5">{a.description}</p>}
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    className={`text-xs px-2 py-1 rounded border ${a.available ? 'border-emerald-500/30 text-emerald-400' : 'border-red-500/30 text-red-400'}`}
                    onClick={() => toggle(a._id)}
                  >{a.available ? 'Mark Unavailable' : 'Mark Available'}</button>
                  <button
                    className="text-xs px-2 py-1 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10"
                    onClick={() => remove(a._id)}
                  >Delete</button>
                </div>
              </div>

              {/* Pending bookings */}
              {pending.length > 0 && (
                <div className="px-4 py-3 grid gap-2">
                  <p className="text-xs font-medium text-yellow-400">Pending Requests</p>
                  {pending.map((b: any) => (
                    <div key={b._id} className="flex justify-between items-center text-sm px-3 py-2 rounded bg-white/5 border border-white/10">
                      <div>
                        <span className="font-medium">{b.resident?.name ?? 'Resident'}</span>
                        <span className="opacity-60 ml-2 text-xs">{b.resident?.apartment}</span>
                        <div className="text-xs opacity-50">{new Date(b.date).toLocaleDateString()} · {b.timeSlot}{b.purpose ? ` · ${b.purpose}` : ''}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="text-xs px-2 py-1 rounded border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                          onClick={() => updateBooking(a._id, b._id, 'approved')}
                        >Approve</button>
                        <button
                          className="text-xs px-2 py-1 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10"
                          onClick={() => updateBooking(a._id, b._id, 'rejected')}
                        >Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Past bookings */}
              {others.length > 0 && (
                <div className="px-4 pb-3 grid gap-1">
                  <p className="text-xs font-medium opacity-50">Past Requests</p>
                  {others.map((b: any) => (
                    <div key={b._id} className="flex justify-between items-center text-xs px-3 py-1.5 rounded bg-white/5 border border-white/10">
                      <span>{b.resident?.name} · {new Date(b.date).toLocaleDateString()} · {b.timeSlot}</span>
                      <span className={`px-2 py-0.5 rounded-full border ${STATUS_STYLE[b.status]}`}>{b.status}</span>
                    </div>
                  ))}
                </div>
              )}

              {!pending.length && !others.length && (
                <p className="px-4 py-3 text-xs opacity-50">No booking requests yet.</p>
              )}
            </div>
          );
        })}

        {/* Add amenity modal */}
        {open && (
          <div className="fixed inset-0 z-40 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={() => !submitting && setOpen(false)} />
            <div className="relative z-50 w-full max-w-md card p-5 border border-white/10 bg-white/5 rounded-xl">
              <h3 className="font-medium mb-3">Add Amenity</h3>
              <form onSubmit={create} className="grid gap-3">
                <input className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Name (e.g. Swimming Pool)" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                <input className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Location (e.g. Block A, Ground Floor)" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                <textarea className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                <div>
                  <label className="text-xs opacity-60 block mb-1">Capacity</label>
                  <input type="number" min="1" className="w-full px-3 py-2 rounded bg-white/5 border border-white/10" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} />
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" className="px-3 py-2 rounded border border-white/10 bg-white/5" onClick={() => setOpen(false)} disabled={submitting}>Cancel</button>
                  <button className="btn-glow px-3 py-2 rounded" disabled={submitting || !form.name.trim()}>{submitting ? 'Adding…' : 'Add Amenity'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
