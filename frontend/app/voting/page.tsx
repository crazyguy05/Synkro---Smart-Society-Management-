"use client";
import { useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';

type Poll = {
  _id: string;
  title: string;
  description?: string;
  options: { text: string; votes: number }[];
  isAnonymous: boolean;
  deadline: string;
  status: 'open' | 'closed';
};

export default function VotingPage() {
  const { user } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [selected, setSelected] = useState<Poll | null>(null);
  const [optionIndex, setOptionIndex] = useState(0);
  const [flatNumber, setFlatNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpHint, setOtpHint] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [results, setResults] = useState<any | null>(null);

  const loadPolls = async () => {
    try {
      const list = await api('/api/voting');
      setPolls(Array.isArray(list) ? list : []);
      if (!selected && list?.length) {
        setSelected(list[0]);
      }
    } catch {
      setPolls([]);
    }
  };

  const loadResults = async (id?: string) => {
    if (!id) return;
    try {
      const r = await api(`/api/voting/${id}/results`);
      setResults(r);
    } catch {}
  };

  useEffect(() => {
    loadPolls();
  }, []);

  useEffect(() => {
    setFlatNumber((user as any)?.apartment || '');
    if (selected?._id) loadResults(selected._id);
  }, [selected, user]);

  const requestOtp = async () => {
    if (!selected) return;
    setMessage(null);
    try {
      const r = await api(`/api/voting/${selected._id}/request-otp`, { method: 'POST' });
      setOtpHint(`Demo OTP: ${r.otp} (valid for 5 mins)`);
    } catch (e: any) {
      setMessage(e?.message || 'Failed to request OTP');
    }
  };

  const vote = async () => {
    if (!selected) return;
    setMessage(null);
    try {
      await api(`/api/voting/${selected._id}/vote`, {
        method: 'POST',
        body: JSON.stringify({ optionIndex, flatNumber, otp }),
      });
      setMessage('Vote submitted.');
      setOtp('');
      await loadPolls();
      await loadResults(selected._id);
    } catch (e: any) {
      setMessage(e?.message || 'Vote failed');
    }
  };

  return (
    <Shell>
      <div className="grid gap-4">
        <div className="card p-4">
          <h2 className="text-lg font-semibold">Digital Voting</h2>
          <p className="text-sm opacity-75">Secure one-vote-per-household voting with OTP and real-time analytics.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="card p-4 lg:col-span-1">
            <h3 className="font-medium mb-2">Active Polls</h3>
            <div className="space-y-2">
              {polls.map((p) => (
                <button
                  key={p._id}
                  className={`w-full text-left px-3 py-2 rounded border ${selected?._id === p._id ? 'border-violet-400 bg-white/10' : 'border-white/10 bg-white/5'}`}
                  onClick={() => setSelected(p)}
                >
                  <div className="font-medium">{p.title}</div>
                  <div className="text-xs opacity-70">{p.status.toUpperCase()} • Deadline: {new Date(p.deadline).toLocaleString()}</div>
                </button>
              ))}
              {polls.length === 0 && <p className="text-sm opacity-70">No polls available.</p>}
            </div>
          </div>

          <div className="card p-4 lg:col-span-2 space-y-3">
            {!selected ? (
              <p className="text-sm opacity-70">Select a poll.</p>
            ) : (
              <>
                <h3 className="font-medium">{selected.title}</h3>
                <p className="text-sm opacity-80">{selected.description || 'No description'}</p>
                <p className="text-xs opacity-70">
                  {selected.isAnonymous ? 'Anonymous voting enabled' : 'Votes linked to household'} • Deadline: {new Date(selected.deadline).toLocaleString()}
                </p>

                <div className="grid md:grid-cols-2 gap-3">
                  <select className="px-3 py-2 rounded bg-white/5 border border-white/10" value={optionIndex} onChange={(e) => setOptionIndex(Number(e.target.value))}>
                    {selected.options.map((o, i) => (
                      <option key={o.text + i} value={i}>
                        {o.text}
                      </option>
                    ))}
                  </select>
                  <input
                    className="px-3 py-2 rounded bg-white/5 border border-white/10"
                    placeholder="Flat Number"
                    value={flatNumber}
                    onChange={(e) => setFlatNumber(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button className="px-3 py-2 rounded border border-white/10 bg-white/5 hover:bg-white/10" onClick={requestOtp}>
                    Request OTP
                  </button>
                  <input
                    className="px-3 py-2 rounded bg-white/5 border border-white/10"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                  <button className="btn-glow px-3 py-2 rounded" onClick={vote}>
                    Submit Vote
                  </button>
                </div>

                <p className="text-xs opacity-70">Demo mode: OTP is fixed as <span className="font-semibold">123456</span> until SMS integration is added.</p>
                {otpHint && <p className="text-xs text-amber-300">{otpHint}</p>}
                {message && <p className="text-sm">{message}</p>}

                {results && (
                  <div className="pt-2 border-t border-white/10 space-y-2">
                    <h4 className="font-medium text-sm">Live Results</h4>
                    <p className="text-xs opacity-70">
                      Participation: {results.householdsParticipated} households ({results.participationPct}%)
                    </p>
                    {results.options.map((o: any) => (
                      <div key={o.text} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{o.text}</span>
                          <span>
                            {o.votes} votes ({o.pct}%)
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-2 rounded-full bg-gradient-to-r from-orange-500 to-fuchsia-500" style={{ width: `${Math.max(5, o.pct)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}

