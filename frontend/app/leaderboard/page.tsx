"use client";
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Leaf, Medal, Award } from 'lucide-react';
import Shell from '../../components/Shell';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';

type Row = {
  _id: string;
  resident?: { _id: string; name: string; apartment?: string };
  points: number;
  badges?: string[];
};

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const fetchData = async () => { try { setRows(await api('/api/leaderboard')); } catch {} };
  useEffect(() => { fetchData(); }, []);

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);
  const myRow = rows.find(r => r.resident?._id === user?.id);

  return (
    <Shell>
      <div>
        <h2 className="heading text-2xl">Green Points Leaderboard</h2>
        <p className="text-sm text-muted">Points earned for energy-wise behaviour and community contributions.</p>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<Trophy size={22} />} title="No points earned yet" description="Start recycling, paying bills on time, and participating to climb the board." />
      ) : (
        <>
          {myRow && (
            <Card className="bg-gradient-to-br from-brand-500/10 to-accent-violet/10 border-brand-500/30">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-violet grid place-items-center shadow-glow">
                  <Leaf size={22} className="text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-muted">Your standing</div>
                  <div className="heading text-lg">
                    #{rows.indexOf(myRow) + 1} · {myRow.points} points
                  </div>
                </div>
                {myRow.badges && myRow.badges.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {myRow.badges.map(b => (
                      <span key={b} className="badge-emerald">{b}</span>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}

          {podium.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:gap-5">
              {/* Render podium in order: 2, 1, 3 for visual height */}
              {[podium[1], podium[0], podium[2]].map((r, idx) => {
                if (!r) return <div key={idx} />;
                const actualRank = rows.indexOf(r) + 1;
                const colors = { 1: 'from-amber-400 to-amber-600', 2: 'from-slate-300 to-slate-500', 3: 'from-orange-400 to-orange-600' };
                return (
                  <motion.div key={r._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                    <Card className="text-center">
                      <div className={`mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br ${colors[actualRank as 1|2|3]} grid place-items-center mb-3`}>
                        {actualRank === 1 ? <Trophy size={24} className="text-white" /> :
                         actualRank === 2 ? <Medal size={22} className="text-white" /> :
                         <Award size={22} className="text-white" />}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-muted">#{actualRank}</div>
                      <div className="heading text-base mt-1 truncate">{r.resident?.name ?? 'Unknown'}</div>
                      {r.resident?.apartment && <div className="text-xs text-muted">{r.resident.apartment}</div>}
                      <div className="heading text-2xl mt-2 gradient-text">{r.points}</div>
                      <div className="text-[11px] text-muted">points</div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {rest.length > 0 && (
            <Card className="p-0 overflow-hidden">
              <ul className="divide-y divide-[var(--border)]">
                {rest.map((r, i) => (
                  <li key={r._id} className="flex items-center gap-3 px-5 py-3">
                    <span className="h-7 w-7 grid place-items-center rounded-lg text-xs font-bold bg-white/5 text-muted">
                      {i + 4}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{r.resident?.name ?? 'Unknown'}</div>
                      {r.resident?.apartment && <div className="text-xs text-muted">{r.resident.apartment}</div>}
                    </div>
                    {r.badges && r.badges.length > 0 && (
                      <div className="hidden sm:flex gap-1.5">
                        {r.badges.slice(0, 2).map(b => <span key={b} className="badge-emerald">{b}</span>)}
                      </div>
                    )}
                    <span className="text-sm font-semibold w-12 text-right">{r.points}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </Shell>
  );
}
