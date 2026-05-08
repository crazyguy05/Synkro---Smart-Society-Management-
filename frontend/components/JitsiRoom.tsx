"use client";
import { useEffect, useRef } from 'react';

const JITSI_DOMAIN = 'meet.jit.si';
const ROOM_PREFIX = 'SynkroSociety_';
const SCRIPT_ID = 'jitsi-external-api';

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (domain: string, options: Record<string, unknown>) => JitsiApi;
  }
}
type JitsiApi = {
  dispose: () => void;
  addEventListener: (event: string, listener: () => void) => void;
};

function loadScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.JitsiMeetExternalAPI) return Promise.resolve();
  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Jitsi script failed to load')));
    });
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.id = SCRIPT_ID;
    s.src = `https://${JITSI_DOMAIN}/external_api.js`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Jitsi script failed to load'));
    document.body.appendChild(s);
  });
}

export default function JitsiRoom({
  roomId,
  displayName,
  email,
  onLeave,
  height = 'calc(100vh - 220px)',
}: {
  roomId: string;
  displayName?: string;
  email?: string;
  onLeave?: () => void;
  height?: string;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<JitsiApi | null>(null);

  useEffect(() => {
    if (!roomId || !mountRef.current) return;
    let cancelled = false;
    const fullRoom = `${ROOM_PREFIX}${roomId.replace(/\s+/g, '_')}`;

    loadScript()
      .then(() => {
        if (cancelled || !mountRef.current || !window.JitsiMeetExternalAPI) return;
        const api = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
          roomName: fullRoom,
          parentNode: mountRef.current,
          width: '100%',
          height: '100%',
          configOverrides: {
            startWithAudioMuted: true,
            startWithVideoMuted: false,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
          },
          interfaceConfigOverrides: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_BRAND_WATERMARK: false,
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'desktop', 'chat',
              'raisehand', 'participants-pane', 'tileview',
              'hangup', 'fullscreen',
            ],
          },
          userInfo: {
            displayName: displayName || 'Resident',
            email: email || undefined,
          },
        });
        api.addEventListener('readyToClose', () => {
          if (onLeave) onLeave();
        });
        apiRef.current = api;
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [roomId, displayName, email, onLeave]);

  return (
    <div
      ref={mountRef}
      className="card overflow-hidden p-0 rounded-2xl"
      style={{ height }}
    />
  );
}
