"use client";
import { useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';

type EmergencyContact = { name: string; phone: string; whatsapp?: string };
type ServiceProvider = {
  _id: string;
  name: string;
  serviceType: string;
  phone: string;
  whatsapp?: string;
  verified: boolean;
  availability: 'online' | 'offline';
  notes?: string;
};
type HelpRequest = {
  _id: string;
  title: string;
  details?: string;
  contactPhone?: string;
  apartment?: string;
  requester?: { name?: string; apartment?: string };
  status: 'open' | 'closed';
};

const toWa = (n?: string) => (n ? `https://wa.me/${n.replace(/[^\d]/g, '')}` : '#');
const toTel = (n?: string) => (n ? `tel:${n}` : '#');

export default function HelpHubPage() {
  const { user } = useAuth();
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [services, setServices] = useState<ServiceProvider[]>([]);
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const [newReq, setNewReq] = useState({ title: '', details: '', contactPhone: '' });
  const [newService, setNewService] = useState({
    name: '',
    serviceType: 'Plumber',
    phone: '',
    whatsapp: '',
    availability: 'online',
    notes: '',
  });

  const load = async () => {
    try {
      const data = await api('/api/help');
      setEmergencyContacts(data.emergencyContacts || []);
      setServices(data.services || []);
      setRequests(data.neighborHelp || []);
    } catch (e: any) {
      setMsg(e?.message || 'Failed to load help hub');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const postRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      await api('/api/help/requests', { method: 'POST', body: JSON.stringify(newReq) });
      setNewReq({ title: '', details: '', contactPhone: '' });
      await load();
      setMsg('Help request posted.');
    } catch (e: any) {
      setMsg(e?.message || 'Failed to post request');
    }
  };

  const closeRequest = async (id: string) => {
    try {
      await api(`/api/help/requests/${id}/close`, { method: 'PATCH' });
      await load();
    } catch {}
  };

  const addService = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      await api('/api/help/services', { method: 'POST', body: JSON.stringify(newService) });
      setNewService({ name: '', serviceType: 'Plumber', phone: '', whatsapp: '', availability: 'online', notes: '' });
      await load();
      setMsg('Service provider added.');
    } catch (e: any) {
      setMsg(e?.message || 'Failed to add service');
    }
  };

  const toggleAvailability = async (row: ServiceProvider) => {
    try {
      await api(`/api/help/services/${row._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ availability: row.availability === 'online' ? 'offline' : 'online' }),
      });
      await load();
    } catch {}
  };

  return (
    <Shell>
      <div className="grid gap-4">
        <div className="card p-4">
          <h2 className="text-lg font-semibold">Quick Help Directory - Smart Assistance Hub</h2>
          <p className="text-sm opacity-75">Emergency contacts, verified services, and resident-to-resident help with one-tap actions.</p>
        </div>

        {msg && (
          <div className="card p-3">
            <p className="text-sm">{msg}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="card p-4 space-y-3">
            <h3 className="font-medium">Emergency Contacts</h3>
            {emergencyContacts.map((c) => (
              <div key={`${c.name}-${c.phone}`} className="rounded border border-white/10 p-3 bg-white/5">
                <p className="font-medium">{c.name}</p>
                <p className="text-sm opacity-80">{c.phone}</p>
                <div className="flex gap-2 mt-2">
                  <a href={toTel(c.phone)} className="px-3 py-1 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-sm">Call</a>
                  {c.whatsapp && (
                    <a href={toWa(c.whatsapp)} target="_blank" className="px-3 py-1 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-sm">
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="card p-4 lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Verified Local Services</h3>
              <p className="text-xs opacity-70">Online/offline shown live</p>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {services.map((s) => (
                <div key={s._id} className="rounded border border-white/10 p-3 bg-white/5">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-sm opacity-75">{s.serviceType} {s.verified ? '• Verified' : ''}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${s.availability === 'online' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-500/20 text-zinc-300'}`}>
                      {s.availability}
                    </span>
                  </div>
                  <p className="text-sm opacity-80 mt-1">{s.phone}</p>
                  <div className="flex gap-2 mt-2">
                    <a href={toTel(s.phone)} className="px-3 py-1 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-sm">Call</a>
                    <a href={toWa(s.whatsapp || s.phone)} target="_blank" className="px-3 py-1 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-sm">WhatsApp</a>
                    {user?.role === 'admin' && (
                      <button onClick={() => toggleAvailability(s)} className="px-3 py-1 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-sm">
                        Toggle
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <form onSubmit={postRequest} className="card p-4 grid gap-2">
            <h3 className="font-medium">Resident-to-Resident Help</h3>
            <input className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Need what? (e.g. Need drill machine)" value={newReq.title} onChange={(e) => setNewReq((v) => ({ ...v, title: e.target.value }))} />
            <textarea className="px-3 py-2 rounded bg-white/5 border border-white/10 min-h-[90px]" placeholder="Details" value={newReq.details} onChange={(e) => setNewReq((v) => ({ ...v, details: e.target.value }))} />
            <input className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Contact phone" value={newReq.contactPhone} onChange={(e) => setNewReq((v) => ({ ...v, contactPhone: e.target.value }))} />
            <button className="btn-glow w-fit px-3 py-2 rounded">Post Help Request</button>
          </form>

          <div className="card p-4 lg:col-span-2 space-y-2">
            <h3 className="font-medium">Open Neighbor Help Requests</h3>
            {requests.map((r) => (
              <div key={r._id} className="rounded border border-white/10 p-3 bg-white/5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{r.title}</p>
                    <p className="text-sm opacity-80">{r.details || 'No details'}</p>
                    <p className="text-xs opacity-70 mt-1">
                      By {r.requester?.name || 'Resident'} • Flat {r.requester?.apartment || r.apartment || 'N/A'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {r.contactPhone && <a href={toTel(r.contactPhone)} className="px-2 py-1 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-xs">Call</a>}
                    {r.contactPhone && <a href={toWa(r.contactPhone)} target="_blank" className="px-2 py-1 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-xs">WhatsApp</a>}
                    {(user?.role === 'admin' || user?.id === (r as any)?.requester?._id) && (
                      <button onClick={() => closeRequest(r._id)} className="px-2 py-1 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-xs">
                        Mark Closed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {requests.length === 0 && <p className="text-sm opacity-70">No open help requests.</p>}
          </div>
        </div>

        {user?.role === 'admin' && (
          <form onSubmit={addService} className="card p-4 grid gap-2">
            <h3 className="font-medium">Admin: Add Verified Service</h3>
            <div className="grid md:grid-cols-5 gap-2">
              <input className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Name" value={newService.name} onChange={(e) => setNewService((v) => ({ ...v, name: e.target.value }))} />
              <select className="px-3 py-2 rounded bg-white/5 border border-white/10" value={newService.serviceType} onChange={(e) => setNewService((v) => ({ ...v, serviceType: e.target.value }))}>
                <option>Plumber</option>
                <option>Electrician</option>
                <option>Maid</option>
                <option>Carpenter</option>
                <option>Technician</option>
                <option>Other</option>
              </select>
              <input className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="Phone" value={newService.phone} onChange={(e) => setNewService((v) => ({ ...v, phone: e.target.value }))} />
              <input className="px-3 py-2 rounded bg-white/5 border border-white/10" placeholder="WhatsApp" value={newService.whatsapp} onChange={(e) => setNewService((v) => ({ ...v, whatsapp: e.target.value }))} />
              <select className="px-3 py-2 rounded bg-white/5 border border-white/10" value={newService.availability} onChange={(e) => setNewService((v) => ({ ...v, availability: e.target.value }))}>
                <option value="online">online</option>
                <option value="offline">offline</option>
              </select>
            </div>
            <textarea className="px-3 py-2 rounded bg-white/5 border border-white/10 min-h-[70px]" placeholder="Notes" value={newService.notes} onChange={(e) => setNewService((v) => ({ ...v, notes: e.target.value }))} />
            <button className="btn-glow w-fit px-3 py-2 rounded">Add Service Provider</button>
          </form>
        )}
      </div>
    </Shell>
  );
}

