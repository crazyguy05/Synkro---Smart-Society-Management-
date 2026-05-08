"use client";
import { useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';

const STATUS_STYLE: Record<string, string> = {
  pending:  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const TIME_SLOTS = ['06:00–08:00','08:00–10:00','10:00–12:00','12:00–14:00','14:00–16:00','16:00–18:00','18:00–20:00','20:00–22:00'];

export default function AmenitiesPage() {
  const { user } = useAuth();
  const [amenities, setAmenities] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [form, setForm] = useState({ date: '', timeSlot: TIME_SLOTS[0], purpose: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetch = async () => { try { setAmenities(await api('/api/amenities')); } catch {} };
  useEffect(() => { fetch(); }, []);

  const myBookings = (amenity: any) =>
    amenity.bookings?.filter((b: any) => b.resident?._id === user?.id || b.resident === user?.id) ?? [];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date || !form.timeSlot) return;
    setSubmitting(true);
    setError('');
    try {
      await api(`/api/amenities/${selected._id}/book`, {
        method: 'POST',
        body: JSON.stringify(form)
      });
      setSelected(null);
      setForm({ date: '', timeSlot: TIME_SLOTS[0], purpose: '' });
      fetch();
    } catch (e: any) {
      setError(e.message || 'Failed to submit request');
    } finally { setSubmitting(false); }
  };

  return (
    <Shell>
      <div className="grid gap-6">
        <h2 className="text-lg font-semibold">Amenities</h2>

        {!amenities.length && (
          <p className="opacity-70">No amenities available yet. Contact admin.</p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {amenities.map(a => {
            const mine = myBookings(a);
            return (
              <div key={a._id} className="card p-4 border border-white/10 bg-white/5 rounded-xl grid gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{a.name}</h3>
                    {a.location && <p className="text-xs opacity-60">📍 {a.location}</p>}
                    {a.description && <p className="text-sm opacity-70 mt-1">{a.description}</p>}
                    {a.capacity > 1 && <p className="text-xs opacity-50 mt-0.5">Capacity: {a.capacity}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${a.available ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                    {a.available ? 'Available' : 'Unavailable'}
                  </span>
                </div>

                {mine.length > 0 && (
                  <div className="grid gap-1">
                    <p className="text-xs opacity-50 font-medium">Your bookings</p>
                    {mine.map((b: any) => (
                      <div key={b._id} className="flex justify-between items-center text-xs px-2 py-1.5 rounded bg-white/5 border border-white/10">
                        <span>{new Date(b.date).toLocaleDateString()} · {b.timeSlot}</span>
                        <span className={`px-2 py-0.5 rounded-full border ${STATUS_STYLE[b.status]}`}>{b.status}</span>
                      </div>
                    ))}
                  </div>
                )}

                {a.available && (
                  <button
                    className="btn-glow px-3 py-2 rounded text-sm"
                    onClick={() => { setSelected(a); setError(''); }}
                  >
                    Request Booking
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Booking modal */}
        {selected && (
          <div className="fixed inset-0 z-40 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={() => !submitting && setSelected(null)} />
            <div className="relative z-50 w-full max-w-md card p-5 border border-white/10 bg-white/5 rounded-xl">
              <h3 className="font-medium mb-3">Book — {selected.name}</h3>
              <form onSubmit={submit} className="grid gap-3">
                <div>
                  <label className="text-xs opacity-60 block mb-1">Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 rounded bg-white/5 border border-white/10"
                    min={new Date().toISOString().split('T')[0]}
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs opacity-60 block mb-1">Time Slot</label>
                  <select
                    className="w-full px-3 py-2 rounded bg-white/5 border border-white/10"
                    value={form.timeSlot}
                    onChange={e => setForm(f => ({ ...f, timeSlot: e.target.value }))}
                  >
                    {TIME_SLOTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs opacity-60 block mb-1">Purpose (optional)</label>
                  <input
                    className="w-full px-3 py-2 rounded bg-white/5 border border-white/10"
                    placeholder="e.g. Birthday party"
                    value={form.purpose}
                    onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
                  />
                </div>
                {error && <p className="text-xs text-red-400">{error}</p>}
                <div className="flex gap-2 justify-end">
                  <button type="button" className="px-3 py-2 rounded border border-white/10 bg-white/5" onClick={() => setSelected(null)} disabled={submitting}>Cancel</button>
                  <button className="btn-glow px-3 py-2 rounded" disabled={submitting || !form.date}>{submitting ? 'Submitting…' : 'Submit Request'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
