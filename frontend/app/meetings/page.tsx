"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Shell from "../../components/Shell";
import { useAuth } from "../../lib/auth";

const JITSI_DOMAIN = "meet.jit.si";
const ROOM_PREFIX = "SynkroSociety_";

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function MeetingsPage() {
  const { user } = useAuth();
  const [roomName, setRoomName] = useState("");
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const jitsiRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);

  const displayName = user?.name || "Resident";

  const launchMeeting = useCallback(
    (room: string) => {
      if (!room.trim()) return;
      setActiveRoom(room.trim());
    },
    []
  );

  const leaveMeeting = useCallback(() => {
    if (apiRef.current) {
      apiRef.current.dispose();
      apiRef.current = null;
    }
    setActiveRoom(null);
  }, []);

  useEffect(() => {
    if (!activeRoom || !jitsiRef.current) return;

    const fullRoom = `${ROOM_PREFIX}${activeRoom.replace(/\s+/g, "_")}`;

    const script = document.createElement("script");
    script.src = `https://${JITSI_DOMAIN}/external_api.js`;
    script.async = true;
    script.onload = () => {
      if (!jitsiRef.current) return;
      const api = new (window as any).JitsiMeetExternalAPI(JITSI_DOMAIN, {
        roomName: fullRoom,
        parentNode: jitsiRef.current,
        width: "100%",
        height: "100%",
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
            "microphone", "camera", "desktop", "chat",
            "raisehand", "participants-pane", "tileview",
            "hangup", "fullscreen",
          ],
        },
        userInfo: {
          displayName,
        },
      });

      api.addEventListener("readyToClose", leaveMeeting);
      apiRef.current = api;
    };

    document.body.appendChild(script);

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
      script.remove();
    };
  }, [activeRoom, displayName, leaveMeeting]);

  const quickRooms = [
    { name: "General Meeting", desc: "Open meeting room for all residents" },
    { name: "Committee", desc: "Society committee discussions" },
    { name: "Maintenance", desc: "Maintenance staff coordination" },
  ];

  if (activeRoom) {
    return (
      <Shell>
        <div className="grid gap-3">
          <div className="card p-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Meeting: <span className="text-brand">{activeRoom}</span>
              </h2>
              <p className="opacity-70 text-sm">
                Share this room name with others so they can join
              </p>
            </div>
            <button onClick={leaveMeeting} className="px-4 py-2 rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/30 transition">
              Leave Meeting
            </button>
          </div>
          <div
            ref={jitsiRef}
            className="card overflow-hidden"
            style={{ height: "calc(100vh - 180px)" }}
          />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="grid gap-4">
        <div className="card p-4">
          <h2 className="text-lg font-semibold mb-1">Video Meetings</h2>
          <p className="opacity-70 text-sm">
            Create or join a meeting room. Share the room name with others to
            connect.
          </p>
        </div>

        {/* Join / Create */}
        <div className="card p-4 grid gap-3">
          <h3 className="font-medium">Join or Create a Room</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter room name..."
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && launchMeeting(roomName)}
              className="flex-1 px-3 py-2 rounded bg-white/5 border border-white/10 outline-none focus:border-brand transition"
            />
            <button
              onClick={() => launchMeeting(roomName)}
              disabled={!roomName.trim()}
              className="btn-glow disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Join
            </button>
            <button
              onClick={() => {
                const id = generateRoomId();
                setRoomName(id);
                launchMeeting(id);
              }}
              className="px-4 py-2 rounded-md border border-brand/40 text-brand hover:bg-brand/10 transition"
            >
              New Room
            </button>
          </div>
        </div>

        {/* Quick Rooms */}
        <div className="card p-4 grid gap-3">
          <h3 className="font-medium">Quick Rooms</h3>
          <div className="grid md:grid-cols-3 gap-3">
            {quickRooms.map((r) => (
              <button
                key={r.name}
                onClick={() => launchMeeting(r.name)}
                className="text-left p-4 rounded-lg bg-white/5 border border-white/10 hover:border-brand/40 hover:bg-brand/5 transition"
              >
                <p className="font-medium">{r.name}</p>
                <p className="text-sm opacity-60 mt-1">{r.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}
