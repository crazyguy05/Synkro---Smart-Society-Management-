"use client";
import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '../lib/auth';

export default function QrPassModal() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [countdown, setCountdown] = useState(30);

  const userId = useMemo(() => user?.id || '12345', [user?.id]);

  useEffect(() => {
    if (!open) return;

    const makeToken = () => `user_id:${userId}|timestamp:${Date.now()}`;
    const refresh = () => {
      setToken(makeToken());
      setCountdown(30);
    };

    refresh();
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          refresh();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, userId]);

  useEffect(() => {
    let mounted = true;
    const renderQr = async () => {
      if (!token) return;
      try {
        const dataUrl = await QRCode.toDataURL(token, {
          width: 220,
          margin: 2,
          color: { dark: '#111827', light: '#ffffff' },
        });
        if (mounted) setQrDataUrl(dataUrl);
      } catch {
        if (mounted) setQrDataUrl('');
      }
    };
    renderQr();
    return () => {
      mounted = false;
    };
  }, [token]);

  return (
    <>
      <button className="btn-glow" onClick={() => setOpen(true)}>
        Pass
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-white/10 bg-[var(--card)] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">My Entry Pass</h3>
              <button
                className="px-2 py-1 rounded border border-white/10 hover:bg-white/5 text-sm"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="flex justify-center">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="Entry pass QR" className="rounded-md bg-white p-2 w-[220px] h-[220px]" />
              ) : (
                <div className="w-[220px] h-[220px] rounded-md bg-white/10 animate-pulse" />
              )}
            </div>

            <p className="text-sm text-center opacity-80 mt-3">This code refreshes automatically</p>
            <p className="text-xs text-center opacity-70 mt-1">Refreshing in {countdown}s</p>
          </div>
        </div>
      )}
    </>
  );
}

