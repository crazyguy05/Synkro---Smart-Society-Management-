"use client";
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Phone, ShieldAlert, Ambulance, Flame, ShieldCheck, Siren, HeartPulse,
  AlertTriangle, Mail, Wrench, UserCog,
} from 'lucide-react';
import Shell from '../../components/Shell';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import PanicButton from '../../components/PanicButton';
import { api } from '../../lib/api';

type DirUser = {
  _id: string; name: string; email: string; role: 'admin' | 'staff' | 'guard';
  phone?: string; apartment?: string;
};

const EMERGENCIES = [
  { label: 'All Emergencies', number: '112', icon: Siren,        tone: 'from-rose-500 to-rose-700' },
  { label: 'Police',          number: '100', icon: ShieldAlert,  tone: 'from-blue-500 to-blue-700' },
  { label: 'Fire Brigade',    number: '101', icon: Flame,        tone: 'from-orange-500 to-rose-600' },
  { label: 'Ambulance',       number: '102', icon: Ambulance,    tone: 'from-emerald-500 to-teal-600' },
  { label: 'Women Helpline',  number: '1091', icon: HeartPulse,  tone: 'from-pink-500 to-violet-600' },
  { label: 'Disaster',        number: '108',  icon: AlertTriangle, tone: 'from-amber-500 to-orange-600' },
];

const roleMeta: Record<string, { label: string; icon: React.ComponentType<any>; tone: string }> = {
  guard: { label: 'Security Guards', icon: ShieldCheck, tone: 'from-emerald-500 to-cyan-500' },
  staff: { label: 'Maintenance Staff', icon: Wrench,    tone: 'from-amber-500 to-orange-500' },
  admin: { label: 'Society Admins',   icon: UserCog,    tone: 'from-brand-500 to-accent-violet' },
};

export default function HelpPage() {
  const [dir, setDir] = useState<DirUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setDir(await api('/api/auth/directory')); } catch {} finally { setLoading(false); }
    })();
  }, []);

  const byRole = {
    guard: dir.filter(d => d.role === 'guard'),
    staff: dir.filter(d => d.role === 'staff'),
    admin: dir.filter(d => d.role === 'admin'),
  };

  return (
    <Shell>
      <div>
        <h2 className="heading text-2xl">Emergency & Help</h2>
        <p className="text-sm text-muted">Quick-dial emergency services and reach out to your society team.</p>
      </div>

      {/* Hero: panic + note */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-transparent to-accent-violet/10" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-rose-500 to-accent-pink grid place-items-center shadow-glow flex-shrink-0">
              <Siren size={22} className="text-white" />
            </div>
            <div>
              <h3 className="heading text-lg">In a life-threatening emergency?</h3>
              <p className="text-sm text-muted mt-0.5">Hit the panic button to alert society security & admin instantly via call + SMS.</p>
            </div>
          </div>
          <PanicButton />
        </div>
      </Card>

      {/* Emergency service hotlines */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="heading text-base">Emergency Hotlines</h3>
          <Badge tone="rose">24×7</Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {EMERGENCIES.map((e, i) => {
            const Icon = e.icon;
            return (
              <motion.a
                key={e.number}
                href={`tel:${e.number}`}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="card p-5 hover:-translate-y-0.5 hover:shadow-glow transition group"
              >
                <div className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${e.tone} grid place-items-center shadow-glow mb-4`}>
                  <Icon size={20} className="text-white" />
                </div>
                <div className="text-xs text-muted">{e.label}</div>
                <div className="heading text-3xl gradient-text mt-1">{e.number}</div>
                <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-brand-400 group-hover:text-brand-300">
                  <Phone size={12} /> Tap to call
                </div>
              </motion.a>
            );
          })}
        </div>
      </section>

      {/* Society directory */}
      <section className="space-y-5">
        <h3 className="heading text-base">Society Team</h3>
        {loading ? (
          <div className="card p-8 text-center text-sm text-muted">Loading directory…</div>
        ) : dir.length === 0 ? (
          <div className="card p-8 text-center text-sm text-muted">No contacts available yet.</div>
        ) : (
          (['guard', 'staff', 'admin'] as const).map(role => {
            const meta = roleMeta[role];
            const Icon = meta.icon;
            const people = byRole[role];
            if (!people.length) return null;
            return (
              <div key={role}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`h-8 w-8 rounded-xl bg-gradient-to-br ${meta.tone} grid place-items-center`}>
                    <Icon size={15} className="text-white" />
                  </div>
                  <h4 className="heading text-sm">{meta.label}</h4>
                  <span className="text-xs text-muted">({people.length})</span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {people.map(p => <ContactCard key={p._id} p={p} />)}
                </div>
              </div>
            );
          })
        )}
      </section>
    </Shell>
  );
}

function ContactCard({ p }: { p: DirUser }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className="h-11 w-11 rounded-full bg-gradient-to-br from-brand-500 to-accent-violet grid place-items-center text-white font-semibold flex-shrink-0">
        {p.name?.[0]?.toUpperCase() ?? '?'}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-medium text-sm truncate">{p.name}</div>
        <div className="text-xs text-muted capitalize truncate">{p.role}{p.apartment ? ` · ${p.apartment}` : ''}</div>
      </div>
      <div className="flex gap-1.5">
        {p.phone && (
          <a
            href={`tel:${p.phone}`}
            className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition"
            aria-label={`Call ${p.name}`}
            title={p.phone}
          >
            <Phone size={15} />
          </a>
        )}
        {p.email && (
          <a
            href={`mailto:${p.email}`}
            className="p-2 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 transition"
            aria-label={`Email ${p.name}`}
            title={p.email}
          >
            <Mail size={15} />
          </a>
        )}
      </div>
    </div>
  );
}
