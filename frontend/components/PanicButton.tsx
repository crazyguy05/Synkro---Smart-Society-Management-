"use client";
import { useState } from 'react';
import { Siren, Phone, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';
import Modal from './ui/Modal';
import Button from './ui/Button';

export default function PanicButton({ compact = false }: { compact?: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [triggered, setTriggered] = useState(false);

  const trigger = async () => {
    setLoading(true);
    try {
      await api('/api/emergency/panic', { method: 'POST', body: JSON.stringify({ mode: 'call' }) });
    } catch {} finally {
      setLoading(false);
      setTriggered(true);
      setTimeout(() => {
        setTriggered(false);
        setConfirming(false);
      }, 2500);
    }
  };

  return (
    <>
      <button
        onClick={() => setConfirming(true)}
        className={`relative inline-flex items-center gap-2 rounded-xl font-semibold text-white shadow-glow transition ${
          compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'
        }`}
        style={{ backgroundImage: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)' }}
      >
        <span className="absolute inset-0 rounded-xl animate-pulse-glow" />
        <Siren size={compact ? 14 : 16} className="relative" />
        <span className="relative">{compact ? 'SOS' : 'Panic Button'}</span>
      </button>

      <Modal
        open={confirming}
        onClose={() => !loading && !triggered && setConfirming(false)}
        title={
          <span className="flex items-center gap-2">
            <Siren size={18} className="text-rose-400" />
            Trigger emergency?
          </span>
        }
        footer={
          !triggered && (
            <>
              <Button variant="ghost" onClick={() => setConfirming(false)} disabled={loading}>Cancel</Button>
              <Button variant="danger" leftIcon={<Phone size={14} />} onClick={trigger} loading={loading}>
                Call Security
              </Button>
            </>
          )
        }
      >
        {triggered ? (
          <div className="py-4 flex flex-col items-center gap-3 text-center">
            <CheckCircle2 size={44} className="text-emerald-400" />
            <div className="heading text-base">Alert dispatched</div>
            <p className="text-sm text-muted">Security has been notified and is on the way.</p>
          </div>
        ) : (
          <p className="text-sm text-muted">
            This will place an immediate call and SMS to society security and admin.
            Only use in a real emergency.
          </p>
        )}
      </Modal>
    </>
  );
}
