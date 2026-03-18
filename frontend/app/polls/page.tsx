"use client";
import { useEffect, useState } from 'react';
import Shell from '../../components/Shell';
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
        method: 'POST',
        body: JSON.stringify({ optionId })
      });
      setPolls(prev => prev.map(p => p._id === pollId ? updated : p));
    } catch {}
    finally { setVoting(null); }
  };

  const hasVoted = (poll: any) => !!poll.myVote;
  const myVote = (poll: any) => poll.myVote;

  const totalVotes = (poll: any) =>
    poll.options.reduce((s: number, o: any) => s + o.voters.length, 0);

  return (
    <Shell>
      <div className="grid gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Community Polls</h2>
          {user?.role === 'admin' && (
            <a href="/admin/polls" className="btn-glow px-3 py-2 rounded text-sm">Manage Polls</a>
          )}
        </div>

        {!polls.length && <p className="opacity-70">No polls yet.</p>}

        {polls.map(poll => {
          const total = totalVotes(poll);
          const voted = hasVoted(poll);
          const myOptId = myVote(poll);
          const closed = !poll.active || (poll.endsAt && new Date() > new Date(poll.endsAt));

          return (
            <div key={poll._id} className="card p-4 border border-white/10 bg-white/5 rounded-xl grid gap-3">
              <div className="flex justify-between items-start">
                <h3 className="font-medium">{poll.question}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${closed ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                  {closed ? 'Closed' : 'Active'}
                </span>
              </div>

              <div className="grid gap-2">
                {poll.options.map((opt: any) => {
                  const pct = total ? Math.round((opt.voters.length / total) * 100) : 0;
                  const isMyVote = myOptId && opt._id.toString() === myOptId.toString();
                  return (
                    <div key={opt._id}>
                      {!voted && !closed ? (
                        <button
                          className="w-full text-left px-3 py-2 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-sm"
                          onClick={() => vote(poll._id, opt._id)}
                          disabled={voting !== null}
                        >
                          {voting === opt._id ? 'Voting…' : opt.text}
                        </button>
                      ) : (
                        <div className="grid gap-1">
                          <div className="flex justify-between text-sm">
                            <span className={isMyVote ? 'text-blue-400 font-medium' : ''}>
                              {opt.text} {isMyVote && '✓'}
                            </span>
                            <span className="opacity-70">{opt.voters.length} ({pct}%)</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                            <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="text-xs opacity-50">
                {total} vote{total !== 1 ? 's' : ''}
                {poll.endsAt ? ` · Ends ${new Date(poll.endsAt).toLocaleDateString()}` : ''}
              </p>
            </div>
          );
        })}
      </div>
    </Shell>
  );
}
