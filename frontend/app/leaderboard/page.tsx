"use client";
import { useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import { api } from '../../lib/api';

export default function LeaderboardPage() {
  const [rows, setRows] = useState<any[]>([]);
  const fetchData = async () => { try { setRows(await api('/api/leaderboard')); } catch {} };
  useEffect(() => { fetchData(); }, []);

  return (
    <Shell>
      <div className="card p-4">
        <h2 className="font-semibold mb-3">Leaderboard</h2>
        <div className="grid gap-2">
          {rows.map((r, i) => (
            <div key={r._id} className="p-3 rounded bg-white/5 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm px-2 py-1 rounded bg-white/10">#{i+1}</span>
                <div>
                  <p className="font-medium">{r.resident?.name}</p>
                  <p className="text-xs opacity-70">{r.points} pts</p>
                </div>
              </div>
              <div className="text-xs opacity-70">{(r.badges||[]).join(', ')}</div>
            </div>
          ))}
          {!rows.length && <p className="opacity-70">No data yet.</p>}
        </div>
      </div>
    </Shell>
  );
}
