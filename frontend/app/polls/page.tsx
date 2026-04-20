"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Vote, Check, Settings2, Users } from 'lucide-react';
import Shell from '../../components/Shell';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';

export default function PollsPage() {
  const { user } = useAuth();
  const [polls, setPolls] = useState<any[]>([]);
  const [voting, setVoting] = useState<string | null>(null);

  const fetchPolls = async () => { try { setPolls(await api('/api/polls')); } catch {} };
  useEffect(() => { fetchPolls(); }, []);

  const vote = async (pollId: string, optionId: string) => {
    setVoting(optionId);
    try {
      const updated = await api(`/api/polls/${pollId}/vote`, {
        method: 'POST', body: JSON.stringify({ optionId }),
      });
      setPolls(prev => prev.map(p => p._id === pollId ? updated : p));
    } catch {} finally { setVoting(null); }
  };

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="heading text-2xl">Community Polls</h2>
          <p className="text-sm text-muted">Have your say on society decisions.</p>
        </div>
        {user?.role === 'admin' && (
          <Link href="/admin/polls"><Button variant="ghost" leftIcon={<Settings2 size={16} />}>Manage Polls</Button></Link>
        )}
      </div>

      {polls.length === 0 ? (
        <EmptyState icon={<Vote size={22} />} title="No active polls" description="When admins create polls, they'll appear here." />
      ) : (
        <div className="space-y-4">
          {polls.map((poll, i) => {
            const total = poll.options.reduce((s: number, o: any) => s + o.voters.length, 0);
            const voted = !!poll.myVote;
            const myOptId = poll.myVote;
            const closed = !poll.active || (poll.endsAt && new Date() > new Date(poll.endsAt));

            return (
              <motion.div key={poll._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="heading text-lg">{poll.question}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                        <span className="inline-flex items-center gap-1"><Users size={12} />{total} vote{total !== 1 ? 's' : ''}</span>
                        {poll.endsAt && <span>Ends {new Date(poll.endsAt).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <Badge tone={closed ? 'slate' : 'emerald'}>{closed ? 'Closed' : 'Active'}</Badge>
                  </div>

                  <div className="space-y-2.5">
                    {poll.options.map((opt: any) => {
                      const pct = total ? Math.round((opt.voters.length / total) * 100) : 0;
                      const isMyVote = myOptId && opt._id.toString() === myOptId.toString();

                      if (!voted && !closed) {
                        return (
                          <button
                            key={opt._id}
                            disabled={voting !== null}
                            onClick={() => vote(poll._id, opt._id)}
                            className="w-full text-left px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card-muted)] hover:border-brand-500/40 hover:shadow-glow transition disabled:opacity-60"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{opt.text}</span>
                              {voting === opt._id && <span className="text-xs text-muted">Voting…</span>}
                            </div>
                          </button>
                        );
                      }

                      return (
                        <div key={opt._id} className="relative rounded-xl border border-[var(--border)] bg-[var(--card-muted)] overflow-hidden">
                          <div
                            className={`absolute inset-y-0 left-0 ${isMyVote ? 'bg-gradient-to-r from-brand-500/30 to-accent-violet/30' : 'bg-white/5'} transition-all duration-700`}
                            style={{ width: `${pct}%` }}
                          />
                          <div className="relative flex items-center justify-between px-4 py-3">
                            <span className={`text-sm font-medium inline-flex items-center gap-2 ${isMyVote ? 'text-brand-400' : ''}`}>
                              {isMyVote && <Check size={14} />}
                              {opt.text}
                            </span>
                            <span className="text-xs text-muted">
                              <span className="font-semibold text-[var(--text)]">{pct}%</span> · {opt.voters.length}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </Shell>
  );
}
