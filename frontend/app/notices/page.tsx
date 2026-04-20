"use client";
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Megaphone, Calendar } from 'lucide-react';
import Shell from '../../components/Shell';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';

type Notice = { _id: string; title: string; body: string; createdAt: string; postedBy?: { name?: string } };

export default function NoticesPage() {
  const { user } = useAuth();
  const [list, setList] = useState<Notice[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchList = async () => { try { setList(await api('/api/notices')); } catch {} };
  useEffect(() => { fetchList(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    try {
      setSubmitting(true);
      await api('/api/notices', { method: 'POST', body: JSON.stringify({ title, body }) });
      setTitle(''); setBody(''); setOpen(false);
      fetchList();
    } catch {} finally { setSubmitting(false); }
  };

  return (
    <Shell>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="heading text-2xl">Society Notices</h2>
          <p className="text-sm text-muted">Announcements from the management.</p>
        </div>
        {user?.role === 'admin' && (
          <Button leftIcon={<Plus size={16} />} onClick={() => setOpen(true)}>Post Notice</Button>
        )}
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<Megaphone size={22} />}
          title="No notices yet"
          description={user?.role === 'admin' ? 'Post the first society update.' : 'Check back later for announcements.'}
          action={user?.role === 'admin' ? <Button onClick={() => setOpen(true)} leftIcon={<Plus size={16} />}>Post Notice</Button> : undefined}
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {list.map((n, i) => (
            <motion.div
              key={n._id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            >
              <Card hoverable>
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-violet-500/10 text-violet-400 grid place-items-center flex-shrink-0">
                    <Megaphone size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="heading text-base leading-tight">{n.title}</h3>
                    <p className="text-sm text-muted mt-1 whitespace-pre-wrap">{n.body}</p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {n.postedBy?.name && <span>by {n.postedBy.name}</span>}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => !submitting && setOpen(false)}
        title="Post New Notice"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={submit} loading={submitting} disabled={!title.trim() || !body.trim()}>Publish</Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-3">
          <Input label="Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Holiday notice, water shutdown…" />
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">Message</label>
            <textarea
              className="input min-h-[120px]"
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Full details of the announcement…"
            />
          </div>
        </form>
      </Modal>
    </Shell>
  );
}
